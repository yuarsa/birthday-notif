import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { getQueueToken } from '@nestjs/bullmq';
import { UserRepository } from '../users/repositories';
import { NotificationUser } from '../notifications/schemas/notification-user.schema';
import { BIRTHDAY_QUEUE_NAME } from '../notifications/constants/queue.constants';
import { Types } from 'mongoose';
import { NotificationType, NotificationUserStatus } from '../../common/enums';
import { BirthdayNotificationStrategy } from './strategies/birthday.notification.strategy';
import { BIRTHDAY_JOB_NAME } from '../notifications/constants/queue.constants';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let mockConfigService: Partial<ConfigService>;
  let mockUserRepository: Partial<UserRepository>;
  let mockNotificationUserModel: any;
  let mockBirthdayQueue: any;

  const mockUser = {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('09:00'),
      getOrThrow: jest.fn().mockReturnValue('https://api.example.com'),
    };

    mockUserRepository = {
      findUsersForBirthdayNotif: jest.fn().mockResolvedValue([mockUser]),
      findById: jest.fn().mockResolvedValue(mockUser),
    };

    mockNotificationUserModel = {
      create: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: mockUser._id,
        type: NotificationType.BIRTHDAY,
        year: new Date().getFullYear(),
        status: NotificationUserStatus.PENDING,
      }),
      find: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    };

    mockBirthdayQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
      getJobCounts: jest.fn().mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 10,
        failed: 1,
        delayed: 0,
        paused: 0,
      }),
      getJob: jest.fn().mockResolvedValue(null),
    };

    const mockStrategy = {
      getNotificationType: jest.fn().mockReturnValue(NotificationType.BIRTHDAY),
      getDateField: jest.fn().mockReturnValue('dateOfBirth'),
      getQueueName: jest.fn().mockReturnValue(BIRTHDAY_QUEUE_NAME),
      getJobName: jest.fn().mockReturnValue(BIRTHDAY_JOB_NAME),
      getJobId: jest.fn().mockReturnValue('birthday-job-id'),
      getJobPayload: jest.fn().mockReturnValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UserRepository, useValue: mockUserRepository },
        {
          provide: getModelToken(NotificationUser.name),
          useValue: mockNotificationUserModel,
        },
        {
          provide: getQueueToken(BIRTHDAY_QUEUE_NAME),
          useValue: mockBirthdayQueue,
        },
        {
          provide: BirthdayNotificationStrategy,
          useValue: mockStrategy,
        },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleBirthdayNotifications', () => {
    it('should queue birthday notifications for users with birthdays', async () => {
      await service.handleBirthdayNotifications();

      expect(mockUserRepository.findUsersForBirthdayNotif).toHaveBeenCalledWith(
        'dateOfBirth',
        9,
        500,
        undefined,
      );
      expect(mockNotificationUserModel.create).toHaveBeenCalledWith({
        userId: mockUser._id,
        type: NotificationType.BIRTHDAY,
        year: new Date().getFullYear(),
        status: NotificationUserStatus.PENDING,
      });
      expect(mockBirthdayQueue.add).toHaveBeenCalled();
    });

    it('should skip when notification time is not configured', async () => {
      (mockConfigService.get as jest.Mock).mockReturnValue(undefined);

      await service.handleBirthdayNotifications();

      expect(
        mockUserRepository.findUsersForBirthdayNotif,
      ).not.toHaveBeenCalled();
    });

    it('should handle duplicate user gracefully (11000 error)', async () => {
      const duplicateError = new Error('Duplicate key');
      (duplicateError as any).code = 11000;
      mockNotificationUserModel.create.mockRejectedValueOnce(duplicateError);

      // Should not throw
      await expect(
        service.handleBirthdayNotifications(),
      ).resolves.not.toThrow();
    });

    it('should handle empty recipient list', async () => {
      (
        mockUserRepository.findUsersForBirthdayNotif as jest.Mock
      ).mockResolvedValue([]);

      await service.handleBirthdayNotifications();

      expect(mockNotificationUserModel.create).not.toHaveBeenCalled();
      expect(mockBirthdayQueue.add).not.toHaveBeenCalled();
    });

    it('should process multiple batches when there are more users than batch size', async () => {
      // First call returns full batch, second returns partial
      const users = Array(500)
        .fill(null)
        .map((_, i) => ({
          _id: new Types.ObjectId(),
          email: `user${i}@example.com`,
          firstName: `User`,
          lastName: `${i}`,
        }));

      (mockUserRepository.findUsersForBirthdayNotif as jest.Mock)
        .mockResolvedValueOnce(users)
        .mockResolvedValueOnce([mockUser]); // Second batch with 1 user

      await service.handleBirthdayNotifications();

      // Should have called findUsersByTimezone twice
      expect(
        mockUserRepository.findUsersForBirthdayNotif,
      ).toHaveBeenCalledTimes(2);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const stats = await service.getQueueStats();

      expect(stats).toEqual({
        pending: 0,
        active: 0,
        completed: 10,
        failed: 1,
        delayed: 0,
        paused: 0,
      });
    });
  });

  describe('handleRecovery', () => {
    it('should re-queue pending notifications older than 1 hour', async () => {
      const missedNotification = {
        _id: new Types.ObjectId(),
        userId: mockUser._id,
        status: NotificationUserStatus.PENDING,
        year: new Date().getFullYear(),
      };

      mockNotificationUserModel.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([missedNotification]),
        }),
      });

      await service.handleRecovery();

      expect(mockUserRepository.findById).toHaveBeenCalledWith(
        missedNotification.userId.toString(),
      );
      expect(mockBirthdayQueue.add).toHaveBeenCalled();
    });

    it('should skip recovery if no missed notifications found', async () => {
      mockNotificationUserModel.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      await service.handleRecovery();

      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(mockBirthdayQueue.add).not.toHaveBeenCalled();
    });

    it('should mark notification as failed if user not found', async () => {
      const missedNotification = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        status: NotificationUserStatus.PENDING,
        year: new Date().getFullYear(),
      };

      mockNotificationUserModel.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([missedNotification]),
        }),
      });
      (mockUserRepository.findById as jest.Mock).mockResolvedValue(null);

      await service.handleRecovery();

      expect(mockNotificationUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        missedNotification._id,
        {
          status: NotificationUserStatus.FAILED,
          errorMessage: 'User not found',
        },
      );
    });
  });

  describe('onModuleInit', () => {
    it('should call recoverMissedNotifications on startup', async () => {
      const recoverSpy = jest
        .spyOn(service as any, 'recoverMissedNotifications')
        .mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(recoverSpy).toHaveBeenCalled();
    });
  });

  describe('triggerNotification', () => {
    it('should use configured time if no hour provided', async () => {
      const strategySpy = jest
        .spyOn(service as any, 'processScheduleNotification')
        .mockResolvedValue(undefined);
      await service.triggerNotification(NotificationType.BIRTHDAY);
      expect(strategySpy).toHaveBeenCalledWith(expect.anything(), 9);
    });

    it('should use provided hour if specified', async () => {
      const strategySpy = jest
        .spyOn(service as any, 'processScheduleNotification')
        .mockResolvedValue(undefined);
      await service.triggerNotification(NotificationType.BIRTHDAY, 15);
      expect(strategySpy).toHaveBeenCalledWith(expect.anything(), 15);
    });
  });
});
