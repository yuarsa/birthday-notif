import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BIRTHDAY_QUEUE_NAME } from '../constants/queue.constants';
import { BirthdayJob } from '../interfaces/birthday-job.interface';
import { EmailProvider } from '../providers/email.provider';
import { ConfigService } from '@nestjs/config';
import {
  NotificationUser,
  NotificationUserDocument,
} from '../schemas/notification-user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { NotificationUserStatus } from '../../../common/enums';

@Processor(BIRTHDAY_QUEUE_NAME)
export class BirthdayProcessor extends WorkerHost {
  private readonly logger = new Logger(BirthdayProcessor.name);
  private readonly birthServiceUrl;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailProvider: EmailProvider,
    @InjectModel(NotificationUser.name)
    private readonly notificationUserModel: Model<NotificationUserDocument>,
  ) {
    super();

    this.birthServiceUrl = configService.getOrThrow<string>(
      'notification.birthServiceUrl',
    );
  }

  /**
   * Process the job to send email
   */
  async process(job: Job<BirthdayJob>): Promise<void> {
    const { email, firstName, lastName, logId } = job.data;

    const message = `Hey, ${firstName} ${lastName} it's your birthday`;

    await this.emailProvider.sendEmail(email, message, this.birthServiceUrl);

    await this.notificationUserModel.findByIdAndUpdate(logId, {
      status: NotificationUserStatus.SUCCESS,
      processedAt: new Date(),
    });

    this.logger.log(`Birthday sent to ${email} successfully.`);
  }

  /**
   * Event for handle failed process
   */
  @OnWorkerEvent('failed')
  async onFailed(job: Job<BirthdayJob> | undefined, error: Error) {
    if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
      this.logger.error(`Giving up on ${job.data.email}: ${error.message}`);

      // Mark as FAILED permanen
      await this.notificationUserModel.findByIdAndUpdate(job.data.logId, {
        status: NotificationUserStatus.FAILED,
        errorMessage: error.message,
      });
    }
  }
}
