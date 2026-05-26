import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createChallenge, verifySolution } from 'altcha-lib';

@Injectable()
export class CaptchaService {
  constructor(private config: ConfigService) {}

  async generateChallenge() {
    const secret = this.config.get<string>('ALTCHA_HMAC_KEY');
    if (!secret) throw new BadRequestException('ALTCHA config missing');
    return await createChallenge({
      hmacKey: secret,
      maxnumber: 100000 
    });
  }

  async verify(payload: string): Promise<void> {
    const secret = this.config.get<string>('ALTCHA_HMAC_KEY');
    
    try {
      const verified = await verifySolution(payload, secret);
      if (!verified) {
        throw new BadRequestException('Captcha verification failed');
      }
    } catch (e) {
      throw new BadRequestException('Invalid Captcha payload');
    }
  }
}
