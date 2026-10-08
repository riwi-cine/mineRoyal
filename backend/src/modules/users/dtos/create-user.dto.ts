import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Esquema Zod de validación para la creación de un nuevo usuario.
 */
export const CreateUserSchema = z.object({
  name: z.string().trim().min(1, 'El nombre no puede estar vacío').max(120, 'El nombre excede los 120 caracteres'),
  email: z
    .string()
    .trim()
    .email('El formato del correo electrónico no es válido')
    .max(254)
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72),
});

/**
 * DTO para la creación de usuarios (`POST /users`).
 */
export class CreateUserDto extends createZodDto(CreateUserSchema) {}
