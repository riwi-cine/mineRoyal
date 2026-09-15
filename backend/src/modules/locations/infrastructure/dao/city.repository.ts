import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from '../../domain/entities/city.entity.js';

@Injectable()
export class CityRepository {
  constructor(
    @InjectRepository(City)
    private readonly repository: Repository<City>,
  ) {}

  findActiveByDepartment(departmentId: string): Promise<City[]> {
    return this.repository.find({
      where: { departmentId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  findById(id: string): Promise<City | null> {
    return this.repository.findOne({ where: { id } });
  }
}
