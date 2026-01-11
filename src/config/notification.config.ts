import { registerAs } from '@nestjs/config';

export default registerAs('notification', () => ({
  birthServiceUrl:
    process.env.BIRTHDAY_SERVICE_URL ||
    'https://email-service.digitalenvision.com.au/send-email',
  birthNotificationTime: process.env.BIRTHDAY_NOTIFICATION_TIME || '09:00',
}));
