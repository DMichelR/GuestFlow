# Panel de Administración del Sistema - ClickHouse Analytics

## 📊 Descripción

Se ha implementado un panel de administración completo para usuarios con rol **admin** en la ruta `/dashboard/reco`. Este panel proporciona métricas y análisis en tiempo real de todos los tenants del sistema utilizando **ClickHouse** como fuente de datos.

## 🎯 Características Principales

### Detección Automática de Rol

- El sistema detecta automáticamente si el usuario tiene rol de **admin** o **manager**
- Los usuarios **admin** ven 3 tabs especializadas con métricas del sistema
- Los usuarios **manager** continúan viendo las 6 tabs tradicionales de su hotel

### Tabs para Administradores

Todas las tabs incluyen **filtros de fecha** con las siguientes características:

- **Selectores de fecha personalizados**: Fecha inicial y final
- **Presets rápidos**:
  - Último Mes (1m)
  - Últimos 3 Meses (3m)
  - Últimos 6 Meses (6m) - _Por defecto_
  - Último Año (1y)
- **Actualización automática**: Los datos se recargan al cambiar las fechas
- **Formato consistente**: Todas las métricas reflejan el período seleccionado

#### 1. 📈 Métricas del Sistema

Proporciona una vista general del estado del sistema:

**Métricas Principales:**

- **Total Tenants**: Número total de clientes activos (período seleccionado)
- **Huéspedes Totales**: Cantidad de huéspedes únicos (período seleccionado)
- **Total Estadías**: Número total de reservas (período seleccionado)
- **Ingresos Totales**: Suma de ingresos del sistema (período seleccionado)

**Performance del Sistema:**

- Registros totales en la base de datos
- Días con datos disponibles
- Tenants registrados en el sistema

**Gráficos:**

- **Tendencia de Ingresos**: Gráfico de barras mostrando ingresos mensuales
- **Crecimiento de Usuarios**: Gráfico de líneas con tenants activos y huéspedes únicos por mes

#### 2. 🏢 Tenants

Análisis detallado de la actividad de los clientes:

**Resumen:**

- Tenants activos (período seleccionado)
- Total de reservaciones (período seleccionado)
- Ingreso promedio por reservación

**Visualizaciones:**

- **Top 10 Tenants por Ingresos**: Gráfico de barras filtrado por rango de fechas
- **Tabla de Actividad**: Muestra huéspedes únicos, estadías e ingresos por tenant (período seleccionado)
- **Tabla de Uso**: Estadísticas completas incluyendo habitaciones, huéspedes, reservas y fechas de actividad (período seleccionado)

#### 3. 🌍 Análisis Global

Distribución geográfica y métricas globales:

**Métricas:**

- Países activos con presencia
- Total de tenants en todos los países (período seleccionado)
- Estadías totales acumuladas (período seleccionado)

**Visualizaciones:**

- **Distribución por País**: Gráfico circular con número de tenants por ubicación (período seleccionado)
- **Tabla de Detalles**: Estadísticas por país con tenants, estadías y promedios (período seleccionado)

## 🔧 Implementación Técnica

### Frontend

#### Nuevos Archivos Creados

1. **Servicio de ClickHouse**

   - `client/src/lib/clickhouse.ts`
   - Métodos para interactuar con el endpoint de ClickHouse
   - Incluye funciones de utilidad para consultas comunes

2. **Componentes de Admin**

   - `client/src/components/dashboard/admin/AdminSystemMetricsTab.tsx`
   - `client/src/components/dashboard/admin/AdminTenantsTab.tsx`
   - `client/src/components/dashboard/admin/AdminAnalyticsTab.tsx`

3. **Página Actualizada**
   - `client/src/app/dashboard/reco/page.tsx` - Ahora detecta el rol y muestra tabs dinámicamente

#### Dependencias Nuevas

```json
{
  "chart.js": "^4.5.1",
  "react-chartjs-2": "^5.3.1"
}
```

### Backend

#### API Endpoints de ClickHouse

**Base URL**: `/api/ClickHouse`

1. **GET /test-connection**

   - Prueba la conexión a ClickHouse
   - Respuesta: `{ success: boolean, message: string }`

2. **GET /database-info**

   - Obtiene versión y bases de datos disponibles
   - Respuesta: `{ version: string, databases: string[] }`

3. **GET /tables?database={name}**

   - Lista las tablas de una base de datos
   - Respuesta: `{ database: string, tables: string[] }`

4. **POST /query**
   - Ejecuta consultas personalizadas (solo SELECT, SHOW, DESCRIBE)
   - Body: `{ query: string }`
   - Respuesta: `{ success: boolean, rowCount: number, columns: string[], data: object[] }`

## 📝 Uso

### Como Administrador

1. Inicia sesión con una cuenta que tenga rol **admin**
2. Navega a `/dashboard/reco`
3. Verás automáticamente las 3 tabs de administración:
   - Métricas del Sistema
   - Tenants
   - Análisis Global

### Como Manager

1. Inicia sesión con una cuenta que tenga rol **manager**
2. Navega a `/dashboard/reco`
3. Verás las 6 tabs tradicionales:
   - Ocupación
   - Ingresos
   - Reservas
   - Servicios
   - Habitaciones
   - Huéspedes

## 🔐 Seguridad

- Todos los endpoints requieren autenticación mediante Clerk
- Los tokens JWT se pasan automáticamente en las peticiones
- Las consultas están limitadas a operaciones de solo lectura
- Solo los usuarios con rol **admin** pueden ver las métricas del sistema

## 🚀 Consultas Predefinidas

El servicio de ClickHouse incluye las siguientes consultas predefinidas:

```typescript
// Métricas del sistema (últimos 30 días)
ClickHouseService.getSystemMetrics(token);

// Actividad por tenant
ClickHouseService.getTenantActivity(days, token);

// Estadísticas de uso por tenant
ClickHouseService.getTenantUsageStats(token);

// Tendencias de crecimiento anual
ClickHouseService.getSystemGrowthTrends(token);

// Distribución geográfica
ClickHouseService.getTenantGeographicDistribution(token);

// Top tenants por ingresos
ClickHouseService.getTopTenants(limit, token);

// Métricas de performance
ClickHouseService.getSystemPerformanceMetrics(token);
```

## 📊 Requisitos

### Backend

- ClickHouse debe estar corriendo y accesible
- El ETL debe estar activo para tener datos actualizados
- El star schema debe estar creado en ClickHouse

### Frontend

- Usuario debe tener rol **admin** en Clerk
- Las variables de entorno deben estar configuradas correctamente

## 🐛 Troubleshooting

### No veo las tabs de admin

- Verifica que tu usuario tenga el rol **admin** en Clerk
- Revisa los metadatos públicos del usuario: `user.publicMetadata.role`

### Los gráficos no cargan

- Verifica que ClickHouse esté corriendo: `docker ps | grep clickhouse`
- Revisa la consola del navegador para errores
- Confirma que el ETL haya procesado datos

### Errores de autenticación

- Verifica que el token de Clerk esté presente
- Revisa la configuración de CORS en la API
- Confirma que el endpoint de ClickHouse acepte el token

## 📈 Próximas Mejoras

- [ ] Agregar filtros de fecha personalizados
- [ ] Exportar datos a CSV/Excel
- [ ] Alertas y notificaciones para métricas críticas
- [ ] Comparación entre períodos
- [ ] Dashboard personalizable
- [ ] Métricas en tiempo real con WebSockets

## 🤝 Contribución

Para agregar nuevas métricas:

1. Agrega el método al `ClickHouseService` en `client/src/lib/clickhouse.ts`
2. Crea o actualiza el componente correspondiente en `client/src/components/dashboard/admin/`
3. Actualiza la documentación

---

**Nota**: Esta funcionalidad es exclusiva para administradores del sistema y proporciona visibilidad completa sobre todos los tenants y sus actividades.
