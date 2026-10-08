# Catálogo de Consultas SQL y Analítica — MineRoyal Cinema

Este documento contiene un catálogo integral de consultas SQL para el motor de base de datos **PostgreSQL**, organizadas por **módulos del sistema** y clasificadas por **niveles de complejidad** (Básica, Intermedia, Avanzada y Analítica Ejecutiva).

---

## Índice

1. [Módulo 1: Usuarios, Membresías y Roles (RBAC)](#1-módulo-de-usuarios-membresías-y-roles-rbac)
2. [Módulo 2: Películas y Catálogo Cinematográfico](#2-módulo-de-películas-y-catálogo-cinematográfico)
3. [Módulo 3: Ubicaciones, Complejos y Salas](#3-módulo-de-ubicaciones-complejos-y-salas)
4. [Módulo 4: Funciones, Horarios y Tarifas](#4-módulo-de-funciones-horarios-y-tarifas)
5. [Módulo 5: Selección de Sillas y Reservas (HU-010)](#5-módulo-de-selección-de-sillas-y-reservas-hu-010)
6. [Módulo 6: Carrito de Compras, Confitería y Bonos (HU-011)](#6-módulo-de-carrito-de-compras-confitería-y-bonos-hu-011)
7. [Módulo 7: Analítica Ejecutiva, KPIs y Métricas de Negocio](#7-módulo-de-analítica-ejecutiva-kpis-y-métricas-de-negocio)

---

## 1. Módulo de Usuarios, Membresías y Roles (RBAC)

### 1.1 Básica: Padrón general de usuarios y estado de cuenta
Audita las cuentas registradas diferenciando aquellas activas de las dadas de baja lógicamente (*soft delete*).

```sql
SELECT 
    id AS user_id,
    name,
    email,
    created_at,
    CASE 
        WHEN deleted_at IS NOT NULL THEN 'ELIMINADO'
        ELSE 'ACTIVO'
    END AS account_status,
    deleted_at
FROM users
ORDER BY created_at DESC;
```

### 1.2 Intermedia: Usuarios con estado de membresía y beneficios
Lista usuarios y sus beneficios de fidelidad vigentes (*RN-047*).

```sql
SELECT 
    u.id AS user_id,
    u.name,
    u.email,
    COALESCE(m.tier, 'SIN_MEMBRESIA') AS tier,
    COALESCE(m.discount_percentage, 0) AS discount_pct,
    m.expires_at,
    CASE 
        WHEN m.id IS NULL THEN 'NO_AFILIADO'
        WHEN m.expires_at < NOW() THEN 'EXPIRADA'
        WHEN m.active = TRUE THEN 'VIGENTE'
        ELSE 'INACTIVA'
    END AS status_membership
FROM users u
LEFT JOIN memberships m ON m.user_id = u.id
WHERE u.deleted_at IS NULL
ORDER BY discount_pct DESC, u.name ASC;
```

### 1.3 Intermedia: Auditoría de roles administrativos y de cajero (RBAC)
Si se gestiona el rol por columna o mediante tabla normalizada, identifica usuarios con privilegios elevados:

```sql
-- Enfoque con esquema normalizado RBAC (roles + user_roles)
SELECT 
    u.id AS user_id,
    u.name,
    u.email,
    r.name AS role_name,
    ur.assigned_at
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE r.name IN ('SUPER_ADMIN', 'ADMIN', 'GERENTE_CINE', 'CAJERO')
  AND u.deleted_at IS NULL
ORDER BY r.name, u.name;
```

### 1.4 Avanzada: Segmentación RFM (Recencia, Frecuencia y Monetario)
Clasifica a los usuarios según su comportamiento de compra para diseñar campañas de retención.

```sql
WITH UserOrders AS (
    SELECT 
        c.user_id,
        MAX(c.created_at) AS last_purchase_date,
        COUNT(DISTINCT c.id) AS total_orders,
        COALESCE(SUM(cci.quantity * cci.unit_price), 0) AS total_concession_spend
    FROM carts c
    LEFT JOIN cart_concession_items cci ON cci.cart_id = c.id
    WHERE c.status = 'COMPLETED'
    GROUP BY c.user_id
)
SELECT 
    u.id AS user_id,
    u.name,
    u.email,
    ROUND(EXTRACT(DAY FROM (NOW() - uo.last_purchase_date)), 0) AS days_since_last_purchase,
    uo.total_orders AS frequency,
    uo.total_concession_spend AS monetary,
    CASE 
        WHEN uo.last_purchase_date IS NULL THEN 'NUNCA_COMPRO'
        WHEN EXTRACT(DAY FROM (NOW() - uo.last_purchase_date)) <= 15 THEN 'CLIENTE_ACTIVO_FRECUENTE'
        WHEN EXTRACT(DAY FROM (NOW() - uo.last_purchase_date)) <= 45 THEN 'EN_RIESGO_DE_FUGA'
        ELSE 'INACTIVO_CHURN'
    END AS segment
FROM users u
LEFT JOIN UserOrders uo ON uo.user_id = u.id
WHERE u.deleted_at IS NULL
ORDER BY days_since_last_purchase ASC NULLS LAST;
```

---

## 2. Módulo de Películas y Catálogo Cinematográfico

### 2.1 Básica: Catálogo de películas activas en cartelera
Consulta títulos disponibles, clasificaciones y duración en minutos.

```sql
SELECT 
    id AS movie_id,
    title,
    duration_minutes,
    rating,
    release_date,
    is_active
FROM movies
WHERE is_active = TRUE
ORDER BY release_date DESC;
```

### 2.2 Intermedia: Películas con géneros, directores y formatos asociados
Consolida los metadatos de las películas concatenando sus relaciones muchos a muchos.

```sql
SELECT 
    m.id AS movie_id,
    m.title,
    m.duration_minutes,
    STRING_AGG(DISTINCT g.name, ', ') AS genres,
    STRING_AGG(DISTINCT d.name, ', ') AS directors,
    STRING_AGG(DISTINCT f.name, ', ') AS available_formats
FROM movies m
LEFT JOIN movie_genres mg ON mg.movie_id = m.id
LEFT JOIN genres g ON g.id = mg.genre_id
LEFT JOIN directors d ON d.movie_id = m.id
LEFT JOIN movie_formats mf ON mf.movie_id = m.id
LEFT JOIN formats f ON f.id = mf.format_id
WHERE m.is_active = TRUE
GROUP BY m.id, m.title, m.duration_minutes
ORDER BY m.title;
```

### 2.3 Avanzada: Coincidencia y afinidad de géneros para recomendaciones
Algoritmo en SQL que replica la lógica de recomendación de `ListMovieRecommendationsService` midiendo el traslape de géneros.

```sql
WITH TargetGenres AS (
    SELECT genre_id 
    FROM movie_genres 
    WHERE movie_id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' -- ID de la película base
)
SELECT 
    m.id AS recommended_movie_id,
    m.title,
    COUNT(mg.genre_id) AS matching_genres_count
FROM movies m
JOIN movie_genres mg ON mg.movie_id = m.id
JOIN TargetGenres tg ON tg.genre_id = mg.genre_id
WHERE m.id <> 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND m.is_active = TRUE
GROUP BY m.id, m.title
ORDER BY matching_genres_count DESC, m.title ASC
LIMIT 5;
```

---

## 3. Módulo de Ubicaciones, Complejos y Salas

### 3.1 Básica: Árbol territorial de cines habilitados
Jerarquía geográfica de países, departamentos y ciudades con presencia de cines activos.

```sql
SELECT 
    co.name AS country,
    d.name AS department,
    ci.name AS city,
    c.name AS cinema_name,
    c.address
FROM cinemas c
JOIN cities ci ON ci.id = c.city_id
JOIN departments d ON d.id = ci.department_id
JOIN countries co ON co.id = d.country_id
WHERE c.is_active = TRUE
ORDER BY co.name, d.name, ci.name, c.name;
```

### 3.2 Intermedia: Inventario de salas y capacidad instalada por complejo
Detalla las salas, capacidad de aforo y sobrecosto tarifario de sala (*extra_price*).

```sql
SELECT 
    c.name AS cinema,
    r.name AS room_name,
    COALESCE(rt.name, 'ESTÁNDAR') AS room_type,
    r.capacity,
    r.extra_price
FROM rooms r
JOIN cinemas c ON c.id = r.cinema_id
LEFT JOIN room_types rt ON rt.id = r.room_type_id
ORDER BY c.name, r.capacity DESC;
```

---

## 4. Módulo de Funciones, Horarios y Tarifas

### 4.1 Básica: Funciones programadas para la fecha actual
Horarios de funciones para la jornada de hoy.

```sql
SELECT 
    f.id AS function_id,
    m.title AS movie,
    r.name AS room,
    f.starts_at,
    f.base_price
FROM functions f
JOIN movies m ON m.id = f.movie_id
JOIN rooms r ON r.id = f.room_id
WHERE f.active = TRUE
  AND f.starts_at >= CURRENT_DATE 
  AND f.starts_at < CURRENT_DATE + INTERVAL '1 day'
ORDER BY f.starts_at ASC;
```

### 4.2 Intermedia: Tarifario final por función (Regla RN-037)
Calcula el precio unitario base de entrada sumando la tarifa de la función y el recargo específico de la sala.

```sql
SELECT 
    f.id AS function_id,
    m.title AS movie,
    c.name AS cinema,
    r.name AS room,
    ft.projection AS format,
    ft.audio_type,
    f.starts_at,
    f.base_price,
    COALESCE(r.extra_price, 0) AS room_surcharge,
    (f.base_price + COALESCE(r.extra_price, 0)) AS final_seat_unit_price
FROM functions f
JOIN movies m ON m.id = f.movie_id
JOIN rooms r ON r.id = f.room_id
JOIN cinemas c ON c.id = r.cinema_id
JOIN function_types ft ON ft.id = f.function_type_id
WHERE f.starts_at > NOW()
ORDER BY f.starts_at ASC;
```

---

## 5. Módulo de Selección de Sillas y Reservas (HU-010)

### 5.1 Básica: Asientos y distribución por sala
Auditoría del mapa de sillas por fila, número y categoría (*STANDARD, VIP, DISABLED*).

```sql
SELECT 
    r.name AS room_name,
    s.row,
    s.number,
    s.seat_type
FROM seats s
JOIN rooms r ON r.id = s.room_id
ORDER BY r.name, s.row, s.number::INT;
```

### 5.2 Intermedia: Ocupación en tiempo real por función
Muestra sillas vendidas, bloqueadas bajo el temporizador de 10 minutos (*RN-039*) y sillas libres.

```sql
SELECT 
    f.id AS function_id,
    m.title AS movie,
    r.capacity AS total_seats,
    COUNT(DISTINCT t.seat_id) AS sold_seats,
    COUNT(DISTINCT sl.seat_id) FILTER (WHERE sl.expires_at > NOW()) AS active_locked_seats,
    r.capacity - COUNT(DISTINCT t.seat_id) - COUNT(DISTINCT sl.seat_id) FILTER (WHERE sl.expires_at > NOW()) AS available_seats
FROM functions f
JOIN movies m ON m.id = f.movie_id
JOIN rooms r ON r.id = f.room_id
LEFT JOIN tickets t ON t.function_id = f.id
LEFT JOIN seat_locks sl ON sl.function_id = f.id
GROUP BY f.id, m.title, r.capacity;
```

### 5.3 Avanzada: Detección y limpieza de bloqueos expirados (RN-040)
Identifica bloqueos temporales que ya superaron su ventana de vigencia y deben liberarse.

```sql
SELECT 
    sl.cart_id,
    sl.function_id,
    COUNT(sl.seat_id) AS expired_locks_count,
    MIN(sl.expires_at) AS earliest_expiration,
    MAX(sl.expires_at) AS latest_expiration
FROM seat_locks sl
WHERE sl.expires_at <= NOW()
GROUP BY sl.cart_id, sl.function_id;
```

---

## 6. Módulo de Carrito de Compras, Confitería y Bonos (HU-011)

### 6.1 Básica: Control de stock crítico de confitería
Alerta sobre productos de confitería agotados o próximos a agotarse.

```sql
SELECT 
    id AS product_id,
    name,
    price,
    stock,
    active,
    CASE 
        WHEN stock = 0 THEN 'AGOTADO'
        WHEN stock <= 10 THEN 'ALERTA_CRITICA'
        ELSE 'EN_INVENTARIO'
    END AS status_stock
FROM products
WHERE active = TRUE
ORDER BY stock ASC;
```

### 6.2 Intermedia: Carritos activos con tiempo de expiración restante (RN-046)
Muestra carritos actualmente en uso con los minutos restantes antes de que se liberen automáticamente sus sillas.

```sql
SELECT 
    c.id AS cart_id,
    u.name AS user_name,
    c.status,
    c.membership_applied,
    c.expires_at,
    ROUND(EXTRACT(EPOCH FROM (c.expires_at - NOW())) / 60.0, 1) AS minutes_remaining
FROM carts c
JOIN users u ON u.id = c.user_id
WHERE c.status = 'ACTIVE'
  AND c.expires_at > NOW()
ORDER BY minutes_remaining ASC;
```

### 6.3 Avanzada: Embudo de conversión y tasa de abandono de carritos
Monitorea la conversión global de la pasarela de compra.

```sql
SELECT 
    COUNT(*) AS total_carts_created,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_purchases,
    COUNT(*) FILTER (WHERE status = 'EXPIRED') AS expired_abandoned,
    COUNT(*) FILTER (WHERE status = 'CANCELLED') AS explicitly_cancelled,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'COMPLETED')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2
    ) AS conversion_rate_pct,
    ROUND(
        (COUNT(*) FILTER (WHERE status IN ('EXPIRED', 'CANCELLED'))::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2
    ) AS dropoff_rate_pct
FROM carts;
```

---

## 7. Módulo de Analítica Ejecutiva, KPIs y Métricas de Negocio

### 7.1 Avanzada: Ley de Pareto (80/20) en Taquilla con Window Functions
Calcula qué películas generan el mayor volumen acumulado de recaudación.

```sql
WITH BoxOffice AS (
    SELECT 
        m.id AS movie_id,
        m.title,
        COUNT(t.id) AS tickets_sold,
        SUM(t.price) AS total_revenue
    FROM movies m
    JOIN functions f ON f.movie_id = m.id
    JOIN tickets t ON t.function_id = f.id
    GROUP BY m.id, m.title
)
SELECT 
    DENSE_RANK() OVER (ORDER BY total_revenue DESC) AS ranking,
    title,
    tickets_sold,
    total_revenue,
    ROUND((total_revenue / SUM(total_revenue) OVER ()) * 100, 2) AS revenue_share_pct,
    ROUND(
        SUM(total_revenue) OVER (ORDER BY total_revenue DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) 
        / SUM(total_revenue) OVER () * 100, 2
    ) AS cumulative_pct
FROM BoxOffice
ORDER BY total_revenue DESC;
```

### 7.2 Avanzada: Ticket Promedio (AOV) Desglosado: Boletos vs Confitería
Indica cuánto aporta la taquilla y cuánto aporta la confitería por cada compra completada.

```sql
WITH CartTickets AS (
    SELECT 
        sl.cart_id,
        SUM(t.price) AS tickets_amount
    FROM seat_locks sl
    JOIN tickets t ON t.function_id = sl.function_id AND t.seat_id = sl.seat_id
    GROUP BY sl.cart_id
),
CartConcessions AS (
    SELECT 
        cart_id,
        SUM(quantity * unit_price) AS concessions_amount
    FROM cart_concession_items
    GROUP BY cart_id
)
SELECT 
    COUNT(c.id) AS total_orders,
    ROUND(AVG(COALESCE(ct.tickets_amount, 0) + COALESCE(cc.concessions_amount, 0)), 2) AS avg_total_order_value,
    ROUND(AVG(COALESCE(ct.tickets_amount, 0)), 2) AS avg_tickets_revenue,
    ROUND(AVG(COALESCE(cc.concessions_amount, 0)), 2) AS avg_concessions_revenue,
    ROUND(
        (SUM(COALESCE(cc.concessions_amount, 0)) / 
        NULLIF(SUM(COALESCE(ct.tickets_amount, 0) + COALESCE(cc.concessions_amount, 0)), 0)) * 100, 2
    ) AS concession_revenue_share_pct
FROM carts c
LEFT JOIN CartTickets ct ON ct.cart_id = c.id
LEFT JOIN CartConcessions cc ON cc.cart_id = c.id
WHERE c.status = 'COMPLETED';
```

### 7.3 Compleja: Percentiles de Tiempo de Compra (p50, p75, p90, p95)
Analiza cuánto demoran los usuarios en completar el proceso antes de la expiración de la sesión.

```sql
WITH CompletedSessions AS (
    SELECT 
        c.id,
        EXTRACT(EPOCH FROM (MAX(cci.created_at) - c.created_at)) / 60.0 AS duration_minutes
    FROM carts c
    JOIN cart_concession_items cci ON cci.cart_id = c.id
    WHERE c.status = 'COMPLETED'
    GROUP BY c.id, c.created_at
)
SELECT 
    COUNT(*) AS completed_samples,
    ROUND(AVG(duration_minutes)::NUMERIC, 2) AS mean_duration_mins,
    ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_minutes)::NUMERIC, 2) AS median_p50_mins,
    ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY duration_minutes)::NUMERIC, 2) AS p75_mins,
    ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY duration_minutes)::NUMERIC, 2) AS p90_mins,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_minutes)::NUMERIC, 2) AS p95_mins
FROM CompletedSessions;
```

### 7.4 Compleja: Ocupación Ponderada por Complejo y Día de la Semana
Permite planificar horarios y promociones dinámicas según los días de mayor y menor asistencia.

```sql
SELECT 
    c.name AS cinema,
    TO_CHAR(f.starts_at, 'FMDay') AS day_name,
    EXTRACT(ISODOW FROM f.starts_at) AS day_number,
    COUNT(DISTINCT f.id) AS total_functions,
    SUM(r.capacity) AS total_capacity_offered,
    COUNT(t.id) AS total_tickets_sold,
    ROUND(
        (COUNT(t.id)::DECIMAL / NULLIF(SUM(r.capacity), 0)) * 100, 2
    ) AS occupancy_rate_pct,
    SUM(t.price) AS total_box_office
FROM functions f
JOIN rooms r ON r.id = f.room_id
JOIN cinemas c ON c.id = r.cinema_id
LEFT JOIN tickets t ON t.function_id = f.id
GROUP BY c.name, TO_CHAR(f.starts_at, 'FMDay'), EXTRACT(ISODOW FROM f.starts_at)
ORDER BY c.name, day_number;
```

