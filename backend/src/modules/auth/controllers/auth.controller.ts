import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { CookieOptions, Response } from 'express';
import type { AuthenticatedRequest } from '../../../shared/interfaces/authenticated-request.interface.js';
import { UsersService } from '../../users/services/users.service.js';
import { LoginDto, RefreshTokenDto, RegisterDto } from '../dtos/auth.dto.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { AuthService } from '../services/auth.service.js';

/**
 * Controlador de Autenticación y Gestión de Sesiones (JWT + Redis Blacklist).
 * Administra el registro, login con cookies HttpOnly, rotación segura de tokens y logout.
 */
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

  /**
   * Registra una nueva cuenta de usuario en el sistema.
   * @param dto Datos del usuario (nombre, correo, contraseña).
   * @returns Datos del usuario creado (excluyendo el hash de contraseña).
   */
  @Post('register')
  @ApiOperation({
    summary: 'Registra una nueva cuenta de usuario',
    description: 'Crea un usuario en el sistema, asegurando contraseña cifrada con bcrypt y unicidad de correo.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente.' })
  @ApiResponse({
    status: 400,
    description: 'Datos de registro inválidos (formato de correo o longitud de contraseña).',
  })
  @ApiResponse({ status: 409, description: 'El correo electrónico ya se encuentra registrado.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Autentica las credenciales del usuario y genera el par de tokens.
   * Establece una cookie HttpOnly con el refreshToken y retorna el accessToken.
   * @param dto Credenciales de acceso (email, password).
   * @param response Objeto de respuesta HTTP de Express.
   * @returns Objeto con accessToken y datos seguros del usuario.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inicia sesión y genera par de tokens JWT',
    description:
      'Verifica credenciales contra bcrypt, almacena la sesión en Redis y retorna accessToken + cookie HttpOnly.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Autenticación exitosa.' })
  @ApiResponse({ status: 400, description: 'Formato de credenciales inválido.' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas o usuario no encontrado.' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto);
    response.cookie('refreshToken', result.refreshToken, {
      ...this.refreshCookieOptions,
      maxAge: this.authService.refreshTokenTtlSeconds * 1000,
    });
    return { accessToken: result.accessToken, user: result.user };
  }

  /**
   * Rota el refresh token y expide un nuevo access token de corta duración.
   * Previene reuso de tokens mediante validación atómica en Redis.
   * @param request Petición entrante para leer cookie HttpOnly.
   * @param dto Payload alternativo con refreshToken en el cuerpo.
   * @param response Objeto de respuesta HTTP para actualizar la cookie.
   * @returns Nuevo access token generado.
   */
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rota el refresh token y entrega un nuevo access token',
    description: 'Aplica rotación atómica de tokens en Redis (invalida el token anterior al emitir el nuevo).',
  })
  @ApiBody({ type: RefreshTokenDto, required: false })
  @ApiResponse({ status: 200, description: 'Token de acceso renovado exitosamente.' })
  @ApiResponse({ status: 401, description: 'Refresh token no válido, expirado o ya utilizado.' })
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

  /**
   * Consulta el perfil del usuario autenticado actualmente a partir de su Bearer token.
   * @param request Petición autenticada con datos del payload JWT.
   * @returns Datos del usuario activo.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtiene el perfil del usuario autenticado',
    description: 'Decodifica el Bearer Access Token validando su firma y que no esté en la lista negra de Redis.',
  })
  @ApiResponse({ status: 200, description: 'Perfil retornado exitosamente.' })
  @ApiResponse({ status: 401, description: 'Token de acceso inválido, revocado o no proporcionado.' })
  async me(@Req() request: AuthenticatedRequest) {
    if (!request.user) {
      throw new UnauthorizedException('La solicitud no contiene un usuario autenticado.');
    }
    return this.usersService.findOne(request.user.sub);
  }

  /**
   * Cierra la sesión activa: revoca el access token en Redis y elimina la cookie de refresh.
   * @param request Petición con sesión autenticada.
   * @param response Objeto de respuesta HTTP para limpiar la cookie.
   * @returns Mensaje de confirmación.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cierra sesión e invalida los tokens activos',
    description: 'Agrega el access token a la lista negra en Redis y borra la sesión de refreshToken.',
  })
  @ApiResponse({ status: 200, description: 'Sesión cerrada correctamente.' })
  @ApiResponse({ status: 401, description: 'Token de acceso inválido o no autenticado.' })
  async logout(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    if (!request.user || !request.accessToken) {
      throw new UnauthorizedException('La solicitud no contiene una sesión autenticada.');
    }

    await this.authService.logout(request.user, request.accessToken);
    response.clearCookie('refreshToken', this.refreshCookieOptions);
    return { message: 'Sesión cerrada correctamente.' };
  }
}
