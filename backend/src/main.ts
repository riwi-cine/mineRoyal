import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.enableShutdownHooks(); // GracefulShutdown
  app.useGlobalPipes(new ZodValidationPipe());
  app.setGlobalPrefix('api/v2');
  /**
   * Permite que Swagger genere los schemas de OpenAPI
   * a partir de los DTOs basados en zod.
   */
  patchNestJsSwagger();

  /**
   * Configuración principal de la documentación OpenAPI (Swagger).
   */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MineRoyal Cinema API')
    .setDescription(
      'Documentación OpenAPI interactiva de la plataforma MineRoyal Cinema v2. Provee endpoints para autenticación segura (JWT/Refresh Token), gestión de usuarios y preferencias de ubicación, catálogo de películas y cartelera de funciones, selección interactiva de asientos con bloqueo concurrente (HU-010), y administración del carrito de compras con entradas, confitería y beneficios (HU-011).',
    )
    .setVersion('2.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token de acceso JWT emitido en /auth/login o /auth/register',
      },
      'bearer',
    )
    .addTag('auth', 'Autenticación, emisión y rotación de tokens JWT y cierre de sesión')
    .addTag('users', 'Administración de usuarios, perfiles y preferencia de ubicación')
    .addTag('movies', 'Catálogo de películas, recomendaciones personalizadas, géneros y formatos')
    .addTag('functions', 'Programación de funciones de cine, horarios y tarifas de precios')
    .addTag('locations', 'División geográfica: países, departamentos, ciudades y complejos de cine')
    .addTag('seats', 'Distribución de salas y disponibilidad de asientos en tiempo real (HU-010)')
    .addTag('reservations', 'Bloqueo temporal de sillas y cálculo de reservas tarifarias (HU-010)')
    .addTag('cart', 'Gestión del carrito de compras, entradas, confitería y beneficios (HU-011)')
    .addTag('health', 'Verificación de estado de salud del servicio y conectividad de base de datos')
    .build();

  /**
   * Genera el documento OpenAPI a partir
   * de los controllers y endpoints registrados.
   */
  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);

  /**
   * Expone Swagger UI en:
   *
   * http://localhost:3000/api
   */
  SwaggerModule.setup('docs', app, documentFactory);
  const port = process.env.PORT ?? 3000;
  await app.listen(port, process.env.HOST ?? '0.0.0.0');
  console.log(`Server is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/docs`);
}
bootstrap().catch((error: unknown) => {
  console.error('Error al iniciar la aplicación:', error);
  process.exitCode = 1;
});
