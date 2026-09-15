import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class SetUserLocationDto {
  @ApiProperty({ description: 'Identificador del usuario.', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'Identificador del país seleccionado.', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  countryId!: string;

  @ApiProperty({ description: 'Identificador del departamento seleccionado.', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  departmentId!: string;

  @ApiProperty({ description: 'Identificador de la ciudad seleccionada.', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  cityId!: string;
}
