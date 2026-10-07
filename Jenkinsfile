pipeline {
    agent {
        label 'docker-agent'
    }
    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 60, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10', daysToKeepStr: '30'))
    }
    environment {
        APP_DIR             = 'backend'
        DOCKER_IMAGE_NAME   = "${DOCKER_USERNAME}/mineroyale-backend"
        IMAGE_TAG           = "${GIT_COMMIT.substring(0,7)}"
        DEPLOY_HOST         = "${DEPLOY_SERVER_HOST}"
        DB_TEST_PASSWORD    = credentials('db-password')
        SONAR_TOKEN         = credentials('sonar-token')
        DOCKER_CREDENTIALS  = credentials('dockerhub')
        DEPLOY_SSH          = credentials('deploy-ssh')
    }
    stages {
        stage('1. Checkout SCM') {
            steps {
                echo "=== Obteniendo código fuente ==="
                checkout scm
                echo "Branch: ${env.BRANCH_NAME}"
                echo "Commit: ${env.GIT_COMMIT}"
            }
        }

        stage('2. Setup Environment & Dependencies') {
            steps {
                echo "=== Instalando dependencias con pnpm ==="
                dir(env.APP_DIR) {
                    sh '''
                        corepack enable pnpm
                        pnpm install --frozen-lockfile
                    '''
                }
            }
        }

        stage('3. Static Analysis & Type Checking') {
            parallel {
                stage('3a. Type-check') {
                    steps {
                        echo "=== Validando tipos TypeScript ==="
                        dir(env.APP_DIR) {
                            sh 'pnpm run type-check'
                        }
                    }
                }
                stage('3b. Lint (ESLint)') {
                    steps {
                        echo "=== Validando reglas de arquitectura y estilo con ESLint ==="
                        dir(env.APP_DIR) {
                            sh 'pnpm run lint --no-fix'
                        }
                    }
                }
            }
        }

        stage('4. Unit Tests') {
            steps {
                echo "=== Ejecutando pruebas unitarias ==="
                dir(env.APP_DIR) {
                    withEnv([
                        'NODE_ENV=test',
                        'DB_HOST=localhost',
                        'DB_PORT=5432',
                        'DB_USER=test_user',
                        "DB_PASSWORD=${DB_TEST_PASSWORD}",
                        'DB_NAME=test_db',
                        'REDIS_HOST=localhost',
                        'REDIS_PORT=6379'
                    ]) {
                        sh 'pnpm run test'
                    }
                }
            }
        }

        stage('5. Compile & Generate Artifacts') {
            steps {
                echo "=== Compilando aplicación NestJS y verificando generación de OpenAPI/Swagger ==="
                dir(env.APP_DIR) {
                    sh 'pnpm run build'
                }
            }
        }

        stage('6. SonarQube Quality Gate') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                echo "=== Ejecutando análisis de cobertura de pruebas ==="
                dir(env.APP_DIR) {
                    withEnv([
                        'NODE_ENV=test',
                        'DB_HOST=localhost',
                        'DB_PORT=5432',
                        'DB_USER=test_user',
                        "DB_PASSWORD=${DB_TEST_PASSWORD}",
                        'DB_NAME=test_db',
                        'REDIS_HOST=localhost',
                        'REDIS_PORT=6379'
                    ]) {
                        sh 'pnpm run test:cov'
                    }
                }
                echo "=== Inspección estática y Quality Gate con SonarQube ==="
                withSonarQubeEnv('SonarQube') {
                    dir(env.APP_DIR) {
                        sh './node_modules/.bin/sonar-scanner'
                    }
                }
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('7. Build Immutable Docker Image') {
            when {
                branch 'main'
            }
            steps {
                echo "=== Estrategia 'Build Once': Construcción y publicación de imagen inmutable ==="
                script {
                    docker.withRegistry('', 'dockerhub') {
                        def img = docker.build(
                            "${DOCKER_IMAGE_NAME}:${IMAGE_TAG}",
                            "--target production -f ${APP_DIR}/Dockerfile ${APP_DIR}"
                        )
                        img.push()
                        img.push('latest')
                        env.IMAGE_BUILT = "${DOCKER_IMAGE_NAME}:${IMAGE_TAG}"
                    }
                }
                echo "Imagen Docker construida y publicada: ${env.IMAGE_BUILT}"
            }
        }

        stage('8. Deploy to Application Server') {
            when {
                branch 'main'
            }
            steps {
                echo "=== Despliegue en servidor de producción con Zero-Downtime: ${DEPLOY_HOST} ==="
                sshagent(['deploy-ssh']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_SSH_USR}@${DEPLOY_HOST} "mkdir -p ~/mineRoyal/ssl ~/mineRoyal/backups || true"

                        scp -o StrictHostKeyChecking=no \
                            ${APP_DIR}/docker-compose.prod.yml \
                            ${APP_DIR}/deploy.sh \
                            ${APP_DIR}/.env.example \
                            ${APP_DIR}/src/infrastructure/web/nginx/nginx.conf \
                            ${DEPLOY_SSH_USR}@${DEPLOY_HOST}:~/mineRoyal/

                        ssh -o StrictHostKeyChecking=no ${DEPLOY_SSH_USR}@${DEPLOY_HOST} \
                            "cd ~/mineRoyal && \
                             chmod +x ./deploy.sh && \
                             export IMAGE_TAG=${IMAGE_TAG} && \
                             export DOCKER_IMAGE_NAME=${DOCKER_IMAGE_NAME} && \
                             export DOCKER_USERNAME=${DOCKER_CREDENTIALS_USR} && \
                             export DOCKER_PASSWORD=${DOCKER_CREDENTIALS_PSW} && \
                             ./deploy.sh"
                    '''
                }
            }
        }
    }
    post {
        always {
            echo "=== Finalización de ejecución: ${currentBuild.currentResult} ==="
            cleanWs cleanWhenFailure: false, cleanWhenNotBuilt: false
        }
        success {
            echo "✅ Pipeline completado exitosamente."
        }
        failure {
            echo "❌ Pipeline fallido. Se ha detenido la promoción para evitar integrar sobre compilaciones rotas."
        }
    }
}
