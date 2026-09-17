
# Etapa 1: Base - Dependencias compartidas

FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./


# Etapa 2: Desarrollo - Hot-reload y bind mounts

FROM base AS development
ENV NODE_ENV=development
# Usar npm ci también en dev para mantener paridad estricta
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# Etapa 3: Build - Compilación de TypeScript a JavaScript

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build


# Etapa 4: Producción - Imagen liviana, segura y sin herramientas de build

FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# Crear un usuario del sistema sin privilegios (Non-root user) por seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# nota: Usar la bandera --chown directamente en COPY 
# para evitar la duplicación de capas en el sistema de archivos (Overlay2) que genera chown -R.
COPY --chown=appuser:appgroup package*.json ./

# Instalar dependencias de producción y limpiar caché de npm
RUN npm ci --omit=dev && npm cache clean --force

# Copiar el código compilado y el script de entrada asignando el usuario desde el origen
COPY --chown=appuser:appgroup --from=build /app/dist ./dist
COPY --chown=appuser:appgroup scripts/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

# Cambiar al usuario non-root para reducir la superficie de ataque
USER appuser

EXPOSE 3000

# Incorporar un HEALTHCHECK nativo compatible con Alpine (usando wget)
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]