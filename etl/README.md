# GuestFlow ETL Service

This ETL (Extract, Transform, Load) service is responsible for synchronizing data from PostgreSQL to ClickHouse for analytics purposes. It's designed to work in two modes:

1. **Initial Load Mode**: Transfers all data from PostgreSQL to ClickHouse, creating the necessary tables and materialized views.
2. **CDC Mode**: Continuously monitors for changes in PostgreSQL and updates ClickHouse in real-time.

## Architecture

The ETL service consists of the following components:

- **ETL Core**: Handles the main ETL process, table creation, and data synchronization.
- **CDC Handler**: Monitors for changes in PostgreSQL using logical replication.
- **Schema Mapper**: Maps PostgreSQL schemas to ClickHouse schemas, handling naming conventions.
- **Transformer**: Transforms data from PostgreSQL format to analytics-optimized format for ClickHouse.
- **Database Connectors**: Provides connections to PostgreSQL and ClickHouse.

## Features

- **Schema Mapping**: Automatically maps PostgreSQL schemas to ClickHouse, handling casing differences between .NET and ClickHouse conventions.
- **Data Transformation**: Transforms data for analytics, including calculated fields, proper enum mappings, and time-based partitioning.
- **Real-time CDC**: Captures changes in PostgreSQL in real-time and applies them to ClickHouse.
- **Materialized Views**: Creates optimized materialized views for common analytics queries.
- **Dashboard Views**: Creates views specifically designed for Metabase dashboards.
- **Robust Error Handling**: Includes retry logic, comprehensive logging, and fault tolerance.

## Configuration

The ETL service is configured using environment variables:

- **PostgreSQL Configuration**:

  - `POSTGRES_HOST`: PostgreSQL hostname
  - `POSTGRES_PORT`: PostgreSQL port
  - `POSTGRES_DB`: PostgreSQL database name
  - `POSTGRES_USER`: PostgreSQL username
  - `POSTGRES_PASSWORD`: PostgreSQL password

- **ClickHouse Configuration**:

  - `CLICKHOUSE_HOST`: ClickHouse hostname
  - `CLICKHOUSE_PORT`: ClickHouse port
  - `CLICKHOUSE_DB`: ClickHouse database name
  - `CLICKHOUSE_USER`: ClickHouse username
  - `CLICKHOUSE_PASSWORD`: ClickHouse password

- **ETL Configuration**:
  - `INITIAL_LOAD`: Set to "True" to perform an initial load of all data (default: "False")
  - `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)

## How It Works

### Initial Load Process

1. Connects to PostgreSQL and ClickHouse databases
2. Retrieves the list of tables from PostgreSQL
3. For each table:
   - Gets the PostgreSQL schema
   - Creates corresponding ClickHouse table with optimized schema
   - Retrieves data from PostgreSQL
   - Transforms the data for analytics
   - Loads the data into ClickHouse
4. Creates materialized views and dashboard views for analytics

### CDC Process

1. Sets up a logical replication slot in PostgreSQL
2. Sets up notification listeners for change events
3. Continuously monitors for changes in PostgreSQL
4. When changes are detected:
   - Extracts the table name, operation type, and record ID
   - For INSERT and UPDATE operations: retrieves the current record, transforms it, and inserts it into ClickHouse
   - For DELETE operations: removes the record from ClickHouse

## Directory Structure

- `config.py`: Configuration settings
- `db.py`: Database connection handlers
- `etl.py`: Main ETL process
- `cdc_handler.py`: CDC-specific functionality
- `schema_mapper.py`: Maps PostgreSQL schemas to ClickHouse
- `transformer.py`: Data transformation logic
- `materialized_views.py`: Definitions for materialized views
- `dashboard_views.py`: Definitions for dashboard views
- `logger.py`: Logging configuration
- `main.py`: Entry point
- `tools/`: Utility scripts for validation and monitoring
- `tests/`: Unit tests

## Running the ETL Service

The ETL service is designed to run as a Docker container and is included in the GuestFlow docker-compose.yml file. It automatically starts when the GuestFlow application is deployed.

### Manual Execution

If needed, the ETL service can be run manually with:

```bash
python main.py
```

### Validation

To validate the ETL process, use the validation tool:

```bash
python tools/validate_etl.py --mode initial
# or
python tools/validate_etl.py --mode cdc --table [table_name]
```

## Monitoring

The ETL service logs to `/app/logs/etl.log` with rotation enabled. Monitor these logs for any issues or errors in the ETL process.

## Testing

Run the test suite with:

```bash
cd tests
python -m unittest discover
```

## Notes on Schema Mapping

The ETL service handles the conversion between .NET's PascalCase naming convention and ClickHouse's lowercase naming convention. It also handles pluralized table names (e.g., both "tenant" and "tenants" are mapped correctly).

The schema mapping is defined in `schema_mapper.py` and includes optimized settings for:

- Column types
- Primary keys
- Partitioning
- Ordering
- Engine settings

## Created By

This ETL service was developed as part of the GuestFlow project.
