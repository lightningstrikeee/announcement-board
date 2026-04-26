import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse, AuthUser, JwtUserPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const normalizedEmail = registerDto.email.trim().toLowerCase();
    const existingUser = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const normalizedName = registerDto.name.trim();
    const normalizedSurname = registerDto.surname.trim();
    const displayName = `${normalizedName} ${normalizedSurname}`;
    const passwordHash = await hash(registerDto.password, 10);
    const user = this.usersRepository.create({
      email: normalizedEmail,
      password_hash: passwordHash,
      display_name: displayName,
      name: normalizedName,
      surname: normalizedSurname,
      department: registerDto.department.trim(),
      position: registerDto.position.trim(),
      role: 'user',
    });

    const savedUser = await this.usersRepository.save(user);
    return this.buildAuthResponse(savedUser);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const normalizedEmail = loginDto.email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await compare(loginDto.password, user.password_hash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.buildAuthResponse(user);
  }

  getCurrentUser(payload: JwtUserPayload): AuthUser {
    return {
      id: payload.sub,
      email: payload.email,
      displayName: payload.displayName,
      name: payload.name,
      surname: payload.surname,
      role: payload.role,
    };
  }

  private async buildAuthResponse(user: User): Promise<AuthResponse> {
    const payload: JwtUserPayload = {
      sub: user.id,
      email: user.email,
      displayName: user.display_name,
      name: user.name,
      surname: user.surname,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      user: this.getCurrentUser(payload),
    };
  }
}
