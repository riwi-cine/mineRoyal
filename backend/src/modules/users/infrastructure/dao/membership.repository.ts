import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from '../../domain/entities/membership.entity.js';

@Injectable()
export class MembershipRepository {
  constructor(
    @InjectRepository(Membership)
    private readonly repository: Repository<Membership>,
  ) {}

  findActiveByUserId(userId: string): Promise<Membership | null> {
    return this.repository.findOne({ where: { userId, active: true } });
  }
}
