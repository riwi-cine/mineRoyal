import { createZodDto } from 'nestjs-zod';
import { CreateUserSchema } from './create-user.dto.js';

export const UpdateUserSchema = CreateUserSchema.partial().refine(
  (user) => Object.values(user).some((value) => value !== undefined),
  { message: 'Debe enviar al menos un campo para actualizar.' },
);

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
