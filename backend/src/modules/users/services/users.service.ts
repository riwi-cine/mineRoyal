import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcrypt';
import { UserDao } from '../dao/user.dao.js';
import { CreateUserDto } from '../dtos/create-user.dto.js';
import { UpdateUserDto } from '../dtos/update-user.dto.js';
import { UserResponseDto } from '../dtos/user-response.dto.js';
import { User } from '../entities/user.entity.js';

/**
 * Servicio encargado de la gestión integral y ciclo de vida de los usuarios (CRUD y soft delete).
 */
@Injectable()
export class UsersService {
  constructor(private readonly userDao: UserDao) {}

  /**
   * Registra un nuevo usuario en la base de datos con contraseña cifrada (bcrypt).
   *
   * @param dto Datos del usuario (nombre, correo y contraseña en texto plano).
   * @returns Datos públicos del usuario creado.
   * @throws ConflictException Si ya existe una cuenta con el mismo correo electrónico.
   */
  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    if (await this.userDao.findByEmail(dto.email, true)) {
      throw new ConflictException('Ya existe un usuario con ese correo.');
    }

    const user = await this.userDao.create({
      name: dto.name,
      email: dto.email,
      passwordHash: await hash(dto.password, 12),
    });
    return new UserResponseDto(user);
  }

  /**
   * Obtiene la lista completa de usuarios registrados.
   *
   * @param includeDeleted Indica si se deben incluir cuentas que fueron eliminadas lógicamente.
   * @returns Arreglo de usuarios públicos.
   */
  async findAll(includeDeleted = false): Promise<UserResponseDto[]> {
    const users = await this.userDao.findAll(includeDeleted);
    return users.map((user) => new UserResponseDto(user));
  }

  /**
   * Busca un usuario activo por su identificador numérico.
   *
   * @param id Identificador único del usuario.
   * @returns Datos del usuario solicitado.
   * @throws NotFoundException Si el usuario no existe o está eliminado.
   */
  async findOne(id: number): Promise<UserResponseDto> {
    return new UserResponseDto(await this.getUser(id));
  }

  /**
   * Actualiza los datos de un usuario existente.
   *
   * @param id Identificador del usuario a modificar.
   * @param dto Campos a actualizar (nombre, correo o nueva contraseña).
   * @returns Datos actualizados del usuario.
   * @throws ConflictException Si el nuevo correo ya pertenece a otro usuario.
   * @throws NotFoundException Si el usuario no existe.
   */
  async update(id: number, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.getUser(id);
    if (dto.email && dto.email !== user.email) {
      throw new ConflictException('Ya existe un usuario con ese correo.');
    }

    const changes: Partial<Pick<User, 'name' | 'email' | 'passwordHash'>> = {};
    if (dto.name !== undefined) changes.name = dto.name;
    if (dto.email !== undefined) changes.email = dto.email;
    if (dto.password !== undefined) changes.passwordHash = await hash(dto.password, 12);

    return new UserResponseDto(await this.userDao.update(user, changes));
  }

  /**
   * Realiza la eliminación lógica (soft-delete) de un usuario.
   *
   * @param id Identificador del usuario a eliminar.
   * @returns Datos del usuario con la marca de fecha de borrado.
   * @throws NotFoundException Si el usuario no existe.
   */
  async remove(id: number): Promise<UserResponseDto> {
    const user = await this.getUser(id);
    await this.userDao.softDelete(id);
    const deletedUser = await this.userDao.findById(id, true);
    return new UserResponseDto(deletedUser ?? { ...user, deletedAt: new Date() });
  }

  /**
   * Restaura un usuario previamente eliminado de forma lógica.
   *
   * @param id Identificador del usuario a restaurar.
   * @returns Datos del usuario reactivado.
   * @throws NotFoundException Si el usuario no existe.
   * @throws BadRequestException Si el usuario no se encuentra eliminado.
   */
  async restore(id: number): Promise<UserResponseDto> {
    const user = await this.userDao.findById(id, true);
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    if (!user.deletedAt) throw new BadRequestException('El usuario no está eliminado.');

    await this.userDao.restore(id);
    const restoredUser = await this.userDao.findById(id);
    if (!restoredUser) throw new NotFoundException('No se pudo restaurar el usuario.');
    return new UserResponseDto(restoredUser);
  }

  private async getUser(id: number): Promise<User> {
    const user = await this.userDao.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return user;
  }
}
