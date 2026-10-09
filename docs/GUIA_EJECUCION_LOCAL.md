# Guía de Ejecución y Puesta en Marcha Local — MineRoyal API

Esta guía detalla de forma integral los pasos, dependencias, variables de entorno y comandos necesarios para levantar, probar y operar la plataforma **MineRoyal API** desde cero en un entorno local de desarrollo.

---

## 1. Requisitos Previos del Sistema

Antes de iniciar la configuración, asegúrate de contar con las siguientes herramientas instaladas y verificadas en tu terminal:

| Herramienta | Versión Mínima Recomendada | Propósito | Verificación |
|---|:---:|---|---|
| **Node.js** | `>= 20.19.0` (LTS) | Entorno de ejecución JavaScript/TypeScript | `node -v` |
| **Corepack & pnpm** | `pnpm >= 9.x` | Gestor de paquetes rápido y determinista | `pnpm -v` |
| **Docker Engine** | `>= 24.x` | Contenedores de base de datos, caché y CI | `docker -v` |
| **Docker Compose** | `>= 2.20` | Orquestación local de servicios | `docker compose version` |
| **Git** | `>= 2.40` | Control de versiones y pre-commit hooks | `git --version` |

> [!NOTE]
> En entornos Windows, se recomienda configurar Git para preservar saltos de línea LF en scripts de shell (`git config --global core.autocrlf input`).

---

## 2. Variables de Entorno y Configuración de Credenciales

El backend utiliza dotenv para la carga de variables. En la raíz de la carpeta `backend/` se encuentra la plantilla base `.env.example`.

### 2.1 Creación del archivo `.env`
Crea una copia del archivo de ejemplo en `backend/.env`:

```bash
cd backend
cp .env.example .env
```
*(En Windows PowerShell: `Copy-Item .env.example .env`)*

### 2.2 Generación de Secretos Criptográficos
Para garantizar la seguridad de los tokens JWT de acceso y refresco, genera valores pseudoaleatorios criptográficamente seguros mediante Node.js:

```bash
# Generar secreto para JWT_SECRET
node -p "require('node:crypto').randomBytes(48).toString('base64url')"

# Generar secreto para REFRESH_SECRET
node -p "require('node:crypto').randomBytes(48).toString('base64url')"
```

### 2.3 Parámetros de Configuración en `backend/.env`

| Variable | Valor por Defecto Local | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | Entorno de ejecución (`development`, `test`, `production`). |
| `APP_PORT` | `3000` | Puerto HTTP donde escuchará la API de NestJS. |
| `DB_USER` / `POSTGRES_USER` | `postgres` | Usuario administrador de PostgreSQL. |
| `DB_PASSWORD` / `POSTGRES_PASSWORD` | `123456` | Contraseña de acceso a la base de datos. |
| `DB_NAME` / `POSTGRES_DB` | `postgres` (o `mineroyal`) | Nombre de la base de datos principal. |
| `DB_HOST` | `localhost` (o `postgres` en Docker) | Host de PostgreSQL. |
| `DB_PORT` | `5433` (host local) / `5432` (interno) | Puerto mapeado para evitar colisiones con instancias locales. |
| `REDIS_HOST` | `localhost` (o `redis` en Docker) | Host de la base de datos de caché Redis. |
| `REDIS_PORT` | `6379` | Puerto de conexión a Redis. |
| `REDIS_PASSWORD` | *(vacío en local)* | Contraseña de autenticación de Redis. |
| `JWT_SECRET` | *(string generado)* | Llave secreta para firmar tokens de acceso (duración corta). |
| `JWT_EXPIRES_IN_SECONDS` | `900` | Expiración del token de acceso (15 minutos). |
| `REFRESH_SECRET` | *(string generado)* | Llave secreta para firmar tokens de actualización (duración larga). |
| `REFRESH_EXPIRES_IN_SECONDS`| `604800` | Expiración del refresh token (7 días). |

---

## 3. Instalación de Dependencias

MineRoyal utiliza **pnpm** como motor de gestión de paquetes gestionado a través de **Corepack**.

1. Habilita Corepack (incluido nativamente con Node.js):
   ```bash
   corepack enable pnpm
   ```

2. Instala las dependencias respetando estrictamente el archivo de bloqueo:
   ```bash
   cd backend
   pnpm install --frozen-lockfile
   ```

> [!TIP]
> Al instalar las dependencias, se ejecutará automáticamente el script `prepare`, configurando los hooks de Husky en el repositorio para validar los mensajes de commit y la calidad del código antes de cada confirmación.

---

## 4. Puesta en Marcha de la Infraestructura Local (PostgreSQL & Redis)

El proyecto incluye un archivo `docker-compose.yml` en la carpeta `backend/` configurado para levantar la base de datos relacional y el motor de caché sin necesidad de instalar servidores locales.

### 4.1 Iniciar los servicios de persistencia
Desde el directorio `backend/`:

```bash
docker compose up -d postgres redis
```

### 4.2 Verificar el estado de salud (Healthchecks)
Ambos contenedores cuentan con verificaciones de estado activas:

```bash
docker compose ps
```
Deberás observar ambos servicios en estado `Up (healthy)`.

* **PostgreSQL:** accesible desde tu máquina anfitriona en `localhost:5433`.
* **Redis:** accesible en `localhost:6379`.

---

## 5. Migraciones de Base de Datos y Poblado (Seeders)

Una vez que PostgreSQL esté en ejecución y saludable, se deben aplicar las tablas y datos iniciales (roles, géneros, cines, funciones de películas).

### 5.1 Ejecutar Migraciones con TypeORM
```bash
# Ejecutar todas las migraciones pendientes
pnpm run migration:run
```

Si necesitas revertir la última migración aplicada:
```bash
pnpm run migration:revert
```

Para generar una nueva migración a partir de cambios en entidades:
```bash
pnpm run migration:generate -- src/infrastructure/database/migrations/NombreDeLaMigracion
```

### 5.2 Cargar Datos de Prueba (Seeders)
Ejecuta el script de poblamiento para precargar las salas de cine, películas y asientos:

```bash
pnpm run seed
```

---

## 6. Ejecución del Servidor Backend

### 6.1 Modo Desarrollo (Hot-Reload)
Inicia la aplicación con recarga en caliente activa ante cualquier cambio en el código:

```bash
pnpm run start:dev
```

### 6.2 Verificación de Endpoints Principales
Una vez iniciada la aplicación en consola (`Nest application successfully started`):

* **Documentación Swagger / OpenAPI:**  
  [http://localhost:3000/api/v2/docs](http://localhost:3000/api/v2/docs)
* **Healthcheck de la API:**  
  [http://localhost:3000/api/v2/health](http://localhost:3000/api/v2/health)  
  *Respuesta esperada:* `{"status":"ok","timestamp":"..."}`

### 6.3 Ejecución Completa con Docker Compose
Si deseas levantar toda la solución (incluyendo la aplicación NestJS en contenedor):

```bash
docker compose up -d app
```

---

## 7. Ejecución de Pruebas y Validación de Calidad

MineRoyal incorpora una suite integral de aseguramiento de calidad con **Vitest**, **ESLint** y **TypeScript Compiler**.

### 7.1 Pruebas Unitarias
Ejecuta los 107 tests unitarios en modo headless:
```bash
pnpm run test
```

### 7.2 Cobertura de Código (Code Coverage)
Genera el reporte de cobertura V8 e informe LCOV para SonarQube:
```bash
pnpm run test:cov
```
El reporte se generará en la ruta `backend/coverage/lcov.info` y un desglose detallado en terminal.

### 7.3 Análisis Estático y Validación de Tipos
```bash
# Validar tipado estricto con TypeScript sin generar JavaScript
pnpm run type-check

# Validar reglas de estilo y arquitectura con ESLint
pnpm run lint
```

---

## 8. Convención de Commits y Pre-Commit Hooks (Husky)

El proyecto cuenta con validación forzada en los hooks de Git. Para realizar commits exitosos:

1. **Formato obligatorio de mensaje de commit:**
   ```text
   [US-XXX] tipo: descripción breve en minúsculas
   ```
   *Ejemplos válidos:*
   * `[US-10] feat: implement seat locking mechanism`
   * `[US-10] test: add unit tests for seat service with full coverage`
   * `[US-10] fix: correct query parameter in movie list endpoint`

2. Al ejecutar `git commit`, el hook ejecutará automáticamente:
   - `pnpm run lint`
   - `pnpm run type-check`
   - `pnpm run test`

Si alguna prueba falla o el tipado es incorrecto, el commit se abortará inmediatamente para evitar introducir código roto al repositorio.
