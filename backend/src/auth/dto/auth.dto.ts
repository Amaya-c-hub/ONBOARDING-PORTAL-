import { IsEmail, IsString, Length, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'The email address of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Altcha captcha verification token' })
  @IsString()
  @IsOptional()
  captchaToken: string;

  @ApiPropertyOptional({ enum: ['candidate', 'hr', 'manager'], example: 'candidate' })
  @IsOptional()
  @IsIn(['candidate', 'hr', 'manager'])
  selectedRole?: string;

  @ApiPropertyOptional({ description: 'Password (only required for HR/Manager roles)' })
  @IsOptional()
  @IsString()
  password?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: 'The 6-digit OTP code received via email' })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ResendOtpDto {
  @IsString()
  @IsNotEmpty()
  resendToken: string;
}

export class CreateCandidateDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  status?: string;
}
