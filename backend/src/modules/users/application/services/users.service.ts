import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findAll() {
    return this.userRepository.find();
  }

  findOne(id: number) {
    return this.userRepository.findOne({ where: { id } }).then((user) => {
      if (!user) {
        throw new NotFoundException(`No existe un usuario con el identificador ${id}`);
      }

      return user;
    });
  }

  create(body: CreateUserDto) {
    return this.userRepository.save(body);
  }

  async update(id: number, body: UpdateUserDto) {
    const user = await this.userRepository.preload({ id, ...body });
    if (!user) {
      throw new NotFoundException(`No existe un usuario con el identificador ${id}`);
    }

    return this.userRepository.save(user);
  }

  async delete(id: number) {
    const result = await this.userRepository.softDelete(id);
    if (!result.affected) {
      throw new NotFoundException(`No existe un usuario con el identificador ${id}`);
    }

    return { message: 'Usuario eliminado correctamente' };
  }

  restore(id: number) {
    return this.userRepository.restore(id);
  }
}
