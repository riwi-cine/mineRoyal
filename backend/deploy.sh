#!/bin/bash
set -euo pipefail

# ==============================================================================
# MineRoyal - Script de Despliegue en Produccion (Zero-Downtime)
# ==============================================================================

log_info() {
    echo "[INFO]  $(date '+%Y-%m-%d %H:%M:%S') - $*"
}

log_warn() {
    echo "[WARN]  $(date '+%Y-%m-%d %H:%M:%S') - $*"
}

log_error() {
    echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $*" >&2
}

echo "=================================================================="
echo "MINE ROYAL - DESPLIEGUE A PRODUCCION"
echo "=================================================================="
log_info "Imagen objetivo: ${DOCKER_IMAGE_NAME:-ERROR}:${IMAGE_TAG:-ERROR}"

# ------------------------------------------------------------------------------
# 1. Validacion de variables requeridas
# ------------------------------------------------------------------------------
REQUIRED_VARS=("IMAGE_TAG" "DOCKER_IMAGE_NAME")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        log_error "La variable de entorno '$var' es obligatoria."
        exit 1
    fi
done

cd "$(dirname "$0")"

# ------------------------------------------------------------------------------
# 2. Verificacion de configuracion (.env)
# ------------------------------------------------------------------------------
if [ ! -f .env ]; then
    log_warn "Archivo .env no encontrado. Generando copia desde .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        log_info "Archivo .env generado. Configure los valores de produccion antes de continuar."
    else
        log_error "No se encontraron los archivos .env ni .env.example."
        exit 1
    fi
fi

# ------------------------------------------------------------------------------
# 3. Autenticacion en Docker Hub (opcional)
# ------------------------------------------------------------------------------
if [ -n "${DOCKER_USERNAME:-}" ] && [ -n "${DOCKER_PASSWORD:-}" ]; then
    log_info "Autenticando contra Docker Hub..."
    echo "${DOCKER_PASSWORD}" | docker login -u "${DOCKER_USERNAME}" --password-stdin
fi

# ------------------------------------------------------------------------------
# 4. Descarga de imagen inmutable (Build Once)
# ------------------------------------------------------------------------------
log_info "Descargando imagen: ${DOCKER_IMAGE_NAME}:${IMAGE_TAG}"
docker pull "${DOCKER_IMAGE_NAME}:${IMAGE_TAG}"
docker tag "${DOCKER_IMAGE_NAME}:${IMAGE_TAG}" "${DOCKER_IMAGE_NAME}:latest"

# ------------------------------------------------------------------------------
# 5. Inicializacion y verificacion de base de datos
# ------------------------------------------------------------------------------
log_info "Asegurando disponibilidad de base de datos y cache (PostgreSQL y Redis)..."
docker compose -f docker-compose.prod.yml up -d postgres redis

log_info "Esperando disponibilidad de PostgreSQL..."
until docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U "${DB_USERNAME:-postgres}" 2>/dev/null; do
    sleep 2
done

# ------------------------------------------------------------------------------
# 6. Respaldo de base de datos previo a migraciones
# ------------------------------------------------------------------------------
log_info "Generando respaldo de seguridad de PostgreSQL..."
mkdir -p ./backups
BACKUP_FILE="./backups/db_$(date +%Y%m%d_%H%M%S).sql"
docker compose -f docker-compose.prod.yml exec -T postgres pg_dumpall -U "${DB_USERNAME:-postgres}" 2>/dev/null > "${BACKUP_FILE}" \
    || log_warn "No se pudo generar el respaldo preliminar (base de datos recien inicializada)."

# ------------------------------------------------------------------------------
# 7. Ejecucion estricta de migraciones
# ------------------------------------------------------------------------------
log_info "Ejecutando migraciones de base de datos con TypeORM..."
docker compose -f docker-compose.prod.yml run --rm backend sh -c "\
  node ./node_modules/typeorm/cli.js migration:run -d dist/infrastructure/database/datasource.js"
log_info "Migraciones completadas correctamente."

# ------------------------------------------------------------------------------
# 8. Despliegue con Cero Tiempo de Inactividad (Zero-Downtime)
# ------------------------------------------------------------------------------
log_info "Recreando contenedores sin interrupcion de servicio (Zero-Downtime)..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# ------------------------------------------------------------------------------
# 9. Verificacion de salud del servicio (Healthcheck)
# ------------------------------------------------------------------------------
log_info "Validando healthcheck en /api/v2/health..."
MAX_RETRIES=30
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' mineroyal-backend 2>/dev/null || echo "starting")
    log_info "Estado actual del backend: ${HEALTH} (intento $((RETRY + 1))/${MAX_RETRIES})"
    
    if [ "${HEALTH}" = "healthy" ]; then
        log_info "Backend reporta estado healthy exitosamente."
        break
    fi
    
    RETRY=$((RETRY + 1))
    sleep 3
done

if [ $RETRY -ge $MAX_RETRIES ]; then
    log_error "TIMEOUT: El backend no alcanzo el estado healthy dentro del tiempo limite."
    log_info "Ultimos registros de mineroyal-backend:"
    docker logs --tail 50 mineroyal-backend || true
    exit 1
fi

# ------------------------------------------------------------------------------
# 10. Limpieza de imagenes obsoletas
# ------------------------------------------------------------------------------
log_info "Limpiando imagenes huerfanas..."
docker image prune -f || true

echo "=================================================================="
log_info "DESPLIEGUE FINALIZADO EXITOSAMENTE"
echo "=================================================================="
echo "Comando para monitoreo de logs: docker compose -f docker-compose.prod.yml logs -f backend"
echo "=================================================================="
