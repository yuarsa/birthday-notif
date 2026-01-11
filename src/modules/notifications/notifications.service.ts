import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  NotificationLog,
  NotificationLogDocument,
  NotificationStatus,
} from './schemas/notification-log.schema';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(NotificationLog.name)
    private readonly notificationLogModel: Model<NotificationLogDocument>,
  ) {}

  /**
   * Check if notification already exists for today
   */
  async existsForToday(userId: string): Promise<boolean> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const count = await this.notificationLogModel
      .countDocuments({
        userId: new Types.ObjectId(userId),
        createdAt: { $gte: today, $lt: tomorrow },
        status: {
          $in: [NotificationStatus.PENDING, NotificationStatus.SUCCESS],
        },
      })
      .exec();

    return count > 0;
  }

  async createLog(
    userId: string,
    email: string,
  ): Promise<NotificationLogDocument> {
    const log = new this.notificationLogModel({
      userId: new Types.ObjectId(userId),
      email,
      status: NotificationStatus.PENDING,
      attempts: 0,
    });

    await log.save();
    return log;
  }

  async markSuccess(
    logId: string,
    response?: Record<string, unknown>,
  ): Promise<void> {
    await this.notificationLogModel.updateOne(
      { _id: logId },
      {
        $set: {
          status: NotificationStatus.SUCCESS,
          response,
          sentAt: new Date(),
        },
        $inc: { attempts: 1 },
      },
    );

    this.logger.log(`Notification log ${logId} marked as success`);
  }

  async markFailed(logId: string, errorMessage: string): Promise<void> {
    await this.notificationLogModel.updateOne(
      { _id: logId },
      {
        $set: {
          status: NotificationStatus.FAILED,
          errorMessage,
        },
        $inc: { attempts: 1 },
      },
    );

    this.logger.warn(
      `Notification log ${logId} marked as failed: ${errorMessage}`,
    );
  }

  async incrementAttempt(logId: string): Promise<void> {
    await this.notificationLogModel.updateOne(
      { _id: logId },
      { $inc: { attempts: 1 } },
    );
  }

  async getLogsByUserId(
    userId: string,
    limit: number = 10,
  ): Promise<NotificationLogDocument[]> {
    return this.notificationLogModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getRecentLogs(limit: number = 50): Promise<NotificationLogDocument[]> {
    return this.notificationLogModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
