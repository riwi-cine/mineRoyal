import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from '../entities/country.entity.js';

@Injectable()
export class CountryDao {
  constructor(
    @InjectRepository(Country)
    private readonly dao: Repository<Country>,
  ) {}

  findAllActive(): Promise<Country[]> {
    return this.dao.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  findById(id: string): Promise<Country | null> {
    return this.dao.findOne({ where: { id } });
  }
}
