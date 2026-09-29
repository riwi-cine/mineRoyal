import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLocation } from '../entities/user-location.entity.js';

@Injectable()
export class UserLocationDao {
  constructor(
    @InjectRepository(UserLocation)
    private readonly dao: Repository<UserLocation>,
  ) {}

  findByUserId(userId: string): Promise<UserLocation | null> {
    return this.dao.findOne({ where: { userId } });
  }

  async upsert(userId: string, countryId: string, departmentId: string, cityId: string): Promise<UserLocation> {
    const existing = await this.findByUserId(userId);
    const entity = this.dao.merge(existing ?? this.dao.create({ userId }), {
      countryId,
      departmentId,
      cityId,
    });
    return this.dao.save(entity);
  }
}
