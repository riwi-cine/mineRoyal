import { LoginSchema, RefreshTokenSchema, RegisterSchema } from './auth.dto.js';

describe('Auth DTO schemas', () => {
  it('normalizes emails before authentication', () => {
    expect(LoginSchema.parse({ email: ' Ana@Example.com ', password: 'password' })).toEqual({
      email: 'ana@example.com',
      password: 'password',
    });
  });

  it('accepts a cookie-only refresh request with an empty body', () => {
    expect(RefreshTokenSchema.parse(undefined)).toEqual({});
  });

  it('validates registration against the existing user model limits', () => {
    expect(
      RegisterSchema.parse({
        name: ' Ana ',
        email: 'ANA@example.com',
        password: 'a-secure-password',
      }),
    ).toEqual({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'a-secure-password',
    });

    expect(() => RegisterSchema.parse({ name: 'Ana', email: 'ana@example.com', password: 'short' })).toThrow();
  });
});
