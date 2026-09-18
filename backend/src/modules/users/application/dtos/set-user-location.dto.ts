import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SetUserLocationSchema = z.object({
  userId: z.string().uuid({ message: 'userId debe ser un UUID válido.' }),
  countryId: z.string().uuid({ message: 'countryId debe ser un UUID válido.' }),
  departmentId: z.string().uuid({ message: 'departmentId debe ser un UUID válido.' }),
  cityId: z.string().uuid({ message: 'cityId debe ser un UUID válido.' }),
});

export class SetUserLocationDto extends createZodDto(SetUserLocationSchema) {}
