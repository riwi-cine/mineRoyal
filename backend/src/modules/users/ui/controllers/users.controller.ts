import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from '../../../../users/dto/create-user.dto.js';
import { User } from '../../../../users/entities/user.entity/user.entity.js';
import { UsersService } from '../../../../users/users.service.js';
import { SetUserLocationDto } from '../../application/dtos/set-user-location.dto.js';
import { UserLocationResponseDto } from '../../application/dtos/user-location-response.dto.js';
import { SetUserLocationUseCase } from '../../application/services/set-user-location.usecase.js';

@ApiTags('Usuarios')
@Controller('users')
export class UsersController {
  constructor(
    private readonly setUserLocationUseCase: SetUserLocationUseCase,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiOkResponse({ description: 'Lista de usuarios obtenida correctamente', type: User, isArray: true })
  getUsers() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por su identificador' })
  @ApiParam({ name: 'id', description: 'Identificador del usuario', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Usuario obtenido correctamente', type: User })
  @ApiNotFoundResponse({ description: 'No existe un usuario con el identificador indicado' })
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un usuario' })
  @ApiCreatedResponse({ description: 'Usuario creado correctamente', type: User })
  createUser(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Post('location')
  @ApiOperation({ summary: 'Guarda o actualiza la ubicación (país, departamento y ciudad) del usuario.' })
  @ApiBody({ type: SetUserLocationDto })
  @ApiResponse({ status: 201, description: 'Ubicación guardada/actualizada.', type: UserLocationResponseDto })
  @ApiResponse({ status: 400, description: 'Ciudad inactiva, sin cines activos o jerarquía inválida.' })
  @ApiResponse({ status: 404, description: 'País, departamento o ciudad no encontrados.' })
  setLocation(@Body() dto: SetUserLocationDto): Promise<UserLocationResponseDto> {
    return this.setUserLocationUseCase.execute(dto);
  }
}
