import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger'; 

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  /**
   * Configuración principal de la documentación OpenAPI.
   */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('mimeRoyal v2')
    .setDescription(
      'swagger for mimeRoyal cinema API',
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
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
