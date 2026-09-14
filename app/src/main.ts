import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * Configuración principal de la documentación OpenAPI.
   */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('mineRoyal v2')
    .setDescription(
      'Swagger for mineRoyal cinema API',
    )
    .setVersion('2.0.0')
    .build();

  /**
   * Genera el documento OpenAPI a partir
   * de los controllers y endpoints registrados.
   */
  const documentFactory = () =>
    SwaggerModule.createDocument(
      app,
      swaggerConfig,
    );

  /**
   * Expone Swagger UI en:
   *
   * http://localhost:3000/api
   */
  SwaggerModule.setup(
    'docs',
    app,
    documentFactory,
  );
  const port = process.env.PORT ?? 3000
  await app.listen(port);
  console.log(`Server is running on: http://localhost:${port}`)
  console.log(`Swagger documentation: http://localhost:${port}/docs`)
}
await bootstrap();
