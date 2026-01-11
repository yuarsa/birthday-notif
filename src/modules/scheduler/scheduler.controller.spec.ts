import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { NotificationType } from '../../common/enums';

describe('SchedulerController', () => {
  let controller: SchedulerController;
  let mockSchedulerService: Partial<SchedulerService>;

  beforeEach(async () => {
    mockSchedulerService = {
      triggerNotification: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulerController],
      providers: [
        { provide: SchedulerService, useValue: mockSchedulerService },
      ],
    }).compile();

    controller = module.get<SchedulerController>(SchedulerController);
  });

  describe('triggerManual', () => {
    it('should trigger notification via service', async () => {
      const type = NotificationType.BIRTHDAY;
      await controller.triggerManual(type);

      expect(mockSchedulerService.triggerNotification).toHaveBeenCalledWith(
        type,
        undefined,
      );
    });

    it('should pass hour override to service', async () => {
      const type = NotificationType.BIRTHDAY;
      const hour = 14;
      await controller.triggerManual(type, hour);

      expect(mockSchedulerService.triggerNotification).toHaveBeenCalledWith(
        type,
        hour,
      );
    });

    it('should return success message', async () => {
      const type = NotificationType.BIRTHDAY;
      const result = await controller.triggerManual(type);

      expect(result).toEqual({
        message: `Triggered ${type} notifications`,
        timestamp: expect.any(String),
      });
    });
  });
});
