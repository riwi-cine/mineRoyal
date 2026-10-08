import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Esquema Zod de validación para la asociación de preferencias geográficas del usuario.
 */
export const SetUserLocationSchema = z.object({
  userId: z.number().int().positive({ message: 'userId debe ser un número entero positivo.' }),
  countryId: z.string().uuid({ message: 'countryId debe ser un UUID válido.' }),
  departmentId: z.string().uuid({ message: 'departmentId debe ser un UUID válido.' }),
  cityId: z.string().uuid({ message: 'cityId debe ser un UUID válido.' }),
});

/**
 * DTO para configurar o actualizar la ubicación geográfica preferida del usuario (`POST /users/locations`).
 */
export class SetUserLocationDto extends createZodDto(SetUserLocationSchema) {}
