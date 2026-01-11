import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  NotificationType,
  NotificationUserStatus,
} from '../../../common/enums';

export type NotificationUserDocument = HydratedDocument<NotificationUser>;

@Schema({ timestamps: true, collection: 'notification_user' })
export class NotificationUser {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({ required: true })
  year: number;

  @Prop({
    type: String,
    required: true,
    enum: NotificationUserStatus,
    default: NotificationUserStatus.PENDING,
  })
  status: NotificationUserStatus;

  @Prop()
  processedAt?: Date;

  @Prop()
  errorMessage?: string;
}

export const NotificationUserSchema =
  SchemaFactory.createForClass(NotificationUser);

NotificationUserSchema.index({ userId: 1, type: 1, year: 1 }, { unique: true });
