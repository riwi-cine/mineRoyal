import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from '../dtos/create-user.dto.js';
import { SetUserLocationDto } from '../dtos/set-user-location.dto.js';
import { UpdateUserDto } from '../dtos/update-user.dto.js';
import { UserResponseDto } from '../dtos/user-response.dto.js';
import { UserLocationResponseDto } from '../dtos/user-location-response.dto.js';
import { UsersService } from '../services/users.service.js';
import { SetUserLocationService } from '../services/set-user-location.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly setUserLocationService: SetUserLocationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crea un usuario.' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Usuario creado.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 409, description: 'Ya existe un usuario con ese correo.' })
  create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista usuarios activos o incluye los eliminados lógicamente.' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean, description: 'Incluye usuarios eliminados.' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios.', type: [UserResponseDto] })
  findAll(
    @Query('includeDeleted', new DefaultValuePipe(false), ParseBoolPipe) includeDeleted: boolean,
  ): Promise<UserResponseDto[]> {
    return this.usersService.findAll(includeDeleted);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un usuario activo por su identificador.' })
  @ApiParam({ name: 'id', description: 'UUID del usuario.' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'El identificador no es un UUID válido.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza los datos de un usuario activo.' })
  @ApiParam({ name: 'id', description: 'UUID del usuario.' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Usuario actualizado.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 409, description: 'Ya existe un usuario con ese correo.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina lógicamente un usuario activo.' })
  @ApiParam({ name: 'id', description: 'UUID del usuario.' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado lógicamente.', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.remove(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restaura un usuario eliminado lógicamente.' })
  @ApiParam({ name: 'id', description: 'UUID del usuario.' })
  @ApiResponse({ status: 200, description: 'Usuario restaurado.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'El usuario no está eliminado.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  restore(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.restore(id);
  }

  @Post('location')
  @ApiOperation({ summary: 'Guarda o actualiza la ubicación (país, departamento y ciudad) del usuario.' })
  @ApiBody({ type: SetUserLocationDto })
  @ApiResponse({ status: 201, description: 'Ubicación guardada/actualizada.', type: UserLocationResponseDto })
  @ApiResponse({ status: 400, description: 'Ciudad inactiva, sin cines activos o jerarquía inválida.' })
  @ApiResponse({ status: 404, description: 'País, departamento o ciudad no encontrados.' })
  setLocation(@Body() dto: SetUserLocationDto): Promise<UserLocationResponseDto> {
    return this.setUserLocationService.execute(dto);
  }
}
