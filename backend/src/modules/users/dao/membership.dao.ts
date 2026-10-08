import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from '../entities/membership.entity.js';

@Injectable()
export class MembershipDao {
  constructor(
    @InjectRepository(Membership)
    private readonly repository: Repository<Membership>,
  ) {}

  findActiveByUserId(userId: number): Promise<Membership | null> {
    return this.repository.findOne({ where: { userId, active: true } });
  }
}
