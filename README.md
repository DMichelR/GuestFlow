# GuestFlow - Hotel Management System

## 🏨 Descripción

GuestFlow es un sistema integral de gestión hotelera con arquitectura moderna que incluye:

- **API Backend**: .NET Core para gestión de operaciones
- **Frontend**: Next.js con interfaz moderna
- **Data Warehouse**: ClickHouse para análisis avanzados
- **ETL en Tiempo Real**: Python con Change Data Capture (CDC)
- **Business Intelligence**: Metabase para dashboards

## 🚀 Arquitectura del Sistema

### Servicios Principales

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   .NET API      │    │  PostgreSQL     │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│  (Database)     │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼ CDC Triggers
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Metabase      │    │  Python ETL     │    │  ClickHouse     │
│   (Analytics)   │◄───│  (Real-time)    │◄──►│ (Data Warehouse)│
│   Port: 3001    │    │  Change Proc.   │    │   Port: 8123    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Componentes Optimizados

❌ **Removidos del docker-compose.yml principal:**

- `postgres-replica` - Reemplazado por CDC directo
- `replica-init` - Ya no necesario sin replicación
- `dbt` - Reemplazado por ETL Python más flexible

✅ **Disponibles opcionalmente:**

- `docker-compose.dev.yml` - Redis, pgAdmin, Grafana para desarrollo
- `docker-compose.prod.yml` - Optimizaciones de producción

## 🛠️ Setup Rápido

### Opción 1: ETL en Tiempo Real (Recomendado)

```bash
# Setup completo con ETL en tiempo real
./etl_manager.sh setup-realtime

# Iniciar modo híbrido (tiempo real + reconciliación)
./etl_manager.sh hybrid

# Monitorear en otra terminal
./etl_manager.sh dashboard
```

### Opción 2: Con Herramientas de Desarrollo

```bash
# Incluye Redis, pgAdmin, Grafana
./etl_manager.sh setup-realtime dev

# Acceder herramientas:
# - pgAdmin: http://localhost:5050
# - Grafana: http://localhost:3002
```

## 📊 Sistema ETL en Tiempo Real

### Características

- **⚡ Latencia < 5 segundos** para sincronización
- **🔄 CDC (Change Data Capture)** con triggers PostgreSQL
- **📈 Dashboard en vivo** con métricas de rendimiento
- **🛡️ Recuperación automática** de errores
- **🔄 Modo híbrido** con reconciliación periódica

### Comandos ETL

```bash
# Comandos principales
./etl_manager.sh hybrid          # Modo recomendado
./etl_manager.sh realtime        # Solo tiempo real
./etl_manager.sh dashboard       # Monitor en vivo
./etl_manager.sh status          # Estado del sistema
./etl_manager.sh cleanup 30      # Limpiar logs > 30 días
```

## 🌐 Accesos del Sistema

| Servicio       | Puerto | URL                   | Credenciales                   |
| -------------- | ------ | --------------------- | ------------------------------ |
| **Frontend**   | 3000   | http://localhost:3000 | -                              |
| **API**        | 8000   | http://localhost:8000 | -                              |
| **PostgreSQL** | 5432   | localhost:5432        | postgres / postgres_password   |
| **ClickHouse** | 8123   | http://localhost:8123 | default / clickhouse_password  |
| **Metabase**   | 3001   | http://localhost:3001 | -                              |
| **pgAdmin** \* | 5050   | http://localhost:5050 | admin@guestflow.com / admin123 |
| **Grafana** \* | 3002   | http://localhost:3002 | admin / admin123               |

_\* Solo disponible en modo desarrollo_

## 📈 Monitoreo y Métricas

### Dashboard ETL

```bash
./etl_manager.sh dashboard
```

**Métricas incluidas:**

- ✅ Rendimiento: Records/seg, latencia
- 🖥️ Sistema: CPU, memoria, disco
- 🗄️ PostgreSQL: Conexiones, cambios CDC
- 🏠 ClickHouse: Consultas, tamaño tablas
- ⚠️ Errores: Log errores recientes

## 🚨 Troubleshooting

### Problemas Comunes

```bash
# Verificar servicios
./etl_manager.sh status

# Ver logs
./etl_manager.sh logs

# Reiniciar ETL
docker compose restart etl
```

## 🎯 Casos de Uso

### 🏨 Operaciones Hoteleras

- Gestión de reservas y huéspedes
- Control de habitaciones y servicios
- Facturación y pagos

### 📊 Business Intelligence

- Ocupación en tiempo real
- Revenue management
- Análisis de comportamiento huéspedes
- KPIs operacionales

---

**🎉 ¡Tu sistema está listo para procesar datos en tiempo real!** 🚀
