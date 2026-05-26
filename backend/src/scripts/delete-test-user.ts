import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { CandidateEntity } from '../candidates/candidate.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userRepo = app.get(getRepositoryToken(User));
  const candidateRepo = app.get(getRepositoryToken(CandidateEntity));
  
  const email = 'amayac.work@gmail.com';
  
  const candidate = await candidateRepo.findOne({ where: { email } });
  if (candidate) {
    await candidateRepo.remove(candidate);
    console.log('Candidate removed');
  } else {
    console.log('Candidate not found');
  }

  const user = await userRepo.findOne({ where: { email } });
  if (user) {
    await userRepo.remove(user);
    console.log('User removed');
  } else {
    console.log('User not found');
  }

  await app.close();
}

bootstrap();
