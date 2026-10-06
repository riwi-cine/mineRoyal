import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcrypt';
import { UserDao } from '../dao/user.dao.js';
import { CreateUserDto } from '../dtos/create-user.dto.js';
import { UpdateUserDto } from '../dtos/update-user.dto.js';
import { UserResponseDto } from '../dtos/user-response.dto.js';
import { User } from '../entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(private readonly userDao: UserDao) {}

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

  async findAll(includeDeleted = false): Promise<UserResponseDto[]> {
    const users = await this.userDao.findAll(includeDeleted);
    return users.map((user) => new UserResponseDto(user));
  }

  async findOne(id: number): Promise<UserResponseDto> {
    return new UserResponseDto(await this.getUser(id));
  }

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

  async remove(id: number): Promise<UserResponseDto> {
    const user = await this.getUser(id);
    await this.userDao.softDelete(id);
    const deletedUser = await this.userDao.findById(id, true);
    return new UserResponseDto(deletedUser ?? { ...user, deletedAt: new Date() });
  }

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
