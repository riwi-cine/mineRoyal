# Resolución Estratégica y Refactorización Arquitectónica para la API mineRoyal

La auditoría técnica integral ejecutada sobre la base de código de la API mineRoyal (entorno Node.js v20.19.4, NestJS 11, TypeORM y Vitest) revela una dicotomía fundamental en el estado actual del proyecto. Por un lado, la aplicación ostenta una excelente estabilidad operativa superficial, evidenciada por una tasa de éxito absoluto en su suite de pruebas automatizadas y un estricto cumplimiento de sintaxis mediante el linter ESLint. Por otro lado, la arquitectura subyacente exhibe fracturas críticas que comprometen inexorablemente su viabilidad a futuro. La convergencia de un esquema de base de datos relacional bifurcado, la disolución de los límites de dominio (Bounded Contexts) a través de módulos monolíticos acoplados, y la proliferación de colisiones nominales en la Inversión de Control (IoC), configuran un escenario de alto riesgo para los despliegues en entornos de producción.

El propósito de este documento es proporcionar una resolución estratégica exhaustiva, fundamentada en los principios del Diseño Guiado por el Dominio (Domain-Driven Design o DDD), arquitecturas limpias y patrones de sistemas distribuidos. La meta es guiar la transformación de la API mineRoyal desde un estado de acoplamiento accidental hacia un Monolito Modular altamente cohesivo, escalable y resiliente, garantizando resultados óptimos a largo plazo y mitigando la deuda técnica acumulada.

---

## 1. Resolución de Divergencias Críticas en la Persistencia de Datos (TypeORM)

El hallazgo de mayor severidad (Prioridad P0) radicado en la auditoría es la bifurcación irreconciliable entre las migraciones de TypeORM existentes y las entidades activas en el código fuente. La coexistencia de dos esquemas paralelos para la misma entidad conceptual (`cinema_rooms` frente a `rooms`), junto con la ausencia total de migraciones para entidades transaccionales críticas como `Seats`, `SeatLock` y `Ticket`, genera un riesgo inminente de fallos en cascada. En un entorno de producción, cualquier consulta impulsada por el servicio de carritos o asientos que invoque estas relaciones inexistentes desencadenará excepciones fatales de base de datos.

### El Peligro de la Sincronización Automática y los Bloqueos de Esquema

En las fases tempranas de desarrollo, es habitual depender de la propiedad `synchronize: true` de TypeORM para reflejar rápidamente los cambios del código en la base de datos. Sin embargo, en entornos de producción o preproducción, esta práctica es considerada un antipatrón de extrema gravedad, ya que el framework de mapeo objeto-relacional (ORM) puede ejecutar sentencias destructivas (`DROP TABLE`, `ALTER COLUMN`) de forma impredecible, resultando en pérdida catastrófica de datos o bloqueos prolongados (*locks*) en las tablas. La resolución exige una transición inmediata hacia un modelo de migraciones declarativas controladas por versión.

No obstante, aplicar una migración masiva que elimine la tabla `cinema_rooms`, cree la tabla `rooms` e inserte las nuevas columnas restrictivas provocará una interrupción del servicio (*downtime*) inaceptable para una plataforma de venta de boletería transaccional. Además, en arquitecturas orquestadas mediante Kubernetes con múltiples instancias del backend operando simultáneamente, una migración directa genera condiciones de carrera (*race conditions*) donde algunos pods ejecutan código antiguo contra un esquema nuevo, corrompiendo el estado de la aplicación.

### Implementación del Patrón Expand-Contract para Migraciones sin Tiempo de Inactividad

La resolución arquitectónica definitiva para sanear el modelo de datos sin impactar la disponibilidad del sistema es la adopción rigurosa del patrón **Expand-Contract** (Expansión y Contracción), también conocido como *Parallel Change*. Este patrón descompone las alteraciones estructurales de la base de datos en fases aisladas y compatibles hacia atrás, permitiendo que múltiples versiones de la aplicación coexistan pacíficamente durante el despliegue.

El flujo de trabajo estratégico para unificar el esquema de salas y butacas de mineRoyal debe estructurarse según las siguientes fases:

| Fase del Patrón | Acción en la Base de Datos (PostgreSQL) | Acción en el Código (NestJS / TypeORM) |
| :--- | :--- | :--- |
| **1. Expansión (Expand)** | Creación de las nuevas tablas faltantes (`rooms`, `room_types`, `seats`, `seat_locks`, `functions`, `function_types`, `tickets`) y adición de columnas requeridas a tablas existentes. Todas las nuevas estructuras se definen como anulables (`NULL`) o con valores por defecto predeterminados. | Despliegue de una versión transitoria de la API capaz de leer del esquema antiguo (`cinema_rooms`) pero escribir simultáneamente en ambos esquemas (*Dual-Write*) para mantener la paridad temporal de los datos. |
| **2. Sincronización (Backfill)** | Ejecución de un proceso asíncrono (*worker* o script de migración) que migra el volumen histórico de registros de `cinema_rooms` hacia la nueva tabla `rooms`. Este proceso opera en lotes pequeños para eludir bloqueos de tabla excluyentes. | El código de la aplicación permanece inalterado durante esta fase, delegando la responsabilidad de la carga de datos a tareas programadas o herramientas externas de infraestructura. |
| **3. Transición (Transition)** | La base de datos mantiene ambos esquemas operativos con la totalidad de los datos sincronizados. Se preparan los índices concurrentes (`CREATE INDEX CONCURRENTLY`) requeridos por el nuevo modelo. | Despliegue de la versión definitiva de la aplicación que abandona la lógica de doble escritura y apunta exclusivamente al nuevo modelo unificado (`rooms`, `seats`, etc.). |
| **4. Contracción (Contract)** | Ejecución de una migración destructiva controlada que elimina definitivamente la tabla `cinema_rooms` e impone restricciones de integridad referencial y de nulidad (`NOT NULL`) sobre el esquema consolidado. | Limpieza de la base de código para erradicar cualquier rastro de la entidad antigua, consolidando el modelo de dominio en un único *Bounded Context* coherente. |

La aplicación de esta metodología requiere que los desarrolladores abandonen la generación monolítica de migraciones de TypeORM y adopten la creación de archivos SQL discretos para cada etapa. Al aislar la evolución del esquema relacional del ciclo de vida del código, el equipo de ingeniería blinda la API mineRoyal contra regresiones de persistencia, asegurando que el módulo de asientos (`seats`) y el de películas (`movies`) puedan consultar una fuente única de verdad sin detonar errores de relación inexistente.

---

## 2. Reestructuración del Monolito Modular y Diseño Guiado por el Dominio (DDD)

La evaluación de la topología arquitectónica de los nodos revela un diseño que emula superficialmente la modularidad a través de la organización de carpetas en NestJS, pero que en la práctica opera con un alto nivel de acoplamiento funcional. NestJS provee un excelente contenedor de Inversión de Control (IoC) y un ciclo de vida de peticiones claro, pero no impone límites de servicio ni define la granularidad del dominio; estas son decisiones de diseño de software que recaen en el equipo de ingeniería.

### Erradicación de Módulos Omnipotentes (God Modules)

El caso más crítico de degradación arquitectónica se manifiesta en el `CartModule` (Módulo de Carrito). Actualmente, este módulo importa y registra directamente entidades transaccionales que pertenecen a otros contextos, tales como `SeatLock` (asientos), `Product` (catálogo) y otras nueve entidades ajenas a su núcleo. En el paradigma del Diseño Guiado por el Dominio (DDD), un Contexto Delimitado (*Bounded Context*) es una frontera lingüística e implementativa donde un modelo de dominio tiene un significado estricto y exclusivo. Al inyectar entidades foráneas en su propio arreglo `TypeOrmModule.forFeature()`, el `CartModule` se ha transformado en un "God Module", asumiendo responsabilidades que desbordan sus límites y acoplándose íntimamente a la estructura física de las tablas de bases de datos de otros equipos.

Para restaurar la integridad del sistema, la arquitectura debe migrar hacia un principio de **Independencia Estricta**. Los módulos deben operar como bloques autónomos que exponen únicamente Contratos de Interfaz de Programación de Aplicaciones (API) públicos o emiten eventos.

El proceso de refactorización para el `CartModule` requiere los siguientes ajustes estructurales:
* El módulo de carrito debe despojarse de cualquier conocimiento sobre la estructura de persistencia de las butacas o las películas. Solo debe registrar sus entidades locales y transaccionales: `Cart`, `Product`, `CartConcessionItem` y `CartGiftCard`.
* Cuando el carrito necesite verificar la disponibilidad de un asiento o calcular el costo total basado en el tipo de sala, no debe consultar la base de datos de asientos directamente. En su lugar, el `SeatModule` debe exportar un servicio de dominio o un repositorio adaptado (Data Access Object o DAO) que el `CartModule` inyectará mediante la composición de módulos de NestJS. Esta abstracción oculta los detalles de implementación subyacentes, permitiendo que la tabla de asientos evolucione sin fracturar la lógica del carrito de compras.

### Reubicación del Controlador Huérfano y Cohesión Funcional

La auditoría expone la existencia de un controlador de reservas (`ReservationsController`) que carece de su propio módulo (`reservations.module.ts`) y que ha sido registrado de manera forzada dentro del `SeatModule`. Esta anomalía viola el principio de Alta Cohesión. La reserva de un ticket involucra reglas de negocio financieras, ciclos temporales de expiración de sesiones y flujos de pago, responsabilidades que difieren diametralmente de la simple gestión topológica o de inventario físico de una sala de cine (responsabilidad principal del `SeatModule`).

La rectificación exige la creación formal del `ReservationsModule` como un nodo de primer nivel dentro del ecosistema de la aplicación. Este nuevo nodo centralizará todos los flujos de creación, validación, liberación manual y confirmación de reservas, actuando como el orquestador principal (*Application Service*) que coordina interacciones entre el catálogo de funciones, la retención de asientos y las pasarelas de pago.

### Táctica DDD: Entidades, Objetos de Valor y Servicios de Dominio

Un pilar fundamental para erradicar la duplicación de código y garantizar la predictibilidad en mineRoyal es la adopción del DDD Táctico, específicamente la distinción entre Entidades, Objetos de Valor (*Value Objects*) y Servicios de Dominio.

El análisis detectó la repetición sistemática de una fórmula de cálculo de tarifas y un transformador de precios (`priceTransformer`) dispersos en múltiples capas y archivos. Si la política de recargos comerciales por salas especiales (e.g., IMAX, 3D, VIP) sufre modificaciones, el equipo de desarrollo se verá forzado a alterar lógica financiera en controladores, servicios y entidades desconectadas, un riesgo inaceptable de inconsistencia.

La solución arquitectónica es extraer estas reglas y transformadores hacia un Objeto de Valor inmutable denominado `Money` o `Tariff`. A diferencia de una Entidad, un Objeto de Valor no posee una identidad única (ID), sino que se define completamente por sus atributos y es inmutable una vez instanciado. Este objeto centralizará el método `priceTransformer` para las interacciones con TypeORM y encapsulará las operaciones matemáticas de la tarifa base más los recargos de sala. Cualquier módulo que requiera manipular cálculos monetarios importará este Objeto de Valor desde una carpeta compartida de dominio abstracto, garantizando que el sistema entero aplique las políticas financieras de manera uniforme y predecible.

---

## 3. Consistencia Eventual y el Patrón Transactional Outbox

El acoplamiento arquitectónico se vuelve especialmente peligroso en el ámbito de las transacciones distribuidas. A medida que la API mineRoyal desagrega sus Bounded Contexts, surge un problema clásico de consistencia de datos: el problema de la Doble Escritura (*Dual-Write Problem*).

Cuando un usuario finaliza el pago en el `CartModule`, el sistema debe realizar al menos dos operaciones críticas: actualizar el estado del carrito a "Pagado" en la base de datos e instruir al `SeatModule` para que transforme el `SeatLock` (reserva temporal) en un ticket definitivo. Si estas operaciones se ejecutan de manera sincrónica (mediante llamadas directas a servicios), un fallo de red temporal o una saturación en el módulo de asientos provocará que la transacción del carrito se revierta, o peor aún, que el carrito se marque como pagado mientras que el asiento queda huérfano y sujeto a una posterior reasignación a otro usuario.

### Mecánica del Patrón Bandeja de Salida Transaccional

Para resolver esta encrucijada sin recurrir a costosos y complejos mecanismos de commit en dos fases (2PC), la mejor práctica de la industria es implementar el **Patrón Transactional Outbox** (Bandeja de Salida Transaccional). Este enfoque asegura que la actualización del estado del negocio y la emisión del evento de integración sean operaciones matemáticamente atómicas.

El flujo de implementación en NestJS con TypeORM debe estructurarse de la siguiente manera:
1. **Atomicidad en la Transacción de Base de Datos:** Utilizando la clase `QueryRunner` o el método `transaction()` del `DataSource` de TypeORM, el servicio orquestador inicia una transacción local de PostgreSQL. Dentro de este límite transaccional, el servicio inserta o actualiza la entidad del carrito. Simultáneamente, y dentro del mismo bloque de transacción, inserta un registro en una tabla secundaria dedicada denominada `outbox_events`. Este registro contiene el nombre del evento (e.g., `CartConfirmedEvent`) y una carga útil (*payload*) estructurada en formato JSON con la información necesaria. Si la base de datos procesa el `COMMIT`, ambas inserciones se materializan inexorablemente. Si falla, ninguna lo hace.
2. **Mecanismo de Relevo (Message Relay):** Una vez que el evento yace seguro en la tabla `outbox_events`, un proceso independiente se encarga de despacharlo hacia su destino. En entornos de alta concurrencia, depender exclusivamente de un proceso de sondeo periódico (*polling*) introducido mediante tareas Cron (`setInterval`) puede generar latencia indeseada y consumo excesivo de ciclos de CPU. La resolución óptima implica la configuración de disparadores (*triggers*) y mecanismos de escucha activa, como la función `LISTEN/NOTIFY` nativa de PostgreSQL. Este mecanismo empuja el evento en tiempo real hacia la capa de transporte de NestJS sin saturar la base de datos con consultas de selección repetitivas.
3. **Distribución y Manejo de Errores:** Un publicador externo capta el evento notificado y lo emite hacia un bus de eventos en memoria o un mediador de mensajes externo como Kafka o RabbitMQ. El `SeatModule` escucha este corredor de mensajes, procesa el cambio de estado del asiento y emite un acuse de recibo. Si el corredor de mensajes experimenta interrupciones, el registro original permanece inmutable en la tabla `outbox_events`, permitiendo que el mecanismo de relevo reintente el despacho automáticamente una vez restablecida la conexión, asegurando así la entrega garantizada (*At-Least-Once Delivery*).

### Idempotencia en los Receptores de Eventos

Dado que el patrón Transactional Outbox garantiza la entrega al menos una vez, existe la posibilidad estadística de que un evento se despache por duplicado debido a fluctuaciones en la red o interrupciones repentinas durante la fase de acuse de recibo. En consecuencia, todos los controladores de eventos (*Event Handlers*) decorados con `@OnEvent()` o escuchadores de Kafka en la API mineRoyal deben ser rigurosamente idempotentes.

La idempotencia se logra instruyendo al `SeatModule` para que mantenga un registro temporal de los identificadores de eventos (`eventId`) procesados exitosamente, o apoyándose en operaciones inherentemente seguras, como actualizaciones directas condicionales (`UPDATE tickets SET status = 'CONFIRMED' WHERE id = X AND status != 'CONFIRMED'`). De esta forma, si el evento `CartConfirmedEvent` se recibe dos veces, la segunda invocación será ignorada silenciosamente, protegiendo la consistencia general del sistema de reservas.

---

## 4. Mitigación Sistemática de la Deuda Técnica y Colisiones Nominales

La preservación de un entorno de código limpio no es un esfuerzo estético, sino un requisito técnico para la sostenibilidad operativa. La auditoría ha sacado a la luz diversas vulnerabilidades estructurales en torno a la duplicación de código que erosionan el ciclo de mantenimiento y generan ambigüedades en tiempo de ejecución.

### Resolución de Colisiones de Inyección de Dependencias

El framework NestJS confía en los nombres de las clases o en identificadores de inyección específicos (*Tokens*) para resolver y suministrar las dependencias en tiempo de ejecución a través de su contenedor IoC. La presencia de dos clases distintas compartiendo exactamente el mismo nombre, `ListMovieFunctionsService` (una operando en el módulo de películas y otra en el módulo de funciones), constituye una amenaza grave para la estabilidad de la inyección de dependencias. Si estos servicios coexisten en el mismo ámbito de resolución sin calificadores explícitos o alias de importación, el contenedor inyectará de forma no determinista la dependencia incorrecta, derivando en excepciones en tiempo de ejecución difíciles de rastrear.

Desde la perspectiva del DDD, la colisión sintáctica suele ser síntoma de una confusión semántica subyacente. La solución requiere distinguir entre Servicios de Dominio (*Domain Services*) y Servicios de Aplicación (*Application Services*):
* El servicio anidado en el módulo de `movies`, cuya responsabilidad es filtrar automáticamente las funciones por la ciudad del usuario registrado, es en esencia un Servicio de Aplicación. Debe renombrarse a `ListMovieFunctionsByCityService` (o `CatalogAggregatorService`), ya que orquesta reglas de negocio en función del contexto del cliente HTTP.
* El servicio en el módulo de `functions`, que filtra por parámetros explícitos (fecha, formato, idioma), actúa más cerca de la base de datos. Debería renombrarse a `FilterFunctionsService` (o `FunctionQueryService`).

De forma paralela, la colisión de nombres entre `health.module.ts` en la infraestructura central y su contraparte en la infraestructura web genera un antipatrón perjudicial en TypeScript que requiere resoluciones manuales mediante alias de importación (`import { HealthModule as CoreHealthModule }`). La arquitectura correcta postula que los aspectos transversales (*Cross-Cutting Concerns*) como la observabilidad o la inspección de vitalidad (*Health Checks*) deben consolidarse o diferenciarse nítidamente en `HealthInfrastructureModule` y `HealthWebModule`.

### Centralización de Interfaces y Seguridad del Repositorio

La detección de interfaces duplicadas como `AuthenticatedRequest` en múltiples controladores y guardianes (*Guards*) de seguridad representa una violación fundamental del principio DRY. Tales fragmentos de código repetidos actúan como multiplicadores de esfuerzo durante las refactorizaciones. Esta interfaz, vital para la tipificación estricta de las variables inyectadas por los tokens JWT, debe ser abstraída y ubicada en un directorio global de tipos transversales: `src/shared/interfaces/authenticated-request.interface.ts`.

Del mismo modo, el esquema de validación de Zod, `createCartSchema`, que presenta implementaciones divergentes en los Data Transfer Objects (DTO) y en las validaciones de base de datos, debe unificarse y publicarse como contratos explícitamente diferenciados (`createCartDtoSchema` y `cartInsertSchema`), evitando errores silenciosos de desajuste de tipos.

En materia de higiene y gobernanza del repositorio, la desincronización de los archivos `.gitignore` constituye un riesgo severo de fuga de información y contaminación del árbol de trabajo (*Working Tree*). La presencia de un `.gitignore` raquítico en el directorio raíz en contraposición a uno sobrepoblado dentro del subdirectorio `/backend/` significa que cualquier herramienta de Integración Continua (CI) o desarrollador ejecutando comandos desde la raíz corre el riesgo de comitear por error archivos `.env` (variables de entorno sensibles), carpetas de cobertura de métricas o binarios residuales. La remediación exige instituir un único y monolítico archivo `.gitignore` en la raíz absoluta del repositorio, estableciendo exclusiones exhaustivas e implacables.

---

## 5. Maximización del Rendimiento en Pruebas Automatizadas (Vitest)

El ecosistema de pruebas automatizadas es posiblemente el activo tecnológico más fuerte de la API mineRoyal. Ejecutar 71 pruebas de manera íntegra con un tiempo promedio de 9.01 milisegundos mediante Vitest evidencia una configuración base excepcionalmente optimizada en el ecosistema Node.js. Vitest se diferencia significativamente de runners tradicionales como Jest al integrarse directamente con el canal de transformación basado en módulos ECMAScript (ESM) de Vite, eliminando la sobrecarga computacional de preprocesadores paralelos como `ts-jest` o `Babel`. No obstante, el escrutinio estadístico de los percentiles de ejecución (p50 en 2.54 ms frente a p99 en 73.61 ms) expone áreas críticas de oportunidad para sostener la agilidad a medida que el monolito crezca a cientos o miles de aserciones.

### Configuración Avanzada de Piscinas de Ejecución y Aislamiento

La degradación paulatina de la velocidad en pruebas end-to-end (E2E) o pruebas que requieren el inicio de contextos (p99) se debe predominantemente al modelo de paralelismo y aislamiento de entornos. Por diseño, Vitest aísla cada archivo de prueba garantizando una limpieza estricta del estado global, lo que en proyectos sin mutaciones colaterales de memoria se traduce en ciclos de CPU desperdiciados reconstruyendo dependencias.

| Opción de Configuración Vitest | Impacto en el Comportamiento y Rendimiento de NestJS | Recomendación Arquitectónica |
| :--- | :--- | :--- |
| **`pool: 'forks'` (Por defecto)** | Ejecuta cada archivo de prueba en un proceso secundario (*child process*) bifurcado de Node.js. Otorga aislamiento absoluto pero impone un costo de sobrecarga masivo por la instanciación de nuevos intérpretes de V8 por cada archivo de prueba. | **Sustituir.** Solo es recomendable para pruebas legacy que contaminan variables globales o el entorno `process.env`. |
| **`pool: 'threads'`** | Delega la ejecución a Worker Threads de Node.js compartiendo segmentos de memoria base. Disminuye radicalmente el tiempo de preparación del Runner, acelerando la evaluación en bases de código extensas. | **Adoptar universalmente.** Esta configuración maximiza la concurrencia computacional limitando los embotellamientos del hilo principal del servidor Vite interno. |
| **`isolate: false`** | Destruye la barrera protectora entre archivos de prueba. Los archivos comparten contextos, variables globales y el cache en memoria del compilador. | **Habilitar estratégicamente.** Debe aplicarse exclusivamente al directorio de pruebas unitarias puras (`src/**/*.spec.ts`), permitiendo que el contenedor simulado (*mock*) inicie exponencialmente más rápido. Se debe inhabilitar en las pruebas de integración o E2E. |

### Simulaciones Inteligentes y Profundidad de Cobertura

El impacto del árbol de dependencias sobre la latencia es innegable. Las pruebas que involucran el método `Test.createTestingModule()` de NestJS están forzando al IoC a escanear, validar e instanciar servicios enteros, incluso cuando solo se requiere probar una función unitaria periférica. Para preservar los tiempos ultrarrápidos (debajo del umbral de 1 ms por prueba), se debe prohibir la inyección de la versión de producción de proveedores complejos (repositorios de base de datos, clientes de red) en favor del apalancamiento de simulaciones inyectadas con `vi.fn()` y `vi.spyOn()`.

Paralelamente, la métrica de cobertura de código arroja un sólido 78.26% en declaraciones de línea, pero un modesto 66.53% en ramas lógicas (*Branches*) y un 54.55% en métodos funcionales. Esto significa que una tercera parte de las sentencias condicionales (manejo de excepciones, fallos de infraestructura, estados límite) no es verificada mediante aserciones. Se exige implementar un esquema de **Pruebas Negativas y Paramétricas** utilizando matrices iterativas (`test.each`) para bombardear los métodos de cálculo de carritos con variables nulas, carritos caducos o tipos de datos espurios, forzando a la aplicación a transitar por todas las ramas de control de flujo posibles.

---

## 6. Aseguramiento de la Calidad Continua y Configuración de SonarQube

La integración de SonarQube / SonarCloud con las infraestructuras CI/CD modernas proporciona una capa invaluable de gobernanza de calidad a través del análisis de código estático profundo. Identifica vulnerabilidades de seguridad cibernética, olores de código (*Code Smells*), puntos calientes de deuda técnica e índice de duplicación (CPD). Sin embargo, la auditoría exhibe que la parametrización de la herramienta de escaneo de mineRoyal en el archivo `sonar-project.properties` padece desajustes críticos que anulan sus beneficios e introducen inestabilidad semántica en el análisis de las métricas.

### Rectificación del Motor Analítico

El hallazgo cardinal en este espectro revela un fallo de delimitación del área de influencia del código de producción. Al declarar `sonar.sources=src` sin incluir exclusiones específicas para los archivos de aserción (`*.spec.ts`), SonarQube interpreta los archivos de test automatizados como lógica de producción. Esto impone exigencias espurias de cobertura de pruebas y diluye matemáticamente las métricas de calidad generales del aplicativo.

La reparación mandatoria del archivo de propiedades exige los siguientes ajustes sintácticos y de filtrado:
1. **Inclusiones y Exclusiones Específicas:** Añadir de manera imperativa la directiva `sonar.test.inclusions=src/**/*.spec.ts,test/**/*.e2e-spec.ts` y configurar `sonar.tests=src,test`. Esto informa algorítmicamente al SonarScanner sobre la naturaleza funcional de cada archivo, segmentando debidamente las métricas.
2. **Reparación de la Indentación:** Purgar la tabulación accidental detectada frente a la declaración `sonar.javascript.lcov.reportPaths=coverage/lcov.info` en la línea 16 para evitar bloqueos silenciosos de la ingestión del reporte V8 de Vitest.
3. **Auditoría Precisa del Detector de Copia (CPD):** Restringir las exclusiones CPD a artefactos de configuración y migraciones, removiendo comodines permisivos que enmascaran duplicaciones en el código fuente.

### Puertas de Calidad (Quality Gates) e Integración de Pipeline CI/CD

El éxito de la gobernanza de la calidad técnica reside en su automatización. Es imperativo que ninguna divergencia en la arquitectura o ineficiencia de código sea fusionada con las ramas de desarrollo principales (`develop`, `main`).

Para salvaguardar la refactorización integral propuesta, se decretan los siguientes umbrales mandatorios dentro de las Puertas de Calidad:
* **Cobertura Mínima Exigida:** No inferior al **80%** en código nuevo bajo ninguna circunstancia.
* **Integridad Sintáctica y Semántica:** Tolerancia cero (0) ante la aparición de nuevas vulnerabilidades, brechas de seguridad informadas (*Hotspots*) e inconsistencias graves del modelo de datos detectadas por SonarQube.
* **Umbral de Duplicidad:** El porcentaje de código duplicado de los nuevos agregados (*Copied Lines*) deberá mantenerse estrictamente por debajo del **3.0%**.

Para que este proceso opere de forma desatendida en Jenkins, el agente de construcción debe tener inyectada la credencial:
```groovy
environment {
    SONAR_TOKEN = credentials('sonarcloud-token')
}
```

---

## 7. Sumario de Perspectiva y Conclusiones

La auditoría y posterior reingeniería propuestas para la API mineRoyal trascienden la simple limpieza de código (*Refactoring*) para convertirse en una iniciativa fundamental de estabilización, sustentabilidad y crecimiento tecnológico. El apalancamiento inicial de herramientas como NestJS y Vitest dotó a la plataforma de un rendimiento transaccional elevado; sin embargo, el acoplamiento descontrolado de las responsabilidades funcionales y la fragmentación arquitectónica del modelo de persistencia sentenciaban el proyecto a un colapso ineludible bajo la presión del escalamiento operativo en producción.

Al desmembrar metódicamente las vulnerabilidades a través de las áreas focales presentadas —orquestando migraciones de base de datos asincrónicas sin tiempo de inactividad, aislando los Bounded Contexts tras la implementación rigurosa del DDD y el Patrón Transactional Outbox, unificando conceptos disonantes mediante Objetos de Valor e interfaces centralizadas, exprimiendo el paralelismo de bajo nivel del ecosistema Vite/Node.js, y fortaleciendo las compuertas automatizadas de aseguramiento de calidad y seguridad cibernética— el equipo tecnológico no solo saldará la gravosa deuda técnica vigente, sino que forjará un Monolito Modular moderno. Esta nueva iteración de la base de código poseerá las características operacionales y la resiliencia innata requeridas para tolerar picos masivos de transacciones asincrónicas, absorbiendo con aplomo la expansión futura de los requerimientos de negocio corporativos.

