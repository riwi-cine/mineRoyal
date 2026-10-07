import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { LoginDto, RefreshTokenDto, RegisterDto } from '../dtos/auth.dto.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { UsersService } from '../../users/services/users.service.js';

interface AuthenticatedRequest extends Request {
  accessToken?: string;
  user?: {
    sub: number;
    email: string;
    sid: string;
    tokenUse: 'access';
    exp: number;
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly refreshCookieOptions: CookieOptions;

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    config: ConfigService,
  ) {
    this.refreshCookieOptions = {
      httpOnly: true,
      secure: config.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/api/v2/auth',
    };
  }

  @Post('register')
  @ApiOperation({ summary: 'Registra una cuenta de usuario.' })
  @ApiResponse({ status: 201, description: 'Usuario registrado.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Inicia sesión y establece una cookie HttpOnly de refresh.' })
  @ApiResponse({ status: 201, description: 'Sesión iniciada.' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto);
    response.cookie('refreshToken', result.refreshToken, {
      ...this.refreshCookieOptions,
      maxAge: this.authService.refreshTokenTtlSeconds * 1000,
    });
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Rota el refresh token y entrega un nuevo access token.' })
  async refresh(
    @Req() request: AuthenticatedRequest,
    @Body() dto: RefreshTokenDto | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refreshToken ?? dto?.refreshToken;
    const tokens = await this.authService.refresh(refreshToken);
    response.cookie('refreshToken', tokens.refreshToken, {
      ...this.refreshCookieOptions,
      maxAge: this.authService.refreshTokenTtlSeconds * 1000,
    });
    return { accessToken: tokens.accessToken };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Devuelve el perfil asociado al access token.' })
  async me(@Req() request: AuthenticatedRequest) {
    if (!request.user) {
      throw new UnauthorizedException('La solicitud no contiene un usuario autenticado.');
    }
    return this.usersService.findOne(request.user.sub);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoca la sesión y elimina la cookie de refresh.' })
  async logout(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    if (!request.user || !request.accessToken) {
      throw new UnauthorizedException('La solicitud no contiene una sesión autenticada.');
    }

    await this.authService.logout(request.user, request.accessToken);
    response.clearCookie('refreshToken', this.refreshCookieOptions);
    return { message: 'Sesión cerrada correctamente.' };
  }
}
