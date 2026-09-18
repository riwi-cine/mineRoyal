import { NotFoundException } from '@nestjs/common';
import { ListMovieRecommendationsUseCase } from './list-movie-recommendations.usecase.js';
import { MovieRepository } from '../../infrastructure/dao/movie.repository.js';
import { Movie } from '../../domain/entities/movie.entity.js';

describe('ListMovieRecommendationsUseCase', () => {
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

    const movieRepository = {
      findActiveWithGenresById: jest.fn().mockResolvedValue(target),
      findActiveWithGenres: jest.fn().mockResolvedValue([target, other1, other2, unrelated]),
    } as unknown as MovieRepository;

    const useCase = new ListMovieRecommendationsUseCase(movieRepository);
    const result = await useCase.execute('movie-1');

    expect(result.map((r) => r.id)).toEqual(['movie-3', 'movie-2']);
  });

  it('returns an empty array when the movie has no genres', async () => {
    const movieRepository = {
      findActiveWithGenresById: jest.fn().mockResolvedValue(buildMovie('movie-1', 'No Genre', [])),
      findActiveWithGenres: jest.fn(),
    } as unknown as MovieRepository;

    const useCase = new ListMovieRecommendationsUseCase(movieRepository);
    const result = await useCase.execute('movie-1');

    expect(result).toEqual([]);
  });

  it('returns an empty array when no other movie shares a genre', async () => {
    const unrelated = buildMovie('movie-4', 'Comedy Night', ['comedy']);
    const movieRepository = {
      findActiveWithGenresById: jest.fn().mockResolvedValue(target),
      findActiveWithGenres: jest.fn().mockResolvedValue([target, unrelated]),
    } as unknown as MovieRepository;

    const useCase = new ListMovieRecommendationsUseCase(movieRepository);
    const result = await useCase.execute('movie-1');

    expect(result).toEqual([]);
  });

  it('throws NotFoundException when the movie does not exist', async () => {
    const movieRepository = {
      findActiveWithGenresById: jest.fn().mockResolvedValue(null),
      findActiveWithGenres: jest.fn(),
    } as unknown as MovieRepository;

    const useCase = new ListMovieRecommendationsUseCase(movieRepository);

    await expect(useCase.execute('missing-movie')).rejects.toThrow(NotFoundException);
  });
});
