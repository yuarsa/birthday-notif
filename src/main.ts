import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http.filter';
import { ValidationFilter } from './common/filters/validation.filter';
import { MongooseExceptionFilter } from './common/filters/mongoose.filter';
import { CustomValidationPipe } from './common/pipes/validation.pipe';

const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new MongooseExceptionFilter(),
    new ValidationFilter(),
  );
  app.useGlobalPipes(new CustomValidationPipe());

  const configService = app.get(ConfigService);

  const env = configService.getOrThrow<string>('app.env');
  const host = configService.getOrThrow<string>('app.host');
  const port = configService.getOrThrow<number>('app.port');
  const apiPrefix = configService.getOrThrow<string>('app.api.prefix');
  const apiVersion = configService.getOrThrow<string>('app.api.version');

  app.setGlobalPrefix(apiPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  await app.listen(port, host);

  logger.log('=============================================================');
  logger.log(`Environment: ${env}`);
  logger.log(
    `Server running on: http://${host}:${port}/${apiPrefix}/v${apiVersion}`,
  );
  logger.log('=============================================================');

  return app;
}

bootstrap().catch((error: Error) => {
  logger.error('Failed to start application:', error.message);
  process.exit(1);
});
