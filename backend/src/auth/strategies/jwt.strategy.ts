import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

export interface JwtPayload {
  sub:   string; // user id
  email: string;
  role:  string;
  iat?:  number;
  exp?:  number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User) private users: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:    config.get('JWT_PUBLIC_KEY'),
      algorithms:     ['RS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.users.findOneBy({ id: payload.sub, isActive: true });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
