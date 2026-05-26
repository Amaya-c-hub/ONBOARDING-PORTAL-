import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // --- SWAGGER SETUP ---
  const config = new DocumentBuilder()
    .setTitle('Onboarding Portal API')
    .setDescription('Authentication and Candidate Management API for the HRMS Portal')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  // ---------------------

  app.use(cookieParser());

  // 1. ENABLE CORS
  const origins = configService.get<string>('ALLOWED_ORIGINS', 'http://localhost:3000').split(',');
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // 2. Add validation pipe for our DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 3. Register Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 4. Enable graceful shutdown
  app.enableShutdownHooks();

  // 5. Start on Port from Config or 3001
  const port = configService.get<number>('PORT', 3001);
  await app.listen(port, '0.0.0.0');
  logger.log(`Backend is running on: http://localhost:${port}`);
  logger.log('Backend successfully restarted and loaded all modules!');
}
bootstrap();
