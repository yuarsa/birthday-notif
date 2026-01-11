import { Injectable } from '@nestjs/common';
import { NotificationStrategy } from './notification.strategy.interface';
import { NotificationType } from '../../../common/enums';
import {
  BIRTHDAY_JOB_NAME,
  BIRTHDAY_QUEUE_NAME,
} from '../../notifications/constants/queue.constants';
import { UserDocument } from '../../users/schemas/user.schema';
import { Types } from 'mongoose';

@Injectable()
export class BirthdayNotificationStrategy implements NotificationStrategy {
  getNotificationType(): NotificationType {
    return NotificationType.BIRTHDAY;
  }

  getDateField(): string {
    return 'dateOfBirth';
  }

  getQueueName(): string {
    return BIRTHDAY_QUEUE_NAME;
  }

  getJobName(): string {
    return BIRTHDAY_JOB_NAME;
  }

  getJobId(user: UserDocument, year: number): string {
    return `birthday-${user._id.toString()}-${year}`;
  }

  getJobPayload(
    user: UserDocument,
    logId: Types.ObjectId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Record<string, any> {
    return {
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      logId: logId,
    };
  }
}
