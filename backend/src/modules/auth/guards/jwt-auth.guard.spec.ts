import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthService } from '../services/auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  const buildContext = (authorization?: string) => {
    const request = { headers: { authorization } } as Request & {
      accessToken?: string;
      user?: unknown;
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    return { context, request };
  };

  it('rejects missing or malformed bearer headers', async () => {
    const authService = {} as AuthService;
    const guard = new JwtAuthGuard(authService);
    const { context } = buildContext('Basic token');

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('checks revocation and stores the verified identity on the request', async () => {
    const payload = {
      sub: 7,
      email: 'ana@example.com',
      sid: 'session-1',
      tokenUse: 'access' as const,
      exp: Math.floor(Date.now() / 1000) + 300,
    };
    const authService = {
      verifyAccessToken: vi.fn().mockResolvedValue(payload),
      isAccessTokenRevoked: vi.fn().mockResolvedValue(false),
      hasActiveSession: vi.fn().mockResolvedValue(true),
    } as unknown as AuthService;
    const guard = new JwtAuthGuard(authService);
    const { context, request } = buildContext('Bearer valid-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(authService.isAccessTokenRevoked).toHaveBeenCalledWith('valid-token');
    expect(authService.hasActiveSession).toHaveBeenCalledWith(payload.sid);
    expect(request).toMatchObject({ accessToken: 'valid-token', user: payload });
  });

  it('rejects a token after its session has been removed from Redis', async () => {
    const authService = {
      verifyAccessToken: vi.fn().mockResolvedValue({
        sub: 7,
        email: 'ana@example.com',
        sid: 'session-1',
        tokenUse: 'access',
        exp: Math.floor(Date.now() / 1000) + 300,
      }),
      isAccessTokenRevoked: vi.fn().mockResolvedValue(false),
      hasActiveSession: vi.fn().mockResolvedValue(false),
    } as unknown as AuthService;
    const guard = new JwtAuthGuard(authService);
    const { context } = buildContext('Bearer logged-out-token');

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
