import { ConfigService } from '@nestjs/config';
import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Injectable()
export class DatabaseService
  implements
    MongooseOptionsFactory,
    OnApplicationBootstrap,
    OnApplicationShutdown
{
  private readonly logger = new Logger(DatabaseService.name);
  private readonly uri: string;
  private readonly debug: boolean;

  constructor(private readonly configService: ConfigService) {
    this.uri = this.configService.getOrThrow<string>('database.uri');
    this.debug = this.configService.get<boolean>('database.debug', false);
  }

  createMongooseOptions(): MongooseModuleOptions {
    if (this.debug) {
      mongoose.set('debug', true);
    }

    return {
      uri: this.uri,
      autoIndex: true,
      autoCreate: true,
    };
  }

  onApplicationBootstrap(): void {
    const connection = mongoose.connection;

    connection.on('connected', () => {
      this.logger.log('MongoDB connected successfully');
    });

    connection.on('error', (error: Error) => {
      this.logger.error(`MongoDB connection error: ${error.message}`);
    });

    connection.on('disconnected', () => {
      this.logger.warn('MongoDB disconnected');
    });

    this.logger.log('Database service initialized');
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log(`Shutting down database connection (signal: ${signal})`);

    try {
      await mongoose.connection.close();
      this.logger.log('MongoDB connection closed gracefully');
    } catch (error) {
      this.logger.error(`Error closing MongoDB connection: ${error}`);
    }
  }
}
