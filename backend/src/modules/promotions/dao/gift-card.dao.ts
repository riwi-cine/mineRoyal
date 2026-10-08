import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GiftCard } from '../entities/gift-card.entity.js';

@Injectable()
export class GiftCardDao {
  constructor(
    @InjectRepository(GiftCard)
    private readonly repository: Repository<GiftCard>,
  ) {}

  findByCode(code: string): Promise<GiftCard | null> {
    return this.repository.findOne({ where: { code } });
  }

  findByIds(ids: string[]): Promise<GiftCard[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.repository.find({ where: { id: In(ids) } });
  }
}
