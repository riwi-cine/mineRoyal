import { NotFoundException } from '@nestjs/common';
import { ListMovieFunctionsService } from './list-movie-functions.service.js';
import { MovieDao } from '../dao/movie.dao.js';
import { MovieFunctionDao } from '../dao/movie-function.dao.js';
import { UserLocationDao } from '../../users/dao/user-location.dao.js';
import { Movie } from '../entities/movie.entity.js';
import { MovieFunction } from '../entities/movie-function.entity.js';
import { UserLocation } from '../../users/entities/user-location.entity.js';

describe('ListMovieFunctionsService', () => {
  const movie = { id: 'movie-1', isActive: true } as Movie;
  const userLocation = { userId: 'user-1', cityId: 'city-1' } as UserLocation;

  const buildFunction = (overrides: Partial<MovieFunction> = {}): MovieFunction =>
    ({
      id: 'function-1',
      movieId: 'movie-1',
      startsAt: new Date(Date.now() + 3600_000),
      ticketPrice: 15000,
      totalSeats: 50,
      availableSeats: 10,
      cinema: { id: 'cinema-1', name: 'Cine Royal', city: { id: 'city-1', name: 'Medellín' } },
      room: { id: 'room-1', name: 'Sala 1' },
      format: { id: 'format-1', name: '2D' },
      ...overrides,
    }) as unknown as MovieFunction;

  const buildService = (
    options: {
      movie?: Movie | null;
      userLocation?: UserLocation | null;
      functions?: MovieFunction[];
    } = {},
  ) => {
    const movieDao = {
      findActiveById: vi.fn().mockResolvedValue('movie' in options ? options.movie : movie),
    } as unknown as MovieDao;

    const movieFunctionDao = {
      findFutureByMovieAndCity: vi.fn().mockResolvedValue(options.functions ?? [buildFunction()]),
    } as unknown as MovieFunctionDao;

    const userLocationDao = {
      findByUserId: vi.fn().mockResolvedValue('userLocation' in options ? options.userLocation : userLocation),
    } as unknown as UserLocationDao;

    return {
      service: new ListMovieFunctionsService(movieDao, movieFunctionDao, userLocationDao),
      movieFunctionDao,
    };
  };

  it('returns future functions filtered by the user selected city', async () => {
    const { service, movieFunctionDao } = buildService();

    const result = await service.execute('movie-1', 'user-1');

    expect(movieFunctionDao.findFutureByMovieAndCity).toHaveBeenCalledWith('movie-1', 'city-1');
    expect(result.cityId).toBe('city-1');
    expect(result.functions).toHaveLength(1);
    expect(result.functions[0].soldOut).toBe(false);
  });

  it('marks a function as sold out when there are no available seats', async () => {
    const { service } = buildService({ functions: [buildFunction({ availableSeats: 0 })] });

    const result = await service.execute('movie-1', 'user-1');

    expect(result.functions[0].soldOut).toBe(true);
    expect(result.functions[0].available).toBe(false);
  });

  it('returns an informative response when there are no future functions', async () => {
    const { service } = buildService({ functions: [] });

    const result = await service.execute('movie-1', 'user-1');

    expect(result.functions).toEqual([]);
    expect(result.message).toBe('No hay funciones futuras disponibles para esta película.');
  });

  it('returns an informative response when the user has no saved location', async () => {
    const { service } = buildService({ userLocation: null });

    const result = await service.execute('movie-1', 'user-1');

    expect(result.cityId).toBeNull();
    expect(result.functions).toEqual([]);
    expect(result.message).toBe('No se encontró ubicación para el usuario.');
  });

  it('throws NotFoundException when the movie does not exist', async () => {
    const { service } = buildService({ movie: null });

    await expect(service.execute('missing-movie', 'user-1')).rejects.toThrow(NotFoundException);
  });
});
