import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CityResponseDto } from '../dtos/city-response.dto.js';
import { CountryResponseDto } from '../dtos/country-response.dto.js';
import { DepartmentResponseDto } from '../dtos/department-response.dto.js';
import { ListCitiesService } from '../services/list-cities.service.js';
import { ListCountriesService } from '../services/list-countries.service.js';
import { ListDepartmentsService } from '../services/list-departments.service.js';

/**
 * Controlador de Ubicaciones Geográficas (HU-001 / HU-002).
 * Gestiona el catálogo jerárquico de Países -> Departamentos -> Ciudades
 * permitiendo filtrar cines y funciones disponibles en cada región.
 */
@ApiTags('locations')
@Controller()
export class LocationsController {
  constructor(
    private readonly listCountriesService: ListCountriesService,
    private readonly listDepartmentsService: ListDepartmentsService,
    private readonly listCitiesService: ListCitiesService,
  ) {}

  /**
   * Consulta el listado de países que tienen presencia de cines y están activos.
   * @returns Lista de países ordenados alfabéticamente.
   */
  @Get('countries')
  @ApiOperation({
    summary: 'Lista los países activos disponibles',
    description: 'Devuelve todos los países con cines operativos en el sistema.',
  })
  @ApiResponse({ status: 200, description: 'Listado de países retornado con éxito.', type: [CountryResponseDto] })
  listCountries(): Promise<CountryResponseDto[]> {
    return this.listCountriesService.execute();
  }

  /**
   * Consulta los departamentos asociados a un país determinado.
   * @param countryId UUID del país.
   * @returns Lista de departamentos ordenados alfabéticamente.
   */
  @Get('departments/:countryId')
  @ApiOperation({
    summary: 'Lista los departamentos activos de un país',
    description: 'Filtra departamentos válidos y activos pertenecientes al ID de país suministrado.',
  })
  @ApiParam({ name: 'countryId', description: 'Identificador único del país (UUID)', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Listado de departamentos retornado con éxito.',
    type: [DepartmentResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Identificador de país no tiene formato UUID válido.' })
  @ApiResponse({ status: 404, description: 'País no encontrado o sin cobertura activa.' })
  listDepartments(@Param('countryId', ParseUUIDPipe) countryId: string): Promise<DepartmentResponseDto[]> {
    return this.listDepartmentsService.execute(countryId);
  }

  /**
   * Consulta las ciudades con cines disponibles dentro de un departamento específico.
   * @param departmentId UUID del departamento.
   * @returns Lista de ciudades activas con información de cines.
   */
  @Get('cities/:departmentId')
  @ApiOperation({
    summary: 'Lista las ciudades activas de un departamento',
    description: 'Obtiene las ciudades donde existen teatros de cine habilitados para la venta.',
  })
  @ApiParam({ name: 'departmentId', description: 'Identificador único del departamento (UUID)', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Listado de ciudades retornado con éxito.', type: [CityResponseDto] })
  @ApiResponse({ status: 400, description: 'Identificador de departamento no tiene formato UUID válido.' })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado o inactivo.' })
  listCities(@Param('departmentId', ParseUUIDPipe) departmentId: string): Promise<CityResponseDto[]> {
    return this.listCitiesService.execute(departmentId);
  }
}
