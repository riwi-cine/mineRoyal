import { createZodDto } from 'nestjs-zod';
import { CreateUserSchema } from './create-user.dto.js';

/**
 * Esquema Zod para la actualización parcial de los datos de un usuario.
 */
export const UpdateUserSchema = CreateUserSchema.partial().refine(
  (user) => Object.values(user).some((value) => value !== undefined),
  { message: 'Debe enviar al menos un campo para actualizar.' },
);

/**
 * DTO para la modificación de campos del usuario (`PATCH /users/:id`).
 */
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
