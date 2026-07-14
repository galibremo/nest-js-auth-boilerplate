import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvType } from './core/validators/env';
import { ConfigService } from '@nestjs/config';
import { appLogger, displayStartupInfo } from './core/logging/app.logger';
import { GlobalExceptionFilter } from './shared/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get ConfigService instance
  const configService = app.get(ConfigService<EnvType, true>);

  // Get configuration values
  const originUrls = configService
    .get<string>('ORIGIN_URL', { infer: true })
    .split(',');

  app.enableCors({
    origin: function (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) {
      if (!origin || originUrls.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-csrf-token',
      'ngrok-skip-browser-warning',
    ],
    maxAge: 3600,
  });

  // Add request logging middleware
  app.use(appLogger);

  // Apply global exception filter for custom error responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = configService.get<number>('PORT', 8080);

  await app.listen(port);

  // Display startup information
  displayStartupInfo(port);
}

bootstrap().catch((error) => {
  console.error('Error starting the application:', error);
  process.exit(1);
});
