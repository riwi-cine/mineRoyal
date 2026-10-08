import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateUserSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(72),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
