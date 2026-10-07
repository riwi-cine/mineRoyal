import { NotFoundException } from '@nestjs/common';
import { ListMovieRecommendationsService } from './list-movie-recommendations.service.js';
import { MovieDao } from '../dao/movie.dao.js';
import { Movie } from '../entities/movie.entity.js';

describe('ListMovieRecommendationsService', () => {
  const buildMovie = (id: string, title: string, genreIds: string[]): Movie =>
    ({
      id,
      title,
      movieGenres: genreIds.map((genreId) => ({ genreId })),
    }) as unknown as Movie;

  const target = buildMovie('movie-1', 'Oppenheimer', ['drama', 'history']);

  it('returns movies sharing at least one genre, sorted by overlap', async () => {
    const other1 = buildMovie('movie-2', 'Dune', ['drama']);
    const other2 = buildMovie('movie-3', 'Interstellar', ['drama', 'history']);
    const unrelated = buildMovie('movie-4', 'Comedy Night', ['comedy']);

    const movieDao = {
      findActiveWithGenresById: vi.fn().mockResolvedValue(target),
      findActiveWithGenres: vi.fn().mockResolvedValue([target, other1, other2, unrelated]),
    } as unknown as MovieDao;

    const service = new ListMovieRecommendationsService(movieDao);
    const result = await service.execute('movie-1');

    expect(result.map((r) => r.id)).toEqual(['movie-3', 'movie-2']);
  });

  it('returns an empty array when the movie has no genres', async () => {
    const movieDao = {
      findActiveWithGenresById: vi.fn().mockResolvedValue(buildMovie('movie-1', 'No Genre', [])),
      findActiveWithGenres: vi.fn(),
    } as unknown as MovieDao;

    const service = new ListMovieRecommendationsService(movieDao);
    const result = await service.execute('movie-1');

    expect(result).toEqual([]);
  });

  it('returns an empty array when no other movie shares a genre', async () => {
    const unrelated = buildMovie('movie-4', 'Comedy Night', ['comedy']);
    const movieDao = {
      findActiveWithGenresById: vi.fn().mockResolvedValue(target),
      findActiveWithGenres: vi.fn().mockResolvedValue([target, unrelated]),
    } as unknown as MovieDao;

    const service = new ListMovieRecommendationsService(movieDao);
    const result = await service.execute('movie-1');

    expect(result).toEqual([]);
  });

  it('throws NotFoundException when the movie does not exist', async () => {
    const movieDao = {
      findActiveWithGenresById: vi.fn().mockResolvedValue(null),
      findActiveWithGenres: vi.fn(),
    } as unknown as MovieDao;

    const service = new ListMovieRecommendationsService(movieDao);

    await expect(service.execute('missing-movie')).rejects.toThrow(NotFoundException);
  });
});
