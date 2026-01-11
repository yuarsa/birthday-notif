import { UserDocument } from '../../users/schemas/user.schema';
import { NotificationType } from '../../../common/enums';
import { Types } from 'mongoose';

export interface NotificationStrategy {
  getNotificationType(): NotificationType;
  getDateField(): string;
  getQueueName(): string;
  getJobName(): string;
  getJobId(user: UserDocument, year: number): string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getJobPayload(user: UserDocument, logId: Types.ObjectId): Record<string, any>;
}
