import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailService } from './services/email.service';
import { CaptchaService } from './services/captcha.service';
import { SeedService } from './services/seed.service';
import { User } from './entities/user.entity';
import { Otp } from './entities/otp.entity';
import { Candidate } from './entities/candidate.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Otp, Candidate]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        privateKey:  cfg.get('JWT_PRIVATE_KEY'),
        publicKey:   cfg.get('JWT_PUBLIC_KEY'),
        signOptions: { algorithm: 'RS256' },
      }),
      inject: [ConfigService],
    }),
    AuditModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailService, CaptchaService, SeedService],
  exports: [JwtStrategy, AuthService],
})
export class AuthModule {}
