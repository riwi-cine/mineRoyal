import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from '../entities/city.entity.js';

@Injectable()
export class CityDao {
  constructor(
    @InjectRepository(City)
    private readonly dao: Repository<City>,
  ) {}

  findActiveByDepartment(departmentId: string): Promise<City[]> {
    return this.dao.find({
      where: { departmentId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  findById(id: string): Promise<City | null> {
    return this.dao.findOne({ where: { id } });
  }
}
