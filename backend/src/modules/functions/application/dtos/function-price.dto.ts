import { ApiProperty } from '@nestjs/swagger';
import { CinemaFunction } from '../../domain/entities/function.entity.js';

/**
 * Desglose del precio de una función (RN-037: varía según formato, sala y horario).
 */
export class FunctionPriceResponseDto {
  @ApiProperty() functionId: string;
  @ApiProperty({ description: 'Precio base de la función.' })
  basePrice: number;
  @ApiProperty({ description: 'Recargo asociado a la sala (VIP, IMAX, etc.).' })
  roomExtraPrice: number;
  @ApiProperty({ description: 'Precio final por silla estándar: basePrice + roomExtraPrice.' })
  unitPrice: number;

  constructor(cineFunction: CinemaFunction) {
    this.functionId = cineFunction.id;
    this.basePrice = Number(cineFunction.basePrice);
    this.roomExtraPrice = Number(cineFunction.room!.extraPrice);
    this.unitPrice = this.basePrice + this.roomExtraPrice;
  }
}
