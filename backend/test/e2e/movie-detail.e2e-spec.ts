import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { MovieRepository } from '../../src/modules/movies/infrastructure/dao/movie.repository.js';
import { MovieFunctionRepository } from '../../src/modules/movies/infrastructure/dao/movie-function.repository.js';
import { GetMovieDetailUseCase } from '../../src/modules/movies/application/services/get-movie-detail.usecase.js';
import { ListMovieFunctionsUseCase } from '../../src/modules/movies/application/services/list-movie-functions.usecase.js';
import { ListMovieRecommendationsUseCase } from '../../src/modules/movies/application/services/list-movie-recommendations.usecase.js';
import { MoviesController } from '../../src/modules/movies/ui/controllers/movies.controller.js';
import { UserLocationRepository } from '../../src/modules/users/infrastructure/dao/user-location.repository.js';

const movieId = '55555555-5555-4555-a555-555555555555';
const otherMovieId = '66666666-6666-4666-a666-666666666666';
const userId = '44444444-4444-4444-a444-444444444444';
const cityId = '33333333-3333-4333-a333-333333333333';

const movie = {
  id: movieId,
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
  director: { id: 'director-1', name: 'Christopher Nolan' },
  movieGenres: [{ genreId: 'genre-1', genre: { id: 'genre-1', name: 'Drama' } }],
  movieActors: [],
  movieLanguages: [],
  movieFormats: [],
};

const otherMovie = {
  id: otherMovieId,
  title: 'Dune',
  movieGenres: [{ genreId: 'genre-1', genre: { id: 'genre-1', name: 'Drama' } }],
};

describe('Movie detail (e2e happy path)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        GetMovieDetailUseCase,
        ListMovieFunctionsUseCase,
        ListMovieRecommendationsUseCase,
        { provide: MovieRepository, useValue: {
          findDetailById: async () => movie,
          findActiveById: async () => movie,
          findActiveWithGenresById: async () => movie,
          findActiveWithGenres: async () => [movie, otherMovie],
        } },
        {
          provide: MovieFunctionRepository,
          useValue: {
            findFutureByMovieAndCity: async () => [
              {
                id: 'function-1',
                movieId,
                startsAt: new Date(Date.now() + 3600_000),
                ticketPrice: 15000,
                totalSeats: 50,
                availableSeats: 10,
                cinema: { id: 'cinema-1', name: 'Cine Royal', city: { id: cityId, name: 'Medellín' } },
                room: { id: 'room-1', name: 'Sala 1' },
                format: { id: 'format-1', name: '2D' },
              },
            ],
          },
        },
        { provide: UserLocationRepository, useValue: { findByUserId: async () => ({ userId, cityId }) } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns movie detail, functions and recommendations', async () => {
    const detail = await request(app.getHttpServer()).get(`/movies/${movieId}`).expect(200);
    expect(detail.body).toMatchObject({ id: movieId, title: 'Oppenheimer' });

    const functions = await request(app.getHttpServer())
      .get(`/movies/${movieId}/functions`)
      .query({ userId })
      .expect(200);
    expect(functions.body.cityId).toBe(cityId);
    expect(functions.body.functions[0]).toMatchObject({ soldOut: false, available: true });

    const recommendations = await request(app.getHttpServer()).get(`/movies/${movieId}/recommendations`).expect(200);
    expect(recommendations.body).toEqual([expect.objectContaining({ id: otherMovieId, title: 'Dune' })]);
  });
});
