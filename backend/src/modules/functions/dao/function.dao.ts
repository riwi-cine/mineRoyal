import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Movie } from '../../movies/entities/movie.entity.js';
import { CinemaFunction } from '../entities/function.entity.js';

/**
 * Optional filters accepted by `GET /movies/{id}/functions` (HU-009).
 */
export interface FunctionFilters {
  /** ISO date (YYYY-MM-DD): restricts results to functions starting that day. */
  date?: string;
  cinemaId?: string;
  roomId?: string;
  /** Formato de proyección: 2D, 3D, IMAX, VIP, etc. */
  format?: string;
  language?: string;
  audioType?: string;
}

/**
 * Functions dao (HU-009) — Function & projection format selection.
 * -------------------------------------------------------------------------
 * Sole layer responsible for talking to TypeORM for querying `functions`,
 * their room/cinema/format details, and validating a movie exists.
 */
@Injectable()
export class FunctionDao {
  constructor(
    @InjectRepository(CinemaFunction)
    private readonly functionDao: Repository<CinemaFunction>,
    @InjectRepository(Movie)
    private readonly movieDao: Repository<Movie>,
  ) {}

  findMovieById(movieId: string): Promise<Movie | null> {
    return this.movieDao.findOne({ where: { id: movieId } });
  }

  /**
   * RN-035: excludes functions that have already started (`startsAt > now`).
   * RN-036: excludes inactive functions (`active = true`).
   */
  findActiveFunctionsByMovie(movieId: string, filters: FunctionFilters): Promise<CinemaFunction[]> {
    const query = this.functionDao
      .createQueryBuilder('function')
      .innerJoinAndSelect('function.room', 'room')
      .innerJoinAndSelect('room.cinema', 'cinema')
      .innerJoinAndSelect('function.functionType', 'functionType')
      .where('function.movie_id = :movieId', { movieId })
      .andWhere('function.active = true')
      .andWhere('function.starts_at > :now', { now: new Date() });

    if (filters.date) {
      query.andWhere('function.starts_at::date = :date', { date: filters.date });
    }
    if (filters.cinemaId) {
      query.andWhere('cinema.id = :cinemaId', { cinemaId: filters.cinemaId });
    }
    if (filters.roomId) {
      query.andWhere('room.id = :roomId', { roomId: filters.roomId });
    }
    if (filters.format) {
      query.andWhere('functionType.projection ILIKE :format', { format: filters.format });
    }
    if (filters.language) {
      query.andWhere('functionType.language ILIKE :language', { language: filters.language });
    }
    if (filters.audioType) {
      query.andWhere('functionType.audio_type = :audioType', { audioType: filters.audioType });
    }

    return query.orderBy('function.starts_at', 'ASC').getMany();
  }

  /**
   * Fetches a single function that is still selectable (RN-035, RN-036),
   * used by both the detail and prices endpoints.
   */
  findSelectableById(functionId: string): Promise<CinemaFunction | null> {
    return this.functionDao.findOne({
      where: { id: functionId, active: true, startsAt: MoreThan(new Date()) },
      relations: ['room', 'room.cinema', 'functionType'],
    });
  }
}
