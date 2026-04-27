import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { JwtUserPayload } from './auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'dev_secret_change_me'),
    });
  }

  async validate(payload: JwtUserPayload): Promise<JwtUserPayload> {
    const user = await this.usersRepository.findOne({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedException('Session user no longer exists.');
    }

    return {
      sub: user.id,
      email: user.email,
      displayName: user.display_name,
      name: user.name,
      surname: user.surname,
      role: user.role,
    };
  }
}
