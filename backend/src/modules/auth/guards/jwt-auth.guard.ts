import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service.js';
import type { AuthenticatedRequest } from '../../../shared/interfaces/authenticated-request.interface.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);
    if (!match) {
      throw new UnauthorizedException('Se requiere un token Bearer válido.');
    }

    const token = match[1];
    const payload = await this.authService.verifyAccessToken(token);
    if (
      (await this.authService.isAccessTokenRevoked(token)) ||
      !(await this.authService.hasActiveSession(payload.sid))
    ) {
      throw new UnauthorizedException('La sesión fue revocada.');
    }

    request.accessToken = token;
    request.user = payload;
    return true;
  }
}
