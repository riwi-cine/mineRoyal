import { NotFoundException } from '@nestjs/common';
import { GetMovieDetailService } from './get-movie-detail.service.js';
import { MovieRepository } from '../../infrastructure/dao/movie.repository.js';
import { Movie } from '../../domain/entities/movie.entity.js';

describe('GetMovieDetailService', () => {
  const movie: Movie = {
    id: 'movie-1',
    title: 'Oppenheimer',
    posterUrl: 'poster.jpg',
    bannerUrl: 'banner.jpg',
    trailerUrl: 'https://www.youtube.com/embed/xyz',
    synopsis: 'Sinopsis',
    durationMinutes: 180,
    classification: 'A',
    releaseDate: new Date('2023-07-21'),
    rating: 8.6,
    isActive: true,
    directorId: 'director-1',
    director: { id: 'director-1', name: 'Christopher Nolan' } as Movie['director'],
    movieGenres: [],
    movieActors: [],
    movieLanguages: [],
    movieFormats: [],
  } as unknown as Movie;

  const buildUseCase = (found: Movie | null) => {
    const movieRepository = {
      findDetailById: vi.fn().mockResolvedValue(found),
    } as unknown as MovieRepository;
    return { useService: new GetMovieDetailService(movieRepository), movieRepository };
  };

  it('returns the movie detail when the movie exists and is active', async () => {
    const { useService } = buildUseCase(movie);

    const result = await useService.execute('movie-1');

    expect(result.id).toBe('movie-1');
    expect(result.title).toBe('Oppenheimer');
    expect(result.trailerUrl).toBe('https://www.youtube.com/embed/xyz');
  });

  it('throws NotFoundException when the movie does not exist', async () => {
    const { useService } = buildUseCase(null);

    await expect(useService.execute('missing-movie')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the movie is inactive', async () => {
    const { useService } = buildUseCase({ ...movie, isActive: false });

    await expect(useService.execute('movie-1')).rejects.toThrow(NotFoundException);
  });
});