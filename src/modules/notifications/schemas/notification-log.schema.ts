import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../../common/database/base.schema';

export type NotificationLogDocument = HydratedDocument<NotificationLog>;

export enum NotificationStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
}

@Schema({
  timestamps: true,
  collection: 'notification_logs',
})
export class NotificationLog extends BaseSchema {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  email: string;

  @Prop({
    type: String,
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Prop({
    type: Number,
    default: 0,
  })
  attempts: number;

  @Prop({
    type: String,
  })
  errorMessage?: string;

  @Prop({
    type: Object,
  })
  response?: Record<string, unknown>;

  @Prop({
    type: Date,
  })
  sentAt?: Date;

  @Prop({
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 90, // TTL: 90 days
  })
  expiresAt: Date;
}

export const NotificationLogSchema =
  SchemaFactory.createForClass(NotificationLog);

NotificationLogSchema.index({ userId: 1, createdAt: -1 });
NotificationLogSchema.index({ status: 1 });
NotificationLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
