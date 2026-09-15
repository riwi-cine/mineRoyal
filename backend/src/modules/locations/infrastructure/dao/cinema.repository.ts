import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cinema } from '../../domain/entities/cinema.entity.js';

@Injectable()
export class CinemaRepository {
  constructor(
    @InjectRepository(Cinema)
    private readonly repository: Repository<Cinema>,
  ) {}

  countActiveByCity(cityId: string): Promise<number> {
    return this.repository.count({ where: { cityId, isActive: true } });
  }
}
