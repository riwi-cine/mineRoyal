import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { UserDao } from '../../users/dao/user.dao.js';
import { UsersService } from '../../users/services/users.service.js';
import { RedisService } from '../../../infrastructure/redis/redis.service.js';
import { LoginDto, RegisterDto } from '../dtos/auth.dto.js';
import { hashAuthToken, refreshSessionKey, revokedAccessTokenKey } from '../auth-token.util.js';
import { UserResponseDto } from '../../users/dtos/user-response.dto.js';

interface AccessTokenPayload {
  sub: number;
  email: string;
  sid: string;
  tokenUse: 'access';
  exp: number;
}

interface RefreshTokenPayload {
  sub: number;
  sid: string;
  tokenUse: 'refresh';
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const parseTtl = (value: string | undefined, fallback: number, name: string): number => {
  const ttl = value === undefined ? fallback : Number(value);
  if (!Number.isSafeInteger(ttl) || ttl <= 0) {
    throw new Error(`${name} debe ser un número entero positivo de segundos.`);
  }
  return ttl;
};

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  readonly accessTokenTtlSeconds: number;
  readonly refreshTokenTtlSeconds: number;

  constructor(
    private readonly userDao: UserDao,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_SECRET');
    this.refreshSecret = config.getOrThrow<string>('REFRESH_SECRET');
    if (this.accessSecret.length < 32 || this.refreshSecret.length < 32) {
      throw new Error('JWT_SECRET y REFRESH_SECRET deben tener al menos 32 caracteres.');
    }
    if (this.accessSecret === this.refreshSecret) {
      throw new Error('JWT_SECRET y REFRESH_SECRET deben ser distintos.');
    }

    this.accessTokenTtlSeconds = parseTtl(config.get<string>('JWT_EXPIRES_IN_SECONDS'), 900, 'JWT_EXPIRES_IN_SECONDS');
    this.refreshTokenTtlSeconds = parseTtl(
      config.get<string>('REFRESH_EXPIRES_IN_SECONDS'),
      604800,
      'REFRESH_EXPIRES_IN_SECONDS',
    );
  }

  register(dto: RegisterDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  async login(dto: LoginDto): Promise<TokenPair & { user: UserResponseDto }> {
    const user = await this.userDao.findByEmail(dto.email);
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const sessionId = randomUUID();
    const tokens = await this.createTokenPair(user.id, user.email, sessionId);
    await this.redisService.set(
      refreshSessionKey(sessionId),
      hashAuthToken(tokens.refreshToken),
      this.refreshTokenTtlSeconds,
    );

    return { ...tokens, user: new UserResponseDto(user) };
  }

  async refresh(refreshToken: string | undefined): Promise<TokenPair> {
    if (!refreshToken) {
      throw new UnauthorizedException('Se requiere un refresh token.');
    }

    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.refreshSecret,
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Refresh token no válido o expirado.');
    }

    if (payload.tokenUse !== 'refresh' || !Number.isSafeInteger(payload.sub) || typeof payload.sid !== 'string') {
      throw new UnauthorizedException('Refresh token no válido o expirado.');
    }

    const user = await this.userDao.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Refresh token no válido o expirado.');
    }

    const tokens = await this.createTokenPair(user.id, user.email, payload.sid);
    const rotated = await this.redisService.rotateValue(
      refreshSessionKey(payload.sid),
      hashAuthToken(refreshToken),
      hashAuthToken(tokens.refreshToken),
      this.refreshTokenTtlSeconds,
    );
    if (!rotated) {
      throw new UnauthorizedException('Refresh token revocado o ya utilizado.');
    }

    return tokens;
  }

  async logout(payload: AccessTokenPayload, accessToken: string): Promise<void> {
    const ttl = payload.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.redisService.set(revokedAccessTokenKey(accessToken), '1', ttl);
    }
    await this.redisService.delete(refreshSessionKey(payload.sid));
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.accessSecret,
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Token de acceso no válido o expirado.');
    }

    if (
      payload.tokenUse !== 'access' ||
      !Number.isSafeInteger(payload.sub) ||
      typeof payload.email !== 'string' ||
      typeof payload.sid !== 'string' ||
      typeof payload.exp !== 'number'
    ) {
      throw new UnauthorizedException('Token de acceso no válido o expirado.');
    }

    return payload;
  }

  async isAccessTokenRevoked(token: string): Promise<boolean> {
    return (await this.redisService.get(revokedAccessTokenKey(token))) !== null;
  }

  async hasActiveSession(sessionId: string): Promise<boolean> {
    return (await this.redisService.get(refreshSessionKey(sessionId))) !== null;
  }

  private async createTokenPair(userId: number, email: string, sessionId: string): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, sid: sessionId, tokenUse: 'access' },
        {
          secret: this.accessSecret,
          expiresIn: this.accessTokenTtlSeconds,
          algorithm: 'HS256',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, sid: sessionId, tokenUse: 'refresh' },
        {
          secret: this.refreshSecret,
          expiresIn: this.refreshTokenTtlSeconds,
          algorithm: 'HS256',
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }
}
