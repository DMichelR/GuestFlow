# Transformaciones del Data Warehouse - GuestFlow

## Resumen de Transformaciones OLTP → OLAP

Este documento describe cómo las tablas del modelo transaccional (OLTP) se transforman en el modelo dimensional (OLAP) para analytics.

## Arquitectura de Transformación

```
Raw Data (Airbyte) → Staging (Views) → Dimensional Models (Tables) → Analytics
```

### 1. **Capa de Staging** (`models/staging/`)

**Propósito**: Extraer y limpiar datos raw de Airbyte.

#### Transformaciones Principales:

| Tabla Origen     | Staging Model         | Transformaciones Clave                                                                 |
| ---------------- | --------------------- | -------------------------------------------------------------------------------------- |
| `Guests`         | `stg_guests`          | • Concatenar `name` + `lastName` → `full_name`<br>• Calcular edad desde `birthday`     |
| `Users`          | `stg_users`           | • Concatenar `firstName` + `lastName` → `full_name`<br>• Mapear `accessLevel` → `role` |
| `Stays`          | `stg_stays`           | • Calcular `nights` desde fechas<br>• Mapear campos PascalCase                         |
| `Rooms`          | `stg_rooms`           | • Extraer estructura básica de habitación                                              |
| `ServiceTickets` | `stg_service_tickets` | • Mapear `price` → `service_price`<br>• Default `quantity = 1`                         |

### 2. **Capa Dimensional** (`models/dimensions/`)

**Propósito**: Crear dimensiones con Slowly Changing Dimensions (SCD Type 2).

#### Dimensiones Implementadas:

| Dimensión          | Fuente                                                | Características                                   | SCD Type |
| ------------------ | ----------------------------------------------------- | ------------------------------------------------- | -------- |
| `dim_guest`        | `stg_guests` + `professions` + `cities` + `countries` | • Historial de cambios<br>• Datos enriquecidos    | Type 2   |
| `dim_room`         | `stg_rooms` + `stg_room_types`                        | • Precio desde tipo habitación<br>• Estado actual | Type 2   |
| `dim_time`         | Generated                                             | • Calendario 10 años<br>• Metadatos temporales    | N/A      |
| `dim_user`         | `stg_users`                                           | • Nombre completo<br>• Rol de acceso              | Type 1   |
| `dim_company`      | `stg_companies`                                       | • Información básica empresa                      | Type 1   |
| `dim_service`      | `stg_services`                                        | • Catálogo servicios                              | Type 1   |
| `dim_tenant`       | `stg_tenants`                                         | • Información inquilino                           | Type 1   |
| `dim_visit_reason` | `stg_visit_reasons`                                   | • Motivos de visita                               | Type 1   |

### 3. **Capa de Hechos** (`models/facts/`)

**Propósito**: Métricas y eventos del negocio.

#### Tablas de Hechos:

| Tabla de Hechos       | Métricas                                                                                               | Dimensiones Relacionadas                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `fact_stay`           | • `FinalPrice`<br>• `Pax`<br>• `Nights`<br>• `RoomsCount` (calculado)<br>• `ServicesCount` (calculado) | • Guest<br>• Tenant<br>• Company<br>• VisitReason<br>• Time (fechas) |
| `fact_service_ticket` | • `ServicePrice`<br>• `Quantity`                                                                       | • Service<br>• Stay<br>• User<br>• Tenant<br>• Time                  |

### 4. **Capa de Puentes** (`models/bridges/`)

**Propósito**: Relaciones many-to-many.

| Bridge Table         | Relación               | Campos Adicionales |
| -------------------- | ---------------------- | ------------------ |
| `bridge_stay_guests` | Stay ↔ Multiple Guests | `Role`             |
| `bridge_stay_rooms`  | Stay ↔ Multiple Rooms  | `UsageType`        |

## Transformaciones Específicas

### **Campos Calculados:**

1. **Nombres Completos:**

   - `Guests`: `name + ' ' + lastName`
   - `Users`: `firstName + ' ' + lastName`

2. **Edad de Huéspedes:**

   - Calculada: `dateDiff('year', birthday, now())`

3. **Noches de Estadía:**

   - Calculada: `dateDiff('day', arrivalDate, departureDate)`

4. **Conteos Derivados:**
   - `RoomsCount`: COUNT desde `GroupRooms`
   - `ServicesCount`: COUNT desde `ServiceTickets`

### **Claves Surrogate:**

Todas las dimensiones y hechos usan claves hash generadas con `cityHash64()`:

- Formato: `cityHash64(id, timestamp)` para SCD Type 2
- Formato: `cityHash64(id)` para dimensiones simples

### **Manejo de Fechas:**

- **Date Keys**: Convertidas a formato `YYYY-MM-DD`
- **Dimension Temporal**: Generada para 10 años (2020-2030)
- **SCD Efectivity**: `EffectiveDate` y `ExpiryDate`

## Configuración de Materialización

```yaml
staging:
  +materialized: view # No persiste, solo lógica
  +schema: staging

warehouse:
  +materialized: table # Persiste datos
  +engine: MergeTree() # Optimizado para ClickHouse
  +schema: warehouse
```

## Beneficios del Modelo Dimensional

1. **Performance**: Optimizado para consultas analíticas
2. **Escalabilidad**: Engine MergeTree de ClickHouse
3. **Historial**: SCD Type 2 para tracking de cambios
4. **Simplicidad**: Esquema estrella fácil de entender
5. **Flexibilidad**: Bridges para relaciones complejas

## Ejemplo de Consulta Analítica

```sql
SELECT
    dt.Year,
    dt.Month,
    dg.Country,
    sum(fs.FinalPrice) as TotalRevenue,
    avg(fs.Nights) as AvgNights,
    count(*) as TotalStays
FROM fact_stay fs
JOIN dim_time dt ON fs.ArrivalDateKey = dt.DateKey
JOIN dim_guest dg ON fs.GuestKey = dg.GuestKey AND dg.CurrentFlag = 1
WHERE dt.Year = 2024
GROUP BY dt.Year, dt.Month, dg.Country
ORDER BY TotalRevenue DESC;
```

Este modelo permite análisis eficientes de:

- Revenue por período y geografía
- Patrones de ocupación
- Performance de servicios
- Comportamiento de huéspedes
- Métricas operacionales
