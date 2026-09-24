import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Nombre completo del usuario', example: 'Efrain Martinez' })
  name: string;

  @ApiProperty({ description: 'Correo electrónico del usuario', example: 'efrain@example.com' })
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario', example: 'Secret123!', writeOnly: true })
  password: string;
}
