import { ListCountriesService } from './list-countries.service.js';
import { CountryDao } from '../dao/country.dao.js';
import { Country } from '../entities/country.entity.js';

describe('ListCountriesService', () => {
  const buildCountry = (overrides: Partial<Country> = {}): Country =>
    ({
      id: 'country-1',
      name: 'Colombia',
      isoCode: 'CO',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Country;

  it('returns only active countries mapped to response DTOs', async () => {
    const countryDao = {
      findAllActive: vi.fn().mockResolvedValue([buildCountry()]),
      findById: vi.fn(),
    } as unknown as CountryDao;

    const service = new ListCountriesService(countryDao);
    const result = await service.execute();

    expect(countryDao.findAllActive).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 'country-1', name: 'Colombia', isoCode: 'CO' }]);
  });

  it('returns an empty array when there are no active countries', async () => {
    const countryDao = {
      findAllActive: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
    } as unknown as CountryDao;

    const service = new ListCountriesService(countryDao);
    const result = await service.execute();

    expect(result).toEqual([]);
  });
});
