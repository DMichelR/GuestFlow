# Integración de ClickHouse con la API

## 📋 Resumen

Se ha configurado exitosamente la integración con ClickHouse en la API de .NET. Ahora puedes consultar y analizar datos del data warehouse directamente desde tu API.

## 🔧 Configuración Realizada

### 1. Paquete NuGet Instalado

- **ClickHouse.Client** (v7.14.0) - Cliente oficial de ClickHouse para .NET

### 2. Cadenas de Conexión

#### `appsettings.json` (desarrollo local)

```json
"ConnectionStrings": {
  "ClickHouse": "Host=localhost;Port=8123;Database=default;Username=default;Password=clickhouse_password"
}
```

#### `docker-compose.yml` (contenedores)

```yaml
environment:
  - ConnectionStrings__ClickHouse=Host=clickhouse;Port=8123;Database=default;Username=default;Password=clickhouse_password
```

### 3. Servicio de ClickHouse

#### Interfaz: `IClickHouseService`

Ubicación: `Api.Application/Interfaces/Services/IClickHouseService.cs`

Métodos disponibles:

- `ExecuteQueryAsync(query)` - Ejecutar consultas SELECT
- `ExecuteQueryAsync(query, parameters)` - Consultas con parámetros
- `ExecuteNonQueryAsync(command)` - Ejecutar comandos (INSERT, UPDATE, etc.)
- `ExecuteScalarAsync<T>(query)` - Obtener un valor único
- `TestConnectionAsync()` - Verificar conexión

#### Implementación: `ClickHouseService`

Ubicación: `Api.Infrastructure/Services/Domain/ClickHouseService.cs`

### 4. Controlador de Ejemplo

Ubicación: `Api.WebApi/Controllers/ClickHouseController.cs`

## 🚀 Endpoints Disponibles

### 1. Probar Conexión

```bash
GET /api/ClickHouse/test-connection
```

Respuesta:

```json
{
  "success": true,
  "message": "ClickHouse connection successful"
}
```

### 2. Información de la Base de Datos

```bash
GET /api/ClickHouse/database-info
```

Respuesta:

```json
{
  "version": "24.x.x.x",
  "databases": ["default", "system", "guestflow_dw"]
}
```

### 3. Listar Tablas

```bash
GET /api/ClickHouse/tables?database=default
```

Respuesta:

```json
{
  "database": "default",
  "tables": ["dim_guests", "dim_rooms", "fact_stays", ...]
}
```

### 4. Ejecutar Consulta Personalizada

```bash
POST /api/ClickHouse/query
Content-Type: application/json

{
  "query": "SELECT COUNT(*) as total FROM fact_stays"
}
```

Respuesta:

```json
{
  "success": true,
  "rowCount": 1,
  "columns": ["total"],
  "data": [{ "total": 1234 }]
}
```

## 💻 Uso en Tu Código

### Inyectar el Servicio

```csharp
public class MiController : ControllerBase
{
    private readonly IClickHouseService _clickHouseService;

    public MiController(IClickHouseService clickHouseService)
    {
        _clickHouseService = clickHouseService;
    }
}
```

### Ejemplos de Uso

#### 1. Consulta Simple

```csharp
var query = "SELECT COUNT(*) as total FROM fact_stays WHERE stay_date >= today() - 30";
var count = await _clickHouseService.ExecuteScalarAsync<long>(query);
```

#### 2. Consulta con Resultados Múltiples

```csharp
var query = @"
    SELECT
        g.full_name,
        COUNT(*) as total_stays
    FROM fact_stays fs
    JOIN dim_guests g ON fs.guest_key = g.guest_key
    GROUP BY g.full_name
    ORDER BY total_stays DESC
    LIMIT 10";

var dataTable = await _clickHouseService.ExecuteQueryAsync(query);

foreach (DataRow row in dataTable.Rows)
{
    var name = row["full_name"].ToString();
    var stays = Convert.ToInt32(row["total_stays"]);
    // Procesar datos...
}
```

#### 3. Consulta con Parámetros

```csharp
var query = "SELECT * FROM dim_guests WHERE guest_key = {guestKey:Int32}";
var parameters = new Dictionary<string, object>
{
    { "guestKey", 12345 }
};

var result = await _clickHouseService.ExecuteQueryAsync(query, parameters);
```

#### 4. Inserción de Datos

```csharp
var command = @"
    INSERT INTO fact_stays
    (stay_key, guest_key, room_key, check_in_date, check_out_date)
    VALUES ({stayKey}, {guestKey}, {roomKey}, {checkIn}, {checkOut})";

var parameters = new Dictionary<string, object>
{
    { "stayKey", 1 },
    { "guestKey", 100 },
    { "roomKey", 201 },
    { "checkIn", DateTime.Now },
    { "checkOut", DateTime.Now.AddDays(3) }
};

await _clickHouseService.ExecuteNonQueryAsync(command, parameters);
```

## 🧪 Probar la Integración

### Opción 1: Usando curl

```bash
# Probar conexión
curl http://localhost:8111/api/ClickHouse/test-connection

# Obtener información de la base de datos
curl http://localhost:8111/api/ClickHouse/database-info

# Listar tablas
curl http://localhost:8111/api/ClickHouse/tables?database=default

# Ejecutar consulta
curl -X POST http://localhost:8111/api/ClickHouse/query \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT version()"}'
```

### Opción 2: Usando Swagger

1. Navega a `http://localhost:8111/swagger`
2. Busca el controlador `ClickHouse`
3. Prueba los endpoints disponibles

## 📊 Consultas de Ejemplo para el Star Schema

### Ocupación por Mes

```sql
SELECT
    toStartOfMonth(d.date_actual) as month,
    COUNT(DISTINCT fs.room_key) as rooms_occupied,
    AVG(fs.price_per_night) as avg_price
FROM fact_stays fs
JOIN dim_date d ON fs.stay_date_key = d.date_key
WHERE d.date_actual >= today() - 365
GROUP BY month
ORDER BY month
```

### Top 10 Huéspedes

```sql
SELECT
    g.full_name,
    g.email,
    COUNT(*) as total_stays,
    SUM(fs.total_amount) as total_spent
FROM fact_stays fs
JOIN dim_guests g ON fs.guest_key = g.guest_key
GROUP BY g.full_name, g.email
ORDER BY total_stays DESC
LIMIT 10
```

### Ingresos por Tipo de Habitación

```sql
SELECT
    r.room_type,
    COUNT(*) as total_bookings,
    SUM(fs.total_amount) as total_revenue,
    AVG(fs.total_amount) as avg_revenue
FROM fact_stays fs
JOIN dim_rooms r ON fs.room_key = r.room_key
GROUP BY r.room_type
ORDER BY total_revenue DESC
```

## 🔒 Seguridad

- Las consultas están limitadas a operaciones de lectura (SELECT, SHOW, DESCRIBE) en el endpoint público
- Implementa autenticación/autorización según necesites
- Usa parámetros en lugar de concatenación de strings para prevenir SQL injection
- El servicio registra todas las operaciones para auditoría

## 📝 Notas Importantes

1. **Formato de Fechas**: ClickHouse usa el formato `YYYY-MM-DD` para fechas
2. **Tipos de Datos**: Asegúrate de usar los tipos correctos al insertar datos
3. **Performance**: ClickHouse está optimizado para lecturas analíticas masivas
4. **Logging**: Todas las operaciones se registran automáticamente
5. **Connection Pool**: El cliente maneja automáticamente el pool de conexiones

## 🐛 Troubleshooting

### Error: "Connection refused"

- Verifica que el contenedor de ClickHouse esté corriendo: `docker ps | grep clickhouse`
- Verifica la cadena de conexión en `appsettings.json`

### Error: "Authentication failed"

- Verifica el usuario y contraseña en la cadena de conexión
- Por defecto: `default` / `clickhouse_password`

### Error: "Database doesn't exist"

- Verifica que el ETL haya creado el star schema
- Consulta las bases de datos disponibles con el endpoint `/database-info`

## 📚 Recursos

- [Documentación de ClickHouse](https://clickhouse.com/docs)
- [ClickHouse.Client en GitHub](https://github.com/DarkWanderer/ClickHouse.Client)
- [SQL Reference de ClickHouse](https://clickhouse.com/docs/en/sql-reference)
