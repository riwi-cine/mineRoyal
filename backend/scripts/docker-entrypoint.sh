#!/bin/sh

# Detener la ejecución inmediatamente si ocurre algún error
set -e

# Ejecución condicional de migraciones de base de datos

if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Ejecutando migraciones de base de datos..."
  npx typeorm migration:run -d dist/infrastructure/database/datasource.js
fi

# Arranque del Proceso Principal

# 'exec' reemplaza al shell actual por Node.js (PID 1), 
# permitiendo un correcto Graceful Shutdown ante señales SIGTERM/SIGINT.
exec "$@"