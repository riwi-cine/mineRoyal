# Etapa 1: Base - Dependencias compartidas
FROM node:20-alpine AS base

# Configuración del PATH para binarios de pnpm en entornos basados en Alpine
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Habilita los ejecutables de Corepack (detectará "packageManager" en package.json)
RUN corepack enable

WORKDIR /app

# Copia de manifiestos y definición del workspace antes del código para aprovechar la caché
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Etapa 2: Desarrollo - Hot-reload y bind mounts
FROM base AS development
ENV NODE_ENV=development

# Instalación determinista aprovechando la caché global de paquetes
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "run", "start:dev"]

# Etapa 3: Build - Compilación de TypeScript a JavaScript
FROM base AS build
ENV NODE_ENV=development

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

# Compilación de la aplicación NestJS
RUN pnpm run build

# Poda las dependencias para aislar exclusivamente las requeridas en runtime
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm prune --prod

# Etapa 4: Producción - Imagen liviana, segura y sin herramientas de build
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# Creación de usuario y grupo de sistema sin privilegios
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar manifiestos y artefactos limpios generados en la etapa de build
COPY --chown=appuser:appgroup package.json ./
COPY --chown=appuser:appgroup --from=build /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=build /app/dist ./dist

# Copiar entrypoint asegurando permisos de ejecución de forma atómica
COPY --chown=appuser:appgroup --chmod=755 scripts/docker-entrypoint.sh ./docker-entrypoint.sh

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD wget -qO- http://127.0.0.1:3000/api/v2/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]