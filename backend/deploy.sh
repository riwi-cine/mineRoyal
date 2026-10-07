#!/bin/bash
set -euo pipefail

echo "==========================================="
echo "🚀 DEPLOY MINE ROYAL - PRODUCCIÓN"
echo "==========================================="
echo "📅 Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
echo "🔖 Imagen: ${DOCKER_IMAGE_NAME:-ERROR}:${IMAGE_TAG:-ERROR}"
echo "==========================================="

# ---------- 1. Validaciones ----------
REQUIRED_VARS=("IMAGE_TAG" "DOCKER_IMAGE_NAME")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        echo "❌ ERROR: Variable $var es requerida"
        exit 1
    fi
done

cd "$(dirname "$0")"

# ---------- 2. Archivo .env (si no existe) ----------
if [ ! -f .env ]; then
    echo "⚠️  .env no existe. Creando a partir de .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env creado desde .env.example. ¡Asegúrate de configurar las variables reales!"
    else
        echo "❌ No se encontró .env ni .env.example"
        exit 1
    fi
fi

# ---------- 3. Docker login (si hay credenciales) ----------
if [ -n "${DOCKER_USERNAME:-}" ] && [ -n "${DOCKER_PASSWORD:-}" ]; then
    echo "🔐 Iniciando sesión en Docker Hub..."
    echo "${DOCKER_PASSWORD}" | docker login -u "${DOCKER_USERNAME}" --password-stdin
fi

# ---------- 4. Pull imagen (Build Once: promover imagen ya construida) ----------
echo "⬇️  Descargando imagen inmutable: ${DOCKER_IMAGE_NAME}:${IMAGE_TAG}"
docker pull "${DOCKER_IMAGE_NAME}:${IMAGE_TAG}"
docker tag "${DOCKER_IMAGE_NAME}:${IMAGE_TAG}" "${DOCKER_IMAGE_NAME}:latest"

# ---------- 5. Levantar base de datos y redis si no están activos ----------
echo "🆙 Asegurando servicios base (PostgreSQL y Redis)..."
docker compose -f docker-compose.prod.yml up -d postgres redis

echo "⏳ Esperando a que PostgreSQL esté listo para aceptar conexiones..."
until docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U "${DB_USERNAME:-postgres}" 2>/dev/null; do
    sleep 2
done

# ---------- 6. Backup DB (previo a migraciones) ----------
echo "💾 Creando backup de seguridad de PostgreSQL..."
mkdir -p ./backups
BK_FILE="./backups/db_$(date +%Y%m%d_%H%M%S).sql"
docker compose -f docker-compose.prod.yml exec -T postgres pg_dumpall -U "${DB_USERNAME:-postgres}" 2>/dev/null > "${BK_FILE}" || echo "⚠️  No se pudo generar backup preliminar (base de datos posiblemente vacía o recién inicializada)"

# ---------- 7. Migraciones de base de datos (Validación estricta: abortar si falla) ----------
echo "🔧 Ejecutando migraciones de base de datos..."
# Se ejecuta sin suprimir errores (sin '|| echo'); ante cualquier fallo set -e abortará inmediatamente el deploy
docker compose -f docker-compose.prod.yml run --rm backend sh -c "\
  node ./node_modules/typeorm/cli.js migration:run -d dist/infrastructure/database/datasource.js"

echo "✅ Migraciones ejecutadas con éxito."

# ---------- 8. Despliegue con Cero Tiempo de Inactividad (Zero-Downtime) ----------
echo "🆙 Recreando y actualizando servicios sin interrupción (Zero-Downtime)..."
# Se reemplaza 'docker compose down' por 'up -d --remove-orphans', permitiendo actualización en caliente
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# ---------- 9. Verificación de Healthcheck ----------
echo "⏳ Esperando confirmación de Healthcheck en /api/v2/health..."
MAX_RETRIES=30
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' mineroyal-backend 2>/dev/null || echo "starting")
    echo "  - Estado de salud: ${HEALTH} (intento $((RETRY + 1))/${MAX_RETRIES})"
    if [ "${HEALTH}" = "healthy" ]; then
        echo "✅ Backend reporta estado healthy exitosamente!"
        break
    fi
    RETRY=$((RETRY + 1))
    sleep 3
done

if [ $RETRY -ge $MAX_RETRIES ]; then
    echo "❌ TIMEOUT: El backend no alcanzó el estado healthy dentro del tiempo límite."
    echo "📝 Registros recientes de mineroyal-backend:"
    docker logs --tail 50 mineroyal-backend || true
    exit 1
fi

# ---------- 10. Limpieza controlada ----------
echo "🧹 Limpiando imágenes y recursos huérfanos obsoletos..."
docker image prune -f || true

echo ""
echo "==========================================="
echo "✅ DEPLOY FINALIZADO CON ÉXITO"
echo "==========================================="
echo "🔍 Monitoreo de logs: docker compose -f docker-compose.prod.yml logs -f backend"
echo "==========================================="
