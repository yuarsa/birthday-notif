export const BIRTHDAY_QUEUE_NAME = 'birthday-notifications';

export const BIRTHDAY_JOB_NAME = 'send-birthday-notification';

export const QUEUE_OPTIONS = {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential' as const,
      delay: 1000,
    },
    removeOnComplete: {
      age: 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 86400,
    },
  },
};
