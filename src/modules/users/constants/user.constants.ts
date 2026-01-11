/**
 * User module constants
 * Centralized configuration values to avoid magic numbers
 */

export const USER_CONSTANTS = {
  /**
   * Password hashing configuration
   */
  PASSWORD: {
    SALT_ROUNDS: 12,
    MIN_LENGTH: 8,
  },

  /**
   * Birthday notification configuration
   */
  NOTIFICATION: {
    DEFAULT_BATCH_SIZE: 100,
    DEFAULT_TIMEZONE: 'UTC',
  },

  /**
   * Query configuration
   */
  QUERY: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
} as const;

/**
 * Repository injection token
 */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
