# 🚀 Guía de Implementación Jenkins - MineRoyal CI/CD

Pipeline CI/CD completo: Detecta cambios → Checkout → Instalación → Build → Tests → SonarQube → Docker Push → **Deploy al Application Server**.

---

## 🏗️ Arquitectura General

```
┌─────────────────┐   Push/PR    ┌───────────────────────────┐
│  GitHub Repo    ├─────────────▶│  Jenkins (Controller)     │
└─────────────────┘   Webhook    │  - Node.js 20             │
                                  │  - Docker (DoD)           │
                                  │  - SonarQube Scanner      │
                                  └──────────────┬────────────┘
                                                 │
                   ┌─────────────────────────────┼──────────────────┐
                   ▼                             ▼                  ▼
        ┌──────────────────┐        ┌────────────────────┐   ┌─────────────┐
        │  SonarQube       │        │  Docker Hub        │   │ Application │
        │  (Quality Gate)  │        │  (Image Registry)  │   │   Server    │
        └──────────────────┘        └────────────────────┘   └──────┬──────┘
                                                                    │ SSH + docker compose
                                                                    ▼
                                                          ┌──────────────────────┐
                                                          │   NestJS (production)│
                                                          │   PostgreSQL 16      │
                                                          │   Redis 7            │
                                                          │   Nginx (reverse)    │
                                                          └──────────────────────┘
```

---

## 📦 Paso 1: Levantar Jenkins con Docker

```bash
cd jenkins/
docker compose up -d

# Ver password inicial (una sola vez):
docker exec jenkins-ci cat /var/jenkins_home/secrets/initialAdminPassword
```

Abre http://localhost:8080 → ingresa password.

**Importante**: Al final del setup wizard, selecciona **"Install suggested plugins"**. Luego en el siguiente paso instalamos los faltantes via `jenkins-plugins.txt`.

---

## 🔌 Paso 2: Instalar plugins manuales

Menú → **Manage Jenkins** → **Plugins** → **Advanced settings**:

1. Carga el archivo `jenkins-plugins.txt` en la sección **"Plugin Installation Manager Tool"** → Upload.
2. O via CLI dentro del container:
```bash
docker exec -it jenkins-cli bash
jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
docker restart jenkins-ci
```

**Plugins requeridos mínimos** (el txt tiene +):

| Plugin ID                 | Uso                                                |
|---------------------------|----------------------------------------------------|
| `git`                     | Checkout del repo                                  |
| `workflow-aggregator`     | Pipeline declarativo                               |
| `docker-workflow`         | Build & push de imágenes                           |
| `sonar`                   | Integración SonarQube + Quality Gate wait          |
| `nodejs`                  | Instalar versiones de Node.js                      |
| `ssh` + `ssh-steps`       | Conexiones SSH al servidor de producción           |
| `credentials-binding`     | Secrets en pipelines                               |
| `github` + `github-branch-source` | Webhooks y Multibranch pipeline               |
| `workspace-cleanup`       | Limpia workspace                                   |
| `timestamper`             | Timestamps en logs                                 |
| `warnings-ng`             | Reportes de ESLint                                 |

---

## 🛠️ Paso 3: Configurar Herramientas Globales

Menú → **Manage Jenkins** → **Tools**:

### 3.1 Node.js
- **Name**: `NodeJS 20` (debe coincidir con Jenkinsfile)
- **Version**: `NodeJS 20.19.0` (o superior LTS)
- **Global npm packages to install**: `pnpm corepack`
- **Check**: Install automatically ✓

---

## 🔐 Paso 4: Crear Credenciales

Menú → **Manage Jenkins** → **Credentials** → **(global)** → **Add credential**:

| Tipo                       | ID                  | Username (si aplica) | Descripción                              |
|----------------------------|---------------------|----------------------|------------------------------------------|
| `Secret text`              | `db-password`       | —                    | Password PostgreSQL para tests           |
| `Secret text`              | `sonar-token`       | —                    | Token de SonarCloud / SonarQube          |
| `Username with password`  | `dockerhub`         | `tu-usuario-docker`  | Docker Hub (push imágenes)               |
| `SSH Username with...`    | `deploy-ssh`        | `usuario-ssh-app`    | Acceso Application Server + clave privada|
| `Secret text`              | `DEPLOY_SERVER_HOST`| —                    | IP/Dominio del Application Server (ej: `192.168.1.100` o `app.example.com`) |

---

## 🧪 Paso 5: Configurar SonarQube

Menú → **Manage Jenkins** → **System** → bajar a **SonarQube servers**:

- **Name**: `SonarQube` (debe coincidir con Jenkinsfile)
- **Server URL**: `https://sonarcloud.io` (o tu instancia privada)
- **Server authentication token**: Selecciona la credencial `sonar-token`
- ✓ Enable injection of SonarQube server configuration as build environment variables

---

## 🧾 Paso 6: Crear Pipeline Multibranch

Menú → **New Item** → **Multibranch Pipeline** → Nombre: `mineRoyal-ci-cd`:

### Branch Sources → Add source → **GitHub**
- **Repository HTTPS URL**: `https://github.com/TU_ORG/mineRoyal.git`
- **Credentials**: (crea PAT si es privado, tipo Username/Password donde password=token GitHub `repo,admin:repo_hook`)
- **Behaviours**:
  - ✓ Discover branches: `All branches`
  - ✓ Discover pull requests from origin: `Merging the pull request...`
  - ✓ Filter by name (with wildcards): `include: main develop PR-*`
- **Property strategy**: `All branches get the same properties`

### Build Configuration
- **Mode**: `by Jenkinsfile`
- **Script Path**: `Jenkinsfile` (raíz del repo)

### Scan Repository Triggers
- ✓ Periodically if not otherwise run: `1 minuto` (hasta configurar webhook)

---

## 🔗 Paso 7: Configurar GitHub Webhook

En GitHub repo → **Settings** → **Webhooks** → **Add webhook**:

| Campo            | Valor                                                |
|------------------|------------------------------------------------------|
| Payload URL      | `http://TU-JENKINS-HOST:8080/github-webhook/`       |
| Content type     | `application/json`                                   |
| Secret           | (opcional pero recomendado - lo configuras en Jenkins Global Config → GitHub) |
| SSL verification | `Disable` si es entorno de pruebas sin certificado |
| Events           | `Just the push event` + `Pull requests`              |

---

## 🖥️ Paso 8: Preparar el Application Server (Producción)

Requisitos mínimos en el servidor destino:
- **SO**: Ubuntu 22.04 LTS (o cualquier Linux)
- **Docker Engine** + **Docker Compose v2** instalados:
  ```bash
  # Instalación rápida:
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker TU_USUARIO_SSH
  ```
- **Usuario SSH** con permisos sobre `docker` sin `sudo`
- **Puertos abiertos**: 80, 443, (22 solo para tu IP/Jenkins)
- **Archivo `.env`** creado manualmente UNA SOLA VEZ en `~/mineRoyal/.env` (basado en `.env.example`) con credenciales reales de producción.

---

## 🗂️ Estructura de Archivos Creada

```
mineRoyal/
├── Jenkinsfile                         # ← Pipeline principal (raíz)
├── jenkins/
│   ├── docker-compose.yml              # ← Levanta Jenkins Controller
│   ├── jenkins-plugins.txt             # ← Plugins a instalar
│   └── README.md                       # ← Esta guía
└── backend/
    ├── docker-compose.prod.yml         # ← Stack de PRODUCCIÓN (App Server)
    ├── deploy.sh                       # ← Script de deploy: pull → down → up → migraciones → healthcheck
    ├── Dockerfile                      # (ya existía) Multi-stage: base → dev → build → production
    └── src/infrastructure/web/nginx/nginx.conf  # (ya existía) Config reverse proxy
```

---

## ✅ Prueba del Pipeline (Manual)

1. En Jenkins → `mineRoyal-ci-cd` → pestaña **Scan Repository Now**
2. Debería detectar `main` y `develop`
3. Haz clic en `develop` → **Build Now**
4. Verifica que pasen etapas 1-6 (Checkout → Build)
5. En `main` deberían ejecutarse también 7 (Sonar), 8 (Docker) y 9 (Deploy)

---

## 🔁 Flujo de Trabajo Recomendado (Git Flow)

```
feature/XXX → PR a develop → Pipeline (1-7) → Merge develop → build/test/sonar OK
                                                         ↓
                      release → PR a main → Pipeline (1-9 completo) → DEPLOY AUTOMÁTICO 🚀
```

- **develop**: Corre Lint + Tests + Build + Sonar (no hace deploy)
- **main**: Pipeline completo incluyendo Docker Push y Deploy al Application Server
- **Pull Requests**: Lint + Tests + Build (puerta de calidad previa a merge)

---

## 🐛 Troubleshooting Rápido

| Problema                                  | Solución                                                                 |
|-------------------------------------------|--------------------------------------------------------------------------|
| Docker socket: permission denied          | `sudo usermod -aG docker jenkins` en host + restart container Jenkins   |
| `node: not found` dentro de steps         | Asegúrate de envolver en `nodejs(nodeJSInstallationName: 'NodeJS 20'){}`|
| SSH Host key verification failed          | Primera conexión: haz `ssh user@host` MANUALMENTE una vez desde el host Jenkins para aceptar la huella (con el user jenkins) |
| Migraciones no corren en producción       | Entra al backend: `docker compose -f docker-compose.prod.yml run --rm backend sh -c "node ./node_modules/typeorm/cli.js migration:run -d dist/infrastructure/database/datasource.js"` |
| Sonar Quality Gate tarda mucho            | Aumenta timeout en `waitForQualityGate abortPipeline: true, timeout: '10m'`|

