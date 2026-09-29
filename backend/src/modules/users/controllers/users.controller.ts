import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SetUserLocationDto } from '../dtos/set-user-location.dto.js';
import { UserLocationResponseDto } from '../dtos/user-location-response.dto.js';
import { SetUserLocationService } from '../services/set-user-location.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly setUserLocationService: SetUserLocationService) {}

  @Post('location')
  @ApiOperation({ summary: 'Guarda o actualiza la ubicación (país, departamento y ciudad) del usuario.' })
  @ApiBody({ type: SetUserLocationDto })
  @ApiResponse({ status: 201, description: 'Ubicación guardada/actualizada.', type: UserLocationResponseDto })
  @ApiResponse({ status: 400, description: 'Ciudad inactiva, sin cines activos o jerarquía inválida.' })
  @ApiResponse({ status: 404, description: 'País, departamento o ciudad no encontrados.' })
  setLocation(@Body() dto: SetUserLocationDto): Promise<UserLocationResponseDto> {
    return this.setUserLocationService.execute(dto);
  }
}
