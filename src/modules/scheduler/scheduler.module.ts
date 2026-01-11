import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { BirthdayNotificationStrategy } from './strategies/birthday.notification.strategy';
import { SchedulerController } from './scheduler.controller';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BullModule } from '@nestjs/bullmq';
import {
  BIRTHDAY_QUEUE_NAME,
  QUEUE_OPTIONS,
} from '../notifications/constants/queue.constants';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NotificationUser,
  NotificationUserSchema,
} from '../notifications/schemas/notification-user.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    UsersModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: BIRTHDAY_QUEUE_NAME,
      ...QUEUE_OPTIONS,
    }),
    MongooseModule.forFeature([
      { name: NotificationUser.name, schema: NotificationUserSchema },
    ]),
  ],
  providers: [SchedulerService, BirthdayNotificationStrategy],
  controllers: [SchedulerController],
  exports: [SchedulerService],
})
export class SchedulerModule {}
