import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { BirthdayProcessor } from './processors/birthday.processor';
import {
  NotificationLog,
  NotificationLogSchema,
} from './schemas/notification-log.schema';
import { UsersModule } from '../users/users.module';
import { HttpModule } from '@nestjs/axios';
import { EmailProvider } from './providers/email.provider';
import {
  NotificationUser,
  NotificationUserSchema,
} from './schemas/notification-user.schema';
import { BullModule } from '@nestjs/bullmq';
import { BIRTHDAY_QUEUE_NAME } from './constants/queue.constants';
import { RedisModule } from '../../common/redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationLog.name, schema: NotificationLogSchema },
      { name: NotificationUser.name, schema: NotificationUserSchema },
    ]),
    UsersModule,
    HttpModule,
    RedisModule,
    BullModule.registerQueue({
      name: BIRTHDAY_QUEUE_NAME,
    }),
  ],
  providers: [NotificationsService, EmailProvider, BirthdayProcessor],
  exports: [NotificationsService, EmailProvider],
})
export class NotificationsModule {}
