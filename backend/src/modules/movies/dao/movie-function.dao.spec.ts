import { MoreThan } from 'typeorm';
import { MovieFunctionDao } from './movie-function.dao.js';

describe('MovieFunctionDao', () => {
  it('queries only active future functions for the given movie and city', async () => {
    const find = vi.fn().mockResolvedValue([]);
    const dao = new MovieFunctionDao({ find } as never);

    await dao.findFutureByMovieAndCity('movie-1', 'city-1');

    const callArgs = find.mock.calls[0][0];
    expect(callArgs.where.movieId).toBe('movie-1');
    expect(callArgs.where.isActive).toBe(true);
    expect(callArgs.where.cinema).toEqual({ cityId: 'city-1' });
    expect(callArgs.where.startsAt).toEqual(MoreThan(expect.any(Date)));
  });
});
