import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { HrService } from './hr.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const hrService = app.get(HrService);
  
  try {
    const candidates = await hrService.getAllCandidates();
    if (candidates.length > 0) {
      const candidate = candidates[0];
      console.log('Generating offer for:', candidate.email);
      await hrService.generateOffer(candidate.id, 'STANDARD');
      console.log('Offer generated successfully!');
    } else {
      console.log('No candidates found');
    }
  } catch (e) {
    console.error('Error generating offer:', e);
  }

  await app.close();
}

bootstrap();
