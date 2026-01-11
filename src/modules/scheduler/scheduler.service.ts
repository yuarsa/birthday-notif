import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  BIRTHDAY_QUEUE_NAME,
  BIRTHDAY_JOB_NAME,
} from '../notifications/constants/queue.constants';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../users/repositories';
import { InjectModel } from '@nestjs/mongoose';
import {
  NotificationUser,
  NotificationUserDocument,
} from '../notifications/schemas/notification-user.schema';
import { Model, Types } from 'mongoose';
import { NotificationType, NotificationUserStatus } from '../../common/enums';
import { NotificationStrategy } from './strategies/notification.strategy.interface';
import { BirthdayNotificationStrategy } from './strategies/birthday.notification.strategy';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  private readonly BATCH_SIZE = 500;

  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    @InjectModel(NotificationUser.name)
    private readonly notificationUserModel: Model<NotificationUserDocument>,
    @InjectQueue(BIRTHDAY_QUEUE_NAME) private readonly birthdayQueue: Queue,
    private readonly birthdayStrategy: BirthdayNotificationStrategy,
  ) {
    this.strategies = [birthdayStrategy];
  }

  private readonly strategies: NotificationStrategy[];

  /**
   * Manually trigger notifications for testing
   */
  async triggerNotification(
    type: NotificationType,
    hour?: number,
  ): Promise<void> {
    const strategy = this.strategies.find(
      (s) => s.getNotificationType() === type,
    );

    if (!strategy) {
      throw new Error(`Strategy for type ${type} not found`);
    }

    let targetHour: number;

    if (hour !== undefined) {
      targetHour = hour;
    } else {
      const birthdayNotificationTime = this.configService.get<string>(
        'notification.birthNotificationTime',
      );

      if (!birthdayNotificationTime) {
        throw new Error('Notification time not configured');
      }

      const [hourString] = birthdayNotificationTime.split(':');
      targetHour = parseInt(hourString, 10);
    }

    await this.processScheduleNotification(strategy, targetHour);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleBirthdayNotifications(): Promise<void> {
    const birthdayNotificationTime = this.configService.get<string>(
      'notification.birthNotificationTime',
    );

    if (!birthdayNotificationTime) {
      this.logger.warn(
        'Birthday notification time not configured, skipping...',
      );

      return;
    }

    const [hourString] = birthdayNotificationTime.split(':');
    const targetHour = parseInt(hourString, 10);

    await this.processScheduleNotification(this.birthdayStrategy, targetHour);
  }

  /**
   * Generic function to create notification schedule
   */
  private async processScheduleNotification(
    strategy: NotificationStrategy,
    targetHour: number,
  ): Promise<void> {
    const currentYear = new Date().getFullYear();
    let hasMore = true;
    let lastId: Types.ObjectId | undefined;
    let totalQueued = 0;

    while (hasMore) {
      const recipients = await this.userRepository.findUsersForBirthdayNotif(
        strategy.getDateField(),
        targetHour,
        this.BATCH_SIZE,
        lastId,
      );

      if (recipients.length === 0) {
        hasMore = false;
        break;
      }

      // Update cursor for next iteration
      lastId = recipients[recipients.length - 1]._id;

      // If we got less than batch size, this is the last batch
      if (recipients.length < this.BATCH_SIZE) {
        hasMore = false;
      }

      for (const user of recipients) {
        try {
          const notification = await this.notificationUserModel.create({
            userId: user._id,
            type: strategy.getNotificationType(),
            year: currentYear,
            status: NotificationUserStatus.PENDING,
          });

          // Determine which queue to use
          let queue: Queue;
          if (strategy.getQueueName() === BIRTHDAY_QUEUE_NAME) {
            queue = this.birthdayQueue;
          } else {
            this.logger.warn(`Queue ${strategy.getQueueName()} not found`);
            continue;
          }

          await queue.add(
            strategy.getJobName(),
            strategy.getJobPayload(user, notification._id),
            { jobId: strategy.getJobId(user, currentYear) },
          );

          totalQueued++;
          this.logger.log(
            `Queued ${strategy.getNotificationType()} for ${user.email} (Target: ${targetHour}:00 Local)`,
          );
        } catch (error) {
          if (
            error instanceof Error &&
            'code' in error &&
            error.code === 11000
          ) {
            this.logger.debug(
              `Skipping ${user.email}: Already processed for year ${currentYear}`,
            );
            continue;
          }

          this.logger.error(
            `Error processing scheduler for ${user.email}`,
            error,
          );
        }
      }
    }

    if (totalQueued > 0) {
      this.logger.log(
        `Total ${strategy.getNotificationType()} notifications queued: ${totalQueued}`,
      );
    }
  }

  /**
   * Get queue statistics for monitoring
   */
  async getQueueStats(): Promise<{
    pending: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }> {
    const counts = await this.birthdayQueue.getJobCounts();
    return {
      pending: counts.waiting,
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
      delayed: counts.delayed,
      paused: counts.paused,
    };
  }

  /**
   * Recovery on startup - re-queue any missed notifications
   */
  async onModuleInit(): Promise<void> {
    this.logger.log(
      'Scheduler starting - checking for missed notifications...',
    );
    await this.recoverMissedNotifications();
  }

  /**
   * Periodic recovery check every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleRecovery(): Promise<void> {
    await this.recoverMissedNotifications();
  }

  /**
   * This handles cases where the service was down or jobs failed without proper status update
   */
  private async recoverMissedNotifications(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const currentYear = new Date().getFullYear();

    const missedNotifications = await this.notificationUserModel
      .find({
        status: NotificationUserStatus.PENDING,
        year: currentYear,
        createdAt: { $lt: oneHourAgo },
      })
      .limit(this.BATCH_SIZE)
      .exec();

    if (missedNotifications.length === 0) {
      return;
    }

    this.logger.log(
      `Found ${missedNotifications.length} missed notifications, re-queueing...`,
    );

    for (const notification of missedNotifications) {
      try {
        // Get user details for the notification
        const user = await this.userRepository.findById(
          notification.userId.toString(),
        );

        if (!user) {
          this.logger.warn(
            `User ${notification.userId.toString()} not found, marking notification as failed`,
          );
          await this.notificationUserModel.findByIdAndUpdate(notification._id, {
            status: NotificationUserStatus.FAILED,
            errorMessage: 'User not found',
          });
          continue;
        }

        // Check if job already exists in queue
        const existingJob = await this.birthdayQueue.getJob(
          `birthday-${user._id.toString()}-${currentYear}`,
        );

        if (existingJob) {
          const state = await existingJob.getState();
          if (
            state === 'active' ||
            state === 'waiting' ||
            state === 'delayed'
          ) {
            this.logger.debug(
              `Job for ${user.email} already in queue (${state}), skipping`,
            );
            continue;
          }
        }

        // Re-queue the notification
        await this.birthdayQueue.add(
          BIRTHDAY_JOB_NAME,
          {
            userId: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            logId: notification._id,
          },
          {
            jobId: `birthday-${user._id.toString()}-${currentYear}-recovery`,
          },
        );

        this.logger.log(`Re-queued birthday notification for ${user.email}`);
      } catch (error) {
        this.logger.error(
          `Failed to recover notification ${notification._id.toString()}`,
          error,
        );
      }
    }
  }
}
