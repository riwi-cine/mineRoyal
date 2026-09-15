import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * Configuración principal de la documentación OpenAPI.
   */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('mimeRoyal v2')
    .setDescription('swagger for mimeRoyal cinema API')
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
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error: unknown) => {
  console.error('Error al iniciar la aplicación:', error);
  process.exitCode = 1;
});
