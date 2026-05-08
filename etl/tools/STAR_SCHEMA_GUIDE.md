# Star Schema Tools - Usage Guide

This guide explains how to use the star schema creation and validation tools for the GuestFlow data warehouse.

## Prerequisites

- Docker and Docker Compose running
- ClickHouse container running
- PostgreSQL container running (for validation)

## Files Created

### 1. `star_schema.py`

Defines the complete star schema structure including:

- **8 Dimension Tables**: DimTenant, DimGuest, DimRoom, DimCompany, DimService, DimUser, DimVisitReason, DimTime
- **2 Fact Tables**: FactStay, FactServiceTicket
- **2 Bridge Tables**: BridgeStayGuests, BridgeStayRooms

### 2. `tools/create_star_schema.py`

Script to create all star schema tables in ClickHouse and populate DimTime.

### 3. `tools/validate_etl.py`

Script to validate data integrity and referential integrity between tables.

## Usage

### Creating the Star Schema

Run this command from the project root to create all tables:

```bash
docker run --rm \
  --network guestflow_guestflow-network \
  -v "$(pwd)/etl":/app \
  -w /app \
  -e CLICKHOUSE_HOST=clickhouse \
  -e CLICKHOUSE_PORT=9000 \
  -e CLICKHOUSE_DB=default \
  -e CLICKHOUSE_USER=default \
  -e CLICKHOUSE_PASSWORD=clickhouse_password \
  python:3.11-slim bash -c "pip install -q psycopg2-binary clickhouse-driver python-dotenv sqlalchemy pydantic pydantic-settings coloredlogs && python tools/create_star_schema.py"
```

**What it does:**

- Creates all dimension, fact, and bridge tables if they don't exist
- Populates DimTime with dates from 2022 to 2030 (3,287 records)
- Verifies all tables were created successfully

**Output:**

- ✓ Tables created/verified
- ✓ DimTime populated
- Summary report

### Validating the ETL

Run this command to validate data integrity:

```bash
docker run --rm \
  --network guestflow_guestflow-network \
  -v "$(pwd)/etl":/app \
  -w /app \
  -e POSTGRES_HOST=postgres-primary \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_DB=guestflow \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres_password \
  -e CLICKHOUSE_HOST=clickhouse \
  -e CLICKHOUSE_PORT=9000 \
  -e CLICKHOUSE_DB=default \
  -e CLICKHOUSE_USER=default \
  -e CLICKHOUSE_PASSWORD=clickhouse_password \
  python:3.11-slim bash -c "pip install -q psycopg2-binary clickhouse-driver python-dotenv sqlalchemy pydantic pydantic-settings coloredlogs && python tools/validate_etl.py"
```

**What it validates:**

- ✓ All tables exist
- ✓ No duplicate keys in dimension tables
- ✓ Referential integrity between fact and dimension tables
- ✓ Date ranges are reasonable
- ⚠ Warns about empty tables

**Exit codes:**

- `0` - All validations passed
- `1` - Validation failed with errors

## Schema Overview

### Dimension Tables

| Table            | Key            | Description                    | SCD Type |
| ---------------- | -------------- | ------------------------------ | -------- |
| `DimTenant`      | TenantKey      | Tenant information             | Type 1   |
| `DimGuest`       | GuestKey       | Guest information with history | Type 2   |
| `DimRoom`        | RoomKey        | Room information with history  | Type 2   |
| `DimCompany`     | CompanyKey     | Company information            | Type 1   |
| `DimService`     | ServiceKey     | Available services             | Type 1   |
| `DimUser`        | UserKey        | System users                   | Type 1   |
| `DimVisitReason` | VisitReasonKey | Visit reasons                  | Type 1   |
| `DimTime`        | DateKey        | Date dimension                 | -        |

### Fact Tables

| Table               | Grain                      | Measures                                           |
| ------------------- | -------------------------- | -------------------------------------------------- |
| `FactStay`          | One row per stay           | FinalPrice, Pax, Nights, RoomsCount, ServicesCount |
| `FactServiceTicket` | One row per service ticket | ServicePrice, Quantity                             |

### Bridge Tables

| Table              | Purpose                      |
| ------------------ | ---------------------------- |
| `BridgeStayGuests` | Many-to-many: Stays ↔ Guests |
| `BridgeStayRooms`  | Many-to-many: Stays ↔ Rooms  |

## Table Engines

- **Dimensions**: `MergeTree()` - optimized for lookups
- **Facts**: `MergeTree()` with partitioning by date (YYYYMM)
- **Bridges**: `MergeTree()` - optimized for joins

## Key Transformations

The ETL transforms PostgreSQL UUIDs to ClickHouse UInt64 keys using:

```python
key = int(uuid.hex[:16], 16)
```

This provides:

- Consistent key generation
- Better performance in ClickHouse
- Maintains referential integrity

## Next Steps

After creating the schema:

1. **Populate dimensions** - Run the ETL to load dimension data from PostgreSQL
2. **Populate facts** - Run the ETL to load fact data
3. **Validate** - Run `validate_etl.py` to check integrity
4. **Create aggregations** - Create materialized views for analytics
5. **Connect Metabase** - Point Metabase to ClickHouse for dashboards

## Troubleshooting

### Tables already exist

The `create_star_schema.py` script will skip existing tables. To recreate:

```sql
-- In ClickHouse
DROP TABLE IF EXISTS default.TableName;
```

### Validation errors

Check the validation output for specific errors. Common issues:

- Missing foreign keys (orphaned records)
- Duplicate keys in dimensions
- Date range issues

### Connection issues

Ensure containers are running:

```bash
docker compose ps
```

## Integration with Existing ETL

The star schema is designed to work with the existing ETL process in `etl.py`. The transformation methods in `etl.py` should populate these tables using the logic already implemented for dimension and fact transformations.

## Performance Notes

- DimTime is pre-populated for fast joins
- Facts are partitioned by month for efficient queries
- All tables use MergeTree engine for OLAP performance
- Consider adding materialized views for common aggregations

---

**Created**: November 2025  
**Version**: 1.0  
**Status**: ✅ Fully implemented and tested
