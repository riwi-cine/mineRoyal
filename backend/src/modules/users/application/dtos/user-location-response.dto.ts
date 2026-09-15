import { ApiProperty } from '@nestjs/swagger';
import { UserLocation } from '../../domain/entities/user-location.entity.js';

export class UserLocationResponseDto {
  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  userId: string;

  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  countryId: string;

  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  departmentId: string;

  @ApiProperty({ example: 'c3a1e6b0-1234-4a56-9abc-1234567890ab' })
  cityId: string;

  @ApiProperty({ example: 'Ubicación guardada correctamente.' })
  message: string;

  constructor(userLocation: UserLocation, message: string) {
    this.userId = userLocation.userId;
    this.countryId = userLocation.countryId;
    this.departmentId = userLocation.departmentId;
    this.cityId = userLocation.cityId;
    this.message = message;
  }
}
