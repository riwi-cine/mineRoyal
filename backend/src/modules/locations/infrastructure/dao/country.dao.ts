import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from '../../domain/entities/country.entity.js';

@Injectable()
export class CountryRepository {
  constructor(
    @InjectRepository(Country)
    private readonly repository: Repository<Country>,
  ) {}

  findAllActive(): Promise<Country[]> {
    return this.repository.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  findById(id: string): Promise<Country | null> {
    return this.repository.findOne({ where: { id } });
  }
}
