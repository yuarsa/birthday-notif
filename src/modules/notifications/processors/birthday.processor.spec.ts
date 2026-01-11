import { Test, TestingModule } from '@nestjs/testing';
import { BirthdayProcessor } from './birthday.processor';
import { ConfigService } from '@nestjs/config';
import { EmailProvider } from '../providers/email.provider';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationUser } from '../schemas/notification-user.schema';
import { Types } from 'mongoose';
import { NotificationUserStatus } from '../../../common/enums';
import { Job } from 'bullmq';
import { BirthdayJob } from '../interfaces/birthday-job.interface';

describe('BirthdayProcessor', () => {
  let processor: BirthdayProcessor;
  let mockConfigService: Partial<ConfigService>;
  let mockEmailProvider: Partial<EmailProvider>;
  let mockNotificationUserModel: any;

  const mockJobData: BirthdayJob = {
    userId: new Types.ObjectId().toString(),
    email: 'user1@app.com',
    firstName: 'John',
    lastName: 'Doe',
    logId: new Types.ObjectId().toString(),
  };

  beforeEach(async () => {
    mockConfigService = {
      getOrThrow: jest
        .fn()
        .mockReturnValue(
          'https://email-service.digitalenvision.com.au/send-email',
        ),
    };

    mockEmailProvider = {
      sendEmail: jest.fn().mockResolvedValue({ status: 'sent' }),
    };

    mockNotificationUserModel = {
      findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BirthdayProcessor,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailProvider, useValue: mockEmailProvider },
        {
          provide: getModelToken(NotificationUser.name),
          useValue: mockNotificationUserModel,
        },
      ],
    }).compile();

    processor = module.get<BirthdayProcessor>(BirthdayProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process', () => {
    it('should send email with correct message format', async () => {
      const mockJob = {
        data: mockJobData,
      } as Job<BirthdayJob>;

      await processor.process(mockJob);

      expect(mockEmailProvider.sendEmail).toHaveBeenCalledWith(
        mockJobData.email,
        `Hey, ${mockJobData.firstName} ${mockJobData.lastName} it's your birthday`,
        'https://email-service.digitalenvision.com.au/send-email',
      );
    });

    it('should update notification status to SUCCESS on successful send', async () => {
      const mockJob = {
        data: mockJobData,
      } as Job<BirthdayJob>;

      await processor.process(mockJob);

      expect(mockNotificationUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockJobData.logId,
        expect.objectContaining({
          status: NotificationUserStatus.SUCCESS,
        }),
      );
    });

    it('should include processedAt timestamp on success', async () => {
      const mockJob = {
        data: mockJobData,
      } as Job<BirthdayJob>;

      await processor.process(mockJob);

      expect(mockNotificationUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockJobData.logId,
        expect.objectContaining({
          processedAt: expect.any(Date),
        }),
      );
    });

    it('should propagate error when email sending fails', async () => {
      const mockJob = {
        data: mockJobData,
      } as Job<BirthdayJob>;

      const error = new Error('Email service unavailable');
      (mockEmailProvider.sendEmail as jest.Mock).mockRejectedValue(error);

      await expect(processor.process(mockJob)).rejects.toThrow(
        'Email service unavailable',
      );
    });
  });

  describe('onFailed', () => {
    it('should mark notification as FAILED when max attempts reached', async () => {
      const mockJob = {
        data: mockJobData,
        attemptsMade: 5,
        opts: { attempts: 5 },
      } as unknown as Job<BirthdayJob>;

      const error = new Error('Permanent failure');

      await processor.onFailed(mockJob, error);

      expect(mockNotificationUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockJobData.logId,
        {
          status: NotificationUserStatus.FAILED,
          errorMessage: 'Permanent failure',
        },
      );
    });

    it('should not mark as failed when attempts not exhausted', async () => {
      const mockJob = {
        data: mockJobData,
        attemptsMade: 2,
        opts: { attempts: 5 },
      } as unknown as Job<BirthdayJob>;

      const error = new Error('Temporary failure');

      await processor.onFailed(mockJob, error);

      expect(
        mockNotificationUserModel.findByIdAndUpdate,
      ).not.toHaveBeenCalled();
    });

    it('should handle undefined job gracefully', async () => {
      const error = new Error('Unknown failure');

      // Should not throw
      await expect(processor.onFailed(undefined, error)).resolves.not.toThrow();
    });

    it('should use default attempts (3) when not specified', async () => {
      const mockJob = {
        data: mockJobData,
        attemptsMade: 3,
        opts: {},
      } as unknown as Job<BirthdayJob>;

      const error = new Error('Failure after 3 attempts');

      await processor.onFailed(mockJob, error);

      expect(mockNotificationUserModel.findByIdAndUpdate).toHaveBeenCalled();
    });
  });

  describe('message format', () => {
    it('should generate message without trailing exclamation mark', async () => {
      const mockJob = {
        data: {
          ...mockJobData,
          firstName: 'Test',
          lastName: 'User',
        },
      } as Job<BirthdayJob>;

      await processor.process(mockJob);

      const expectedMessage = `Hey, Test User it's your birthday`;
      expect(mockEmailProvider.sendEmail).toHaveBeenCalledWith(
        expect.any(String),
        expectedMessage,
        expect.any(String),
      );
    });
  });
});
