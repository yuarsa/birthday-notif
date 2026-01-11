import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { NotificationType } from '../../common/enums';

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  async triggerManual(
    @Body('type') type: NotificationType,
    @Body('hour') hour?: number,
  ) {
    await this.schedulerService.triggerNotification(type, hour);
    return {
      message: `Triggered ${type} notifications${hour !== undefined ? ` for hour ${hour}` : ''}`,
      timestamp: new Date().toISOString(),
    };
  }
}
