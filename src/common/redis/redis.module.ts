import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedisService } from './redis.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useClass: RedisService,
    }),
  ],
  providers: [RedisService],
  exports: [BullModule, RedisService],
})
export class RedisModule {}
