# Etapa 1: Base - Dependencias compartidas
FROM node:20-alpine AS base
RUN corepack enable pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Etapa 2: Desarrollo - Hot-reload y bind mounts
FROM base AS development
ENV NODE_ENV=development
RUN pnpm install --frozen-lockfile
COPY . .
EXPOSE 3000
CMD ["pnpm", "run", "start:dev"]

# Etapa 3: Build - Compilación de TypeScript a JavaScript
FROM base AS build
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Etapa 4: Producción - Imagen liviana, segura y sin herramientas de build
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

RUN corepack enable pnpm
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --chown=appuser:appgroup package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --chown=appuser:appgroup --from=build /app/dist ./dist
COPY --chown=appuser:appgroup scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD wget -qO- http://127.0.0.1:3000/api/v2/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]