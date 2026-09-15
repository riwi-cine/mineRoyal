import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLocation } from '../../domain/entities/user-location.entity.js';

@Injectable()
export class UserLocationRepository {
  constructor(
    @InjectRepository(UserLocation)
    private readonly repository: Repository<UserLocation>,
  ) {}

  findByUserId(userId: string): Promise<UserLocation | null> {
    return this.repository.findOne({ where: { userId } });
  }

  async upsert(userId: string, countryId: string, departmentId: string, cityId: string): Promise<UserLocation> {
    const existing = await this.findByUserId(userId);
    const entity = this.repository.merge(existing ?? this.repository.create({ userId }), {
      countryId,
      departmentId,
      cityId,
    });
    return this.repository.save(entity);
  }
}
