import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cinema } from '../entities/cinema.entity.js';

@Injectable()
export class CinemaDao {
  constructor(
    @InjectRepository(Cinema)
    private readonly dao: Repository<Cinema>,
  ) {}

  countActiveByCity(cityId: string): Promise<number> {
    return this.dao.count({ where: { cityId, isActive: true } });
  }
}
