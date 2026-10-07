import { NotFoundException } from '@nestjs/common';
import { GetMovieDetailService } from './get-movie-detail.service.js';
import { MovieDao } from '../dao/movie.dao.js';
import { Movie } from '../entities/movie.entity.js';

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

  const buildService = (found: Movie | null) => {
    const movieDao = {
      findDetailById: vi.fn().mockResolvedValue(found),
    } as unknown as MovieDao;
    return { service: new GetMovieDetailService(movieDao), movieDao };
  };

  it('returns the movie detail when the movie exists and is active', async () => {
    const { service } = buildService(movie);

    const result = await service.execute('movie-1');

    expect(result.id).toBe('movie-1');
    expect(result.title).toBe('Oppenheimer');
    expect(result.trailerUrl).toBe('https://www.youtube.com/embed/xyz');
  });

  it('throws NotFoundException when the movie does not exist', async () => {
    const { service } = buildService(null);

    await expect(service.execute('missing-movie')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the movie is inactive', async () => {
    const { service } = buildService({ ...movie, isActive: false });

    await expect(service.execute('movie-1')).rejects.toThrow(NotFoundException);
  });
});
