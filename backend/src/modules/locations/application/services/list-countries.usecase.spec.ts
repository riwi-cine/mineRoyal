import { ListCountriesUseCase } from './list-countries.usecase.js';
import { CountryRepository } from '../../infrastructure/dao/country.dao.js';
import { Country } from '../../domain/entities/country.entity.js';

describe('ListCountriesUseCase', () => {
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
    const countryRepository = {
      findAllActive: vi.fn().mockResolvedValue([buildCountry()]),
      findById: vi.fn(),
    } as unknown as CountryRepository;

    const useCase = new ListCountriesUseCase(countryRepository);
    const result = await useCase.execute();

    expect(countryRepository.findAllActive).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 'country-1', name: 'Colombia', isoCode: 'CO' }]);
  });

  it('returns an empty array when there are no active countries', async () => {
    const countryRepository = {
      findAllActive: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
    } as unknown as CountryRepository;

    const useCase = new ListCountriesUseCase(countryRepository);
    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
