import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Stage = 'stage',
  Production = 'production',
}

class EnvVariableValidation {
  @IsEnum(Environment, {
    message: 'NODE_ENV must be one of: development, stage, production',
  })
  @IsOptional()
  NODE_ENV?: Environment;

  @IsNumber({}, { message: 'PORT must be a number' })
  @Min(1, { message: 'PORT must be at least 1' })
  @Max(65535, { message: 'PORT must be at most 65535' })
  @IsOptional()
  APP_PORT?: number;

  @IsString()
  @IsOptional()
  @IsUrl(
    { require_tld: false },
    { message: 'APP_URL must be a valid URL' },
  )
  APP_URL?: string;

  @IsString()
  @IsOptional()
  API_PREFIX?: string;

  @IsString()
  @IsOptional()
  API_VERSION?: string;

  @IsString()
  @IsNotEmpty({ message: 'MONGO_URI is required' })
  @Matches(/^mongodb(\+srv)?:\/\//, {
    message: 'MONGO_URI must be a valid MongoDB connection string',
  })
  MONGO_URI: string;

  @IsString()
  @IsOptional()
  REDIS_HOST?: string;

  @IsNumber({}, { message: 'REDIS_PORT must be a number' })
  @Min(1, { message: 'REDIS_PORT must be at least 1' })
  @Max(65535, { message: 'REDIS_PORT must be at most 65535' })
  @IsOptional()
  REDIS_PORT?: number;

  @IsString()
  @IsOptional()
  REDIS_USERNAME?: string;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsString()
  @IsNotEmpty({ message: 'JWT_SECRET is required' })
  @MinLength(32, {
    message: 'JWT_SECRET must be at least 32 characters for security',
  })
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  @Matches(/^(\d+[smhd]|\d+)$/, {
    message: 'JWT_EXPIRATION must be in format like 7d, 24h, 60m, 3600s',
  })
  JWT_EXPIRATION?: string;

  @IsString()
  @IsNotEmpty({ message: 'BIRTHDAY_SERVICE_URL is required' })
  @IsUrl({}, { message: 'BIRTHDAY_SERVICE_URL must be a valid URL' })
  BIRTHDAY_SERVICE_URL: string;

  // Birthday
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'BIRTHDAY_NOTIFICATION_TIME must be in HH:mm format (e.g., 09:00)',
  })
  BIRTHDAY_NOTIFICATION_TIME?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvVariableValidation, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map((error) => {
      const constraints = error.constraints
        ? Object.values(error.constraints).join(', ')
        : 'Unknown error';
      return `  - ${error.property}: ${constraints}`;
    });

    throw new Error(
      `Environment validation failed:\n${errorMessages.join('\n')}`,
    );
  }

  return validatedConfig;
}
