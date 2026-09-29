import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../entities/department.entity.js';

@Injectable()
export class DepartmentDao {
  constructor(
    @InjectRepository(Department)
    private readonly dao: Repository<Department>,
  ) {}

  findActiveByCountry(countryId: string): Promise<Department[]> {
    return this.dao.find({
      where: { countryId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  findById(id: string): Promise<Department | null> {
    return this.dao.findOne({ where: { id } });
  }
}
