import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../../domain/entities/department.entity.js';

@Injectable()
export class DepartmentRepository {
  constructor(
    @InjectRepository(Department)
    private readonly repository: Repository<Department>,
  ) {}

  findActiveByCountry(countryId: string): Promise<Department[]> {
    return this.repository.find({
      where: { countryId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  findById(id: string): Promise<Department | null> {
    return this.repository.findOne({ where: { id } });
  }
}
