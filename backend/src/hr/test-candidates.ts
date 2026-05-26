import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { HrService } from './hr.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const hrService = app.get(HrService);
  
  try {
    const candidates = await hrService.getAllCandidates();
    console.log('Candidates fetched:', candidates.length);
  } catch (e) {
    console.error('Error fetching candidates:', e.message);
  }

  await app.close();
}

bootstrap();
