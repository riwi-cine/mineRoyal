import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity.js';

@Injectable()
export class UserDao {
  constructor(@InjectRepository(User) private readonly dao: Repository<User>) {}

  findAll(includeDeleted = false): Promise<User[]> {
    return this.dao.find({
      withDeleted: includeDeleted,
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: number, includeDeleted = false): Promise<User | null> {
    return this.dao.findOne({ where: { id }, withDeleted: includeDeleted });
  }

  findByEmail(email: string, includeDeleted = false): Promise<User | null> {
    return this.dao.findOne({ where: { email }, withDeleted: includeDeleted });
  }

  create(data: Pick<User, 'name' | 'email' | 'passwordHash'>): Promise<User> {
    return this.dao.save(this.dao.create(data));
  }

  update(user: User, changes: Partial<Pick<User, 'name' | 'email' | 'passwordHash'>>): Promise<User> {
    return this.dao.save(this.dao.merge(user, changes));
  }

  async softDelete(id: number): Promise<void> {
    await this.dao.softDelete(id);
  }

  async restore(id: number): Promise<void> {
    await this.dao.restore(id);
  }
}
