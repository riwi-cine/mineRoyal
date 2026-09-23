import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CityResponseDto } from '../../application/dtos/city-response.dto.js';
import { CountryResponseDto } from '../../application/dtos/country-response.dto.js';
import { DepartmentResponseDto } from '../../application/dtos/department-response.dto.js';
import { ListCitiesService } from '../../application/services/list-cities.service.js';
import { ListCountriesService } from '../../application/services/list-countries.service.js';
import { ListDepartmentsService } from '../../application/services/list-departments.service.js';

@ApiTags('locations')
@Controller()
export class LocationsController {
  constructor(
    private readonly listCountriesUseCase: ListCountriesService,
    private readonly listDepartmentsUseCase: ListDepartmentsService,
    private readonly listCitiesUseCase: ListCitiesService,
  ) {}

  @Get('countries')
  @ApiOperation({ summary: 'Lista los países activos disponibles.' })
  @ApiResponse({ status: 200, description: 'Listado de países.', type: [CountryResponseDto] })
  listCountries(): Promise<CountryResponseDto[]> {
    return this.listCountriesUseCase.execute();
  }

  @Get('departments/:countryId')
  @ApiOperation({ summary: 'Lista los departamentos activos de un país.' })
  @ApiParam({ name: 'countryId', description: 'Identificador del país', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Listado de departamentos.', type: [DepartmentResponseDto] })
  @ApiResponse({ status: 404, description: 'País no encontrado.' })
  listDepartments(@Param('countryId', ParseUUIDPipe) countryId: string): Promise<DepartmentResponseDto[]> {
    return this.listDepartmentsUseCase.execute(countryId);
  }

  @Get('cities/:departmentId')
  @ApiOperation({ summary: 'Lista las ciudades activas de un departamento.' })
  @ApiParam({ name: 'departmentId', description: 'Identificador del departamento', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Listado de ciudades.', type: [CityResponseDto] })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado.' })
  listCities(@Param('departmentId', ParseUUIDPipe) departmentId: string): Promise<CityResponseDto[]> {
    return this.listCitiesUseCase.execute(departmentId);
  }
}