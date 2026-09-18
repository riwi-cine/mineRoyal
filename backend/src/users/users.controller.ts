import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('Usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  CreateUsers(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }
}
