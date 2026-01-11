import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BullRootModuleOptions,
  SharedBullConfigurationFactory,
} from '@nestjs/bullmq';

@Injectable()
export class RedisService implements SharedBullConfigurationFactory {
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {}

  createSharedConfiguration(): BullRootModuleOptions {
    const host = this.configService.getOrThrow<string>('redis.host');
    const port = this.configService.getOrThrow<number>('redis.port');
    const username = this.configService.get<string>('redis.username');
    const password = this.configService.get<string>('redis.password');

    this.logger.log(`Initializing Redis connection to ${host}:${port}`);

    return {
      connection: {
        host,
        port,
        username: username !== 'guest' ? username : undefined,
        password: password !== 'guest' ? password : undefined,
      },
    };
  }
}
