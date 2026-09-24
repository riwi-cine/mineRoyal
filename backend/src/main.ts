import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks(); // GracefulShutdown
  app.useGlobalPipes(new ZodValidationPipe());
  app.setGlobalPrefix('api/v2');
  /**
   * Permite que Swagger genere los schemas de OpenAPI
   * a partir de los DTOs basados en zod.
   */
  patchNestJsSwagger();

  /**
   * Configuración principal de la documentación OpenAPI.
   */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('mineRoyal v2')
    .setDescription('swagger for MineRoyal cinema API')
    .setVersion('2.0.0')
    .addBearerAuth()
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
  await app.listen(port, '0.0.0.0');
  console.log(`Server is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/docs`);
}
bootstrap().catch((error: unknown) => {
  console.error('Error al iniciar la aplicación:', error);
  process.exitCode = 1;
});
