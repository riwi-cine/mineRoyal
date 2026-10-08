import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import type { RedisService } from '../../../infrastructure/redis/redis.service.js';
import type { UserDao } from '../../users/dao/user.dao.js';
import type { User } from '../../users/entities/user.entity.js';
import type { UsersService } from '../../users/services/users.service.js';
import { hashAuthToken, refreshSessionKey, revokedAccessTokenKey } from '../auth-token.util.js';
import type { LoginDto } from '../dtos/auth.dto.js';
import { AuthService } from './auth.service.js';

vi.mock('bcrypt', () => ({ compare: vi.fn() }));

describe('AuthService', () => {
  const user = {
    id: 7,
    name: 'Ana Pérez',
    email: 'ana@example.com',
    passwordHash: 'stored-password-hash',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  } as User;

  const buildService = () => {
    const userDao = {
      findByEmail: vi.fn().mockResolvedValue(user),
      findById: vi.fn().mockResolvedValue(user),
    } as unknown as UserDao;
    const usersService = {
      create: vi.fn(),
    } as unknown as UsersService;
    const jwtService = {
      signAsync: vi.fn().mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token'),
      verifyAsync: vi.fn(),
    } as unknown as JwtService;
    const redisService = {
      set: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue('active'),
      delete: vi.fn().mockResolvedValue(undefined),
      rotateValue: vi.fn().mockResolvedValue(true),
    } as unknown as RedisService;
    const config = {
      getOrThrow: vi.fn((key: string) => (key === 'JWT_SECRET' ? 'a'.repeat(40) : 'b'.repeat(40))),
      get: vi.fn(() => undefined),
    } as unknown as ConfigService;

    return {
      service: new AuthService(userDao, usersService, jwtService, redisService, config),
      userDao,
      usersService,
      jwtService,
      redisService,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(compare).mockResolvedValue(true);
  });

  it('rejects invalid credentials without revealing whether the account exists', async () => {
    const { service, userDao } = buildService();
    vi.mocked(userDao.findByEmail).mockResolvedValue(null);

    await expect(service.login({ email: 'nobody@example.com', password: 'password' } as LoginDto)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(compare).not.toHaveBeenCalled();
  });

  it('stores only a hash of the refresh token and returns a safe user DTO', async () => {
    const { service, redisService } = buildService();

    const result = await service.login({ email: user.email, password: 'password' } as LoginDto);

    expect(redisService.set).toHaveBeenCalledWith(
      expect.stringMatching(/^auth:session:/),
      hashAuthToken('refresh-token'),
      604800,
    );
    expect(result).toMatchObject({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('atomically rotates a refresh token and rejects reuse', async () => {
    const { service, redisService, jwtService } = buildService();
    vi.mocked(jwtService.verifyAsync).mockResolvedValue({
      sub: user.id,
      sid: 'session-1',
      tokenUse: 'refresh',
    });

    const result = await service.refresh('previous-refresh-token');

    expect(redisService.rotateValue).toHaveBeenCalledWith(
      refreshSessionKey('session-1'),
      hashAuthToken('previous-refresh-token'),
      hashAuthToken('refresh-token'),
      604800,
    );
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });

    vi.mocked(redisService.rotateValue).mockResolvedValue(false);
    vi.mocked(jwtService.signAsync).mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
    await expect(service.refresh('previous-refresh-token')).rejects.toThrow(UnauthorizedException);
  });

  it('does not turn Redis failures into invalid-token responses', async () => {
    const { service, redisService, jwtService } = buildService();
    vi.mocked(jwtService.verifyAsync).mockResolvedValue({
      sub: user.id,
      sid: 'session-1',
      tokenUse: 'refresh',
    });
    vi.mocked(redisService.rotateValue).mockRejectedValue(new Error('Redis unavailable'));

    await expect(service.refresh('previous-refresh-token')).rejects.toThrow('Redis unavailable');
  });

  it('revokes the session and blacklists the current access token on logout', async () => {
    const { service, redisService } = buildService();
    const expiration = Math.floor(Date.now() / 1000) + 600;

    await service.logout(
      { sub: user.id, email: user.email, sid: 'session-1', tokenUse: 'access', exp: expiration },
      'access-token',
    );

    expect(redisService.set).toHaveBeenCalledWith(revokedAccessTokenKey('access-token'), '1', expect.any(Number));
    expect(redisService.delete).toHaveBeenCalledWith(refreshSessionKey('session-1'));
  });

  it('requires separate strong secrets for access and refresh tokens', () => {
    const userDao = {} as UserDao;
    const usersService = {} as UsersService;
    const jwtService = {} as JwtService;
    const redisService = {} as RedisService;
    const config = {
      getOrThrow: vi.fn(() => 'short'),
      get: vi.fn(() => undefined),
    } as unknown as ConfigService;

    expect(() => new AuthService(userDao, usersService, jwtService, redisService, config)).toThrow(
      'deben tener al menos 32 caracteres',
    );
  });

  describe('verifyAccessToken', () => {
    it('returns the verified payload when token is valid and conforms to schema', async () => {
      const { service, jwtService } = buildService();
      const payload = {
        sub: user.id,
        email: user.email,
        sid: 'session-123',
        tokenUse: 'access',
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      vi.mocked(jwtService.verifyAsync).mockResolvedValue(payload);

      const result = await service.verifyAccessToken('valid-token');
      expect(result).toEqual(payload);
    });

    it('throws unauthorized exception if JWT verification fails', async () => {
      const { service, jwtService } = buildService();
      vi.mocked(jwtService.verifyAsync).mockRejectedValue(new Error('jwt expired'));

      await expect(service.verifyAccessToken('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws unauthorized exception if payload claims are invalid', async () => {
      const { service, jwtService } = buildService();
      vi.mocked(jwtService.verifyAsync).mockResolvedValue({
        sub: 'not-a-number',
        tokenUse: 'refresh',
      });

      await expect(service.verifyAccessToken('invalid-claims-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('session and token status checks', () => {
    it('isAccessTokenRevoked returns true when present in redis, false otherwise', async () => {
      const { service, redisService } = buildService();
      vi.mocked(redisService.get).mockResolvedValueOnce('1').mockResolvedValueOnce(null);

      expect(await service.isAccessTokenRevoked('revoked-token')).toBe(true);
      expect(await service.isAccessTokenRevoked('active-token')).toBe(false);
    });

    it('hasActiveSession returns true when session exists in redis, false otherwise', async () => {
      const { service, redisService } = buildService();
      vi.mocked(redisService.get).mockResolvedValueOnce('session-data').mockResolvedValueOnce(null);

      expect(await service.hasActiveSession('session-1')).toBe(true);
      expect(await service.hasActiveSession('session-2')).toBe(false);
    });

    it('logout does not add to blacklist if token is already expired (ttl <= 0)', async () => {
      const { service, redisService } = buildService();
      const pastExpiration = Math.floor(Date.now() / 1000) - 100;

      await service.logout(
        { sub: user.id, email: user.email, sid: 'session-1', tokenUse: 'access', exp: pastExpiration },
        'expired-token',
      );

      expect(redisService.set).not.toHaveBeenCalled();
      expect(redisService.delete).toHaveBeenCalledWith(refreshSessionKey('session-1'));
    });
  });

  describe('refresh edge cases', () => {
    it('throws unauthorized when verify fails', async () => {
      const { service, jwtService } = buildService();
      vi.mocked(jwtService.verifyAsync).mockRejectedValue(new Error('invalid'));

      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws unauthorized when payload has invalid claims', async () => {
      const { service, jwtService } = buildService();
      vi.mocked(jwtService.verifyAsync).mockResolvedValue({
        sub: 1,
        sid: 123, // not string
        tokenUse: 'access', // not refresh
      });

      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws unauthorized when user does not exist in DB', async () => {
      const { service, jwtService, userDao } = buildService();
      vi.mocked(jwtService.verifyAsync).mockResolvedValue({
        sub: 999,
        sid: 'sid-1',
        tokenUse: 'refresh',
      });
      vi.mocked(userDao.findById).mockResolvedValue(null);

      await expect(service.refresh('valid-token-missing-user')).rejects.toThrow(UnauthorizedException);
    });
  });
});
