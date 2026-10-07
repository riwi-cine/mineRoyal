import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(72),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(72),
});

export class LoginDto extends createZodDto(LoginSchema) {}

export const RefreshTokenSchema = z.preprocess(
  (input) => input ?? {},
  z.object({
    refreshToken: z.string().min(1).optional(),
  }),
);

export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
