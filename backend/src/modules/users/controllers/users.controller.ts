import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '../dtos/create-user.dto.js';
import { SetUserLocationDto } from '../dtos/set-user-location.dto.js';
import { UpdateUserDto } from '../dtos/update-user.dto.js';
import { UserLocationResponseDto } from '../dtos/user-location-response.dto.js';
import { UserResponseDto } from '../dtos/user-response.dto.js';
import { SetUserLocationService } from '../services/set-user-location.service.js';
import { UsersService } from '../services/users.service.js';

/**
 * Controlador de Gestión de Usuarios y Ubicación Predeterminada.
 * Provee operaciones CRUD completas con soporte para soft-delete y configuración
 * de país, departamento y ciudad para personalización de cartelera (HU-002).
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly setUserLocationService: SetUserLocationService,
  ) {}

  /**
   * Crea un nuevo registro de usuario en el sistema.
   * @param dto Información básica del usuario con contraseña en texto plano.
   * @returns Datos del usuario creado sin campos sensibles.
   */
  @Post()
  @ApiOperation({
    summary: 'Crea un nuevo usuario',
    description: 'Registra un usuario encriptando la contraseña con bcrypt y validando unicidad de email.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos o formato de correo incorrecto.' })
  @ApiResponse({ status: 409, description: 'Ya existe un usuario con ese correo electrónico.' })
  create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  /**
   * Obtiene la lista de usuarios registrados.
   * @param includeDeleted Si es true, incluye los registros marcados con soft delete.
   * @returns Lista de usuarios formateados en DTOs seguros.
   */
  @Get()
  @ApiOperation({
    summary: 'Lista usuarios registrados',
    description: 'Devuelve todos los usuarios activos, con opción de incluir registros eliminados lógicamente.',
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Si es true, incluye eliminados lógicamente.',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios recuperada exitosamente.', type: [UserResponseDto] })
  findAll(
    @Query('includeDeleted', new DefaultValuePipe(false), ParseBoolPipe) includeDeleted: boolean,
  ): Promise<UserResponseDto[]> {
    return this.usersService.findAll(includeDeleted);
  }

  /**
   * Consulta el detalle de un usuario específico por su ID.
   * @param id Identificador numérico del usuario.
   * @returns Datos del usuario solicitado.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtiene un usuario por ID',
    description: 'Retorna los datos de un usuario activo a partir de su identificador numérico.',
  })
  @ApiParam({ name: 'id', description: 'Identificador numérico del usuario.', type: Number })
  @ApiResponse({ status: 200, description: 'Usuario encontrado exitosamente.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'El identificador proporcionado no es un entero válido.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado o dado de baja.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  /**
   * Actualiza parcialmente la información de un usuario activo.
   * @param id Identificador numérico del usuario.
   * @param dto Campos a actualizar (nombre, correo o contraseña).
   * @returns Usuario con los cambios aplicados.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualiza los datos de un usuario',
    description: 'Modifica campos individuales. Si se provee nueva contraseña, es procesada con bcrypt.',
  })
  @ApiParam({ name: 'id', description: 'Identificador numérico del usuario.', type: Number })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 409, description: 'El nuevo correo ya pertenece a otra cuenta.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
    return this.usersService.update(id, dto);
  }

  /**
   * Realiza un borrado lógico (Soft Delete) del usuario.
   * @param id Identificador numérico del usuario a eliminar.
   * @returns Registro actualizado con marca temporal de eliminación `deletedAt`.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Elimina lógicamente un usuario',
    description: 'Establece la marca de borrado deletedAt sin destruir físicamente el registro en PostgreSQL.',
  })
  @ApiParam({ name: 'id', description: 'Identificador numérico del usuario.', type: Number })
  @ApiResponse({ status: 200, description: 'Usuario eliminado lógicamente.', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.usersService.remove(id);
  }

  /**
   * Restaura un usuario previamente eliminado de forma lógica.
   * @param id Identificador numérico del usuario.
   * @returns Usuario con `deletedAt` en null.
   */
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restaura un usuario eliminado lógicamente',
    description: 'Revierte el soft delete restableciendo el valor de deletedAt a null.',
  })
  @ApiParam({ name: 'id', description: 'Identificador numérico del usuario.', type: Number })
  @ApiResponse({ status: 200, description: 'Usuario restaurado exitosamente.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'El usuario no se encuentra en estado eliminado.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  restore(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.usersService.restore(id);
  }

  /**
   * Guarda o actualiza la ubicación geográfica preferida del usuario (HU-002).
   * @param dto IDs de país, departamento, ciudad y usuario.
   * @returns Registro consolidado de ubicación guardada.
   */
  @Post('location')
  @ApiOperation({
    summary: 'Configura la ubicación del usuario',
    description: 'Asigna o actualiza la ciudad predeterminada verificando que posea salas de cine activas.',
  })
  @ApiBody({ type: SetUserLocationDto })
  @ApiResponse({ status: 201, description: 'Ubicación guardada exitosamente.', type: UserLocationResponseDto })
  @ApiResponse({ status: 400, description: 'Ciudad inactiva, sin cines disponibles o jerarquía inconsistente.' })
  @ApiResponse({ status: 404, description: 'País, departamento o ciudad no encontrados.' })
  setLocation(@Body() dto: SetUserLocationDto): Promise<UserLocationResponseDto> {
    return this.setUserLocationService.execute(dto);
  }
}
