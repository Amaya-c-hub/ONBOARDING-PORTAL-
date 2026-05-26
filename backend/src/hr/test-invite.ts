import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { HrService } from './hr.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const hrService = app.get(HrService);
  
  try {
    const res = await hrService.inviteCandidate('test12345@test.com', 'Test', 'User');
    console.log('Success:', res);
  } catch (e) {
    console.error('Error in inviteCandidate:', e);
  }

  await app.close();
}

bootstrap();
