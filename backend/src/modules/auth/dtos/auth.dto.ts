import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Esquema de validación Zod para el registro de nuevos usuarios en la plataforma.
 */
export const RegisterSchema = z.object({
  name: z.string().trim().min(1, 'El nombre no puede estar vacío').max(120, 'El nombre excede los 120 caracteres'),
  email: z
    .string()
    .trim()
    .email('El formato del correo electrónico no es válido')
    .max(254)
    .transform((email) => email.toLowerCase()),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede exceder 72 caracteres'),
});

/**
 * DTO para la petición de registro de usuario (`POST /auth/register`).
 */
export class RegisterDto extends createZodDto(RegisterSchema) {}

/**
 * Esquema de validación Zod para el inicio de sesión.
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('El formato del correo electrónico no es válido')
    .max(254)
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1, 'La contraseña es requerida').max(72),
});

/**
 * DTO para la petición de autenticación de usuario (`POST /auth/login`).
 */
export class LoginDto extends createZodDto(LoginSchema) {}

/**
 * Esquema de validación Zod para rotación de token de refresco.
 */
export const RefreshTokenSchema = z.preprocess(
  (input) => input ?? {},
  z.object({
    refreshToken: z.string().min(1, 'El token de refresco no puede estar vacío').optional(),
  }),
);

/**
 * DTO opcional para el cuerpo de la petición de rotación de token (`POST /auth/refresh-token`).
 */
export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
