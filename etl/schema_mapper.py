"""
Schema mapper for PostgreSQL to ClickHouse ETL.
Maps PostgreSQL table schemas to their ClickHouse equivalents.
Optimized for GuestFlow application data warehouse needs.
"""
import logging

logger = logging.getLogger(__name__)

# PostgreSQL to ClickHouse type mappings
PG_TO_CH_TYPE_MAP = {
    "integer": "Int32",
    "bigint": "Int64",
    "smallint": "Int16",
    "character varying": "String",
    "varchar": "String",
    "text": "String",
    "boolean": "UInt8",
    "timestamp without time zone": "DateTime",
    "timestamp with time zone": "DateTime64(3)",  # Better timezone support
    "date": "Date",
    "time without time zone": "String",
    "time with time zone": "String",
    "numeric": "Decimal64(10)",
    "money": "Decimal64(4)",  # Specific for money types in ServiceTicket and Stay
    "double precision": "Float64",
    "real": "Float32",
    "uuid": "UUID",
    "json": "String",
    "jsonb": "String",
    "bytea": "String"
}

# Table schemas with explicit mapping definitions optimized for data warehouse
TABLE_SCHEMAS = {
    # Tablas dimensionales
    "tenant": {
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "tenant_name": "String",  # Columna renombrada para claridad
            "is_active": "UInt8"
        }
    },
    "tenants": {  # Versión en plural para manejar ambos casos
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "tenant_name": "String",  # Columna renombrada para claridad
            "is_active": "UInt8"
        }
    },
    "country": {
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "country_name": "String",  # Columna renombrada para claridad
            "country_code": "String",
            "is_active": "UInt8"
        }
    },
    "city": {
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "city_name": "String",  # Columna renombrada para claridad
            "CountryId": "UUID",
            "IsActive": "UInt8"
        }
    },
    "cities": {  # Versión en plural para manejar ambos casos
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "city_name": "String",  # Columna renombrada para claridad
            "CountryId": "UUID",
            "IsActive": "UInt8"
        }
    },
    "room_type": {
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "type_name": "String",  # Columna renombrada para claridad
            "capacity": "UInt8",
            "price": "Decimal64(4)",
            "IsActive": "UInt8"
        }
    },
    "roomtypes": {  # Versión en plural para manejar ambos casos
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "type_name": "String",  # Columna renombrada para claridad
            "capacity": "UInt8",
            "price": "Decimal64(4)",
            "IsActive": "UInt8"
        }
    },
    "visit_reason": {
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "reason_name": "String",  # Columna renombrada para claridad
            "TenantId": "UUID",
            "IsActive": "UInt8"
        }
    },
    "visitreasons": {  # Versión en plural para manejar ambos casos
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "reason_name": "String",  # Columna renombrada para claridad
            "TenantId": "UUID",
            "IsActive": "UInt8"
        }
    },
    "profession": {
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "profession_name": "String",  # Columna renombrada para claridad
            "TenantId": "UUID",
            "IsActive": "UInt8"
        }
    },
    "professions": {  # Versión en plural para manejar ambos casos
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "profession_name": "String",  # Columna renombrada para claridad
            "TenantId": "UUID",
            "IsActive": "UInt8"
        }
    },
    "company": {
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "company_name": "String",  # Columna renombrada para claridad
            "nit": "String",
            "TenantId": "UUID",
            "IsActive": "UInt8"
        }
    },
    "companies": {  # Versión en plural para manejar ambos casos
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "company_name": "String",  # Columna renombrada para claridad
            "nit": "String",
            "TenantId": "UUID",
            "IsActive": "UInt8"
        }
    },
    "service": {
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "service_name": "String",  # Columna renombrada para claridad
            "description": "String",
            "TenantId": "UUID",
            "IsActive": "UInt8"
        }
    },
    "services": {  # Versión en plural para manejar ambos casos
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "service_name": "String",  # Columna renombrada para claridad
            "description": "String",
            "TenantId": "UUID",
            "IsActive": "UInt8"
        }
    },
    "user": {
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "user_name": "String",  # Columna renombrada para claridad
            "email": "String",
            "TenantId": "UUID",
            "IsActive": "UInt8",
            "access_level": "UInt8"  # Convertido de enum
        }
    },
    "users": {  # Versión en plural para manejar ambos casos
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {
            "user_name": "String",  # Columna renombrada para claridad
            "email": "String",
            "TenantId": "UUID",
            "IsActive": "UInt8",
            "access_level": "UInt8"  # Convertido de enum
        }
    },
    
    # Tablas de hechos y entidades principales
    "room": {
        "engine": "MergeTree() ORDER BY (Id, TenantId)",
        "partition_by": "TenantId",
        "primary_key": "Id",
        "columns": {
            "room_number": "String",  # Columna renombrada para claridad
            "RoomTypeId": "UUID",
            "TenantId": "UUID",
            "Status": "UInt8",  # Convertido de enum
            "status_text": "String",  # Nombre textual del estado
            "IsActive": "UInt8",
            "created_date": "Date",  # Extraído de created
            "created_time": "DateTime"  # Para análisis por tiempo
        }
    },
    "rooms": {  # Versión en plural para manejar ambos casos
        "engine": "MergeTree() ORDER BY (Id, TenantId)",
        "partition_by": "TenantId",
        "primary_key": "Id",
        "columns": {
            "room_number": "String",  # Columna renombrada para claridad
            "RoomTypeId": "UUID",
            "TenantId": "UUID",
            "Status": "UInt8",  # Convertido de enum
            "status_text": "String",  # Nombre textual del estado
            "IsActive": "UInt8",
            "created_date": "Date",  # Extraído de created
            "created_time": "DateTime"  # Para análisis por tiempo
        }
    },
    "guest": {
        "engine": "MergeTree() ORDER BY (Id, TenantId)",
        "partition_by": "TenantId",
        "primary_key": "Id",
        "columns": {
            "full_name": "String",  # Combinación de name y lastname
            "Name": "String",
            "LastName": "String",
            "Cid": "String",
            "Email": "String",
            "Phone": "String",
            "Address": "String",
            "Birthday": "Date",
            "age": "UInt8",  # Calculado a partir de birthday
            "ProfessionId": "UUID",
            "CityId": "UUID",
            "CountryId": "UUID",
            "TenantId": "UUID",
            "IsActive": "UInt8",
            "created_date": "Date"  # Extraído de created
        }
    },
    "guests": {  # Versión en plural para manejar ambos casos
        "engine": "MergeTree() ORDER BY (Id, TenantId)",
        "partition_by": "TenantId",
        "primary_key": "Id",
        "columns": {
            "full_name": "String",  # Combinación de name y lastname
            "Name": "String",
            "LastName": "String",
            "Cid": "String",
            "Email": "String",
            "Phone": "String",
            "Address": "String",
            "Birthday": "Date",
            "age": "UInt8",  # Calculado a partir de birthday
            "ProfessionId": "UUID",
            "CityId": "UUID",
            "CountryId": "UUID",
            "TenantId": "UUID",
            "IsActive": "UInt8",
            "created_date": "Date"  # Extraído de created
        }
    },
    "stay": {
        "engine": "MergeTree() ORDER BY (Id, ArrivalDate, TenantId)",
        "partition_by": "toYYYYMM(ArrivalDate)",
        "primary_key": "Id",
        "columns": {
            "VisitReasonId": "UUID",
            "HolderId": "UUID",  # ID del huésped principal
            "ArrivalDate": "Date",  # Convertido a Date para particionamiento
            "DepartureDate": "Date",  # Convertido a Date para cálculos
            "ReservationDate": "Date",  # Fecha de reserva
            "Pax": "UInt8",  # Número de personas
            "FinalPrice": "Decimal64(4)",
            "Notes": "String",
            "State": "UInt8",  # Convertido de enum
            "state_text": "String",  # Nombre textual del estado
            "CompanyId": "UUID",
            "TenantId": "UUID",
            "IsActive": "UInt8",
            "created_date": "Date",  # Extraído de created
            "stay_duration_days": "UInt16",  # Duración calculada en días
            "revenue_per_day": "Decimal64(4)",  # Precio por día
            "is_company_stay": "UInt8",  # Indicador si es estancia corporativa
            "reservation_lead_time": "Int32"  # Días entre reserva y llegada
        }
    },
    "stays": {  # Versión en plural para manejar ambos casos
        "engine": "MergeTree() ORDER BY (Id, ArrivalDate, TenantId)",
        "partition_by": "toYYYYMM(ArrivalDate)",
        "primary_key": "Id",
        "columns": {
            "VisitReasonId": "UUID",
            "HolderId": "UUID",  # ID del huésped principal
            "ArrivalDate": "Date",  # Convertido a Date para particionamiento
            "DepartureDate": "Date",  # Convertido a Date para cálculos
            "ReservationDate": "Date",  # Fecha de reserva
            "Pax": "UInt8",  # Número de personas
            "FinalPrice": "Decimal64(4)",
            "Notes": "String",
            "State": "UInt8",  # Convertido de enum
            "state_text": "String",  # Nombre textual del estado
            "CompanyId": "UUID",
            "TenantId": "UUID",
            "IsActive": "UInt8",
            "created_date": "Date",  # Extraído de created
            "stay_duration_days": "UInt16",  # Duración calculada en días
            "revenue_per_day": "Decimal64(4)",  # Precio por día
            "is_company_stay": "UInt8",  # Indicador si es estancia corporativa
            "reservation_lead_time": "Int32"  # Días entre reserva y llegada
        }
    },
    "service_ticket": {
        "engine": "MergeTree() ORDER BY (Id, TenantId)",
        "partition_by": "TenantId",
        "primary_key": "Id",
        "columns": {
            "StayId": "UUID",
            "ServiceId": "UUID",
            "UserId": "UUID",  # Usuario que registró el servicio
            "Price": "Decimal64(4)",
            "Notes": "String",
            "TenantId": "UUID",
            "IsActive": "UInt8",
            "created_date": "Date",  # Extraído de created para análisis temporal
            "created_time": "DateTime"  # Para análisis por hora
        }
    },
    "servicetickets": {  # Versión en plural para manejar ambos casos
        "engine": "MergeTree() ORDER BY (Id, TenantId)",
        "partition_by": "TenantId",
        "primary_key": "Id",
        "columns": {
            "StayId": "UUID",
            "ServiceId": "UUID",
            "UserId": "UUID",  # Usuario que registró el servicio
            "Price": "Decimal64(4)",
            "Notes": "String",
            "TenantId": "UUID",
            "IsActive": "UInt8",
            "created_date": "Date",  # Extraído de created para análisis temporal
            "created_time": "DateTime"  # Para análisis por hora
        }
    },
    "group_guests": {
        "engine": "MergeTree() ORDER BY (StayId, GuestId)",
        "partition_by": "StayId",
        "primary_key": "(StayId, GuestId)",
        "columns": {
            "StayId": "UUID",
            "GuestId": "UUID",
            "TenantId": "UUID",
            "is_holder": "UInt8",  # Indicador si es el titular
            "created_date": "Date"  # Extraído de created
        }
    },
    "groupguests": {  # Versión en plural para manejar ambos casos
        "engine": "MergeTree() ORDER BY (StayId, GuestId)",
        "partition_by": "StayId",
        "primary_key": "(StayId, GuestId)",
        "columns": {
            "StayId": "UUID",
            "GuestId": "UUID",
            "TenantId": "UUID",
            "is_holder": "UInt8",  # Indicador si es el titular
            "created_date": "Date"  # Extraído de created
        }
    },
    "group_rooms": {
        "engine": "MergeTree() ORDER BY (StayId, RoomId)",
        "partition_by": "StayId",
        "primary_key": "(StayId, RoomId)",
        "columns": {
            "StayId": "UUID",
            "RoomId": "UUID",
            "TenantId": "UUID",
            "check_in": "DateTime",
            "check_out": "DateTime",
            "created_date": "Date",  # Extraído de created
            "occupation_days": "UInt16"  # Duración calculada en días
        }
    },
    "grouprooms": {  # Versión en plural para manejar ambos casos
        "engine": "MergeTree() ORDER BY (StayId, RoomId)",
        "partition_by": "StayId",
        "primary_key": "(StayId, RoomId)",
        "columns": {
            "StayId": "UUID",
            "RoomId": "UUID",
            "TenantId": "UUID",
            "check_in": "DateTime",
            "check_out": "DateTime",
            "created_date": "Date",  # Extraído de created
            "occupation_days": "UInt16"  # Duración calculada en días
        }
    }
}

def get_clickhouse_type(pg_type, pg_length=None):
    """Convert PostgreSQL data type to ClickHouse data type"""
    base_type = pg_type.lower()
    
    # Handle varchar with length
    if base_type == "character varying" and pg_length:
        return f"FixedString({pg_length})" if pg_length <= 255 else "String"
    
    return PG_TO_CH_TYPE_MAP.get(base_type, "String")

def get_clickhouse_table_name(pg_table_name):
    """
    Get the appropriate ClickHouse table name from a PostgreSQL table name
    Handles converting PascalCase plural forms (Guests) to lowercase singular forms (guest)
    """
    # Handle common plural forms
    pg_table_lower = pg_table_name.lower()
    
    # Special case mappings - handle both PascalCase and lowercase variants
    special_case_mapping = {
        'tenants': 'tenant',
        'guests': 'guest',
        'users': 'user',
        'countries': 'country',
        'cities': 'city',
        'roomtypes': 'room_type',
        'visitreasons': 'visit_reason',
        'professions': 'profession',
        'companies': 'company',
        'services': 'service',
        'rooms': 'room',
        'stays': 'stay',
        'servicetickets': 'service_ticket',
        'groupguests': 'group_guests',
        'grouprooms': 'group_rooms'
    }
    
    # Add PascalCase versions of the mappings
    pascal_case_mapping = {k.capitalize(): v for k, v in special_case_mapping.items()}
    # Also add fully capitalized versions
    upper_case_mapping = {k.upper(): v for k, v in special_case_mapping.items()}
    
    # Merge all mappings
    all_mappings = {**special_case_mapping, **pascal_case_mapping, **upper_case_mapping}
    
    # Try direct mapping first with original name
    if pg_table_name in all_mappings:
        return all_mappings[pg_table_name]
    
    # Try with lowercase
    if pg_table_lower in special_case_mapping:
        return special_case_mapping[pg_table_lower]
    
    # Fall back to general rules
    if pg_table_lower.endswith('ies'):
        return pg_table_lower[:-3] + 'y'
    if pg_table_lower.endswith('s'):
        return pg_table_lower[:-1]
    
    # If no rule matches, return as-is but lowercase
    return pg_table_lower

def get_table_schema(table_name):
    """Get the ClickHouse schema definition for a table"""
    # First get the normalized ClickHouse table name
    ch_table_name = get_clickhouse_table_name(table_name)
    
    # Now look up the schema
    if ch_table_name in TABLE_SCHEMAS:
        logger.info(f"Found schema for table {table_name} using normalized name: {ch_table_name}")
        return TABLE_SCHEMAS[ch_table_name]
    
    # Try with original name
    if table_name in TABLE_SCHEMAS:
        logger.info(f"Found schema for table {table_name} using original name")
        return TABLE_SCHEMAS[table_name]
    
    # Try exact lowercase match if the normalized name wasn't found
    if table_name.lower() in TABLE_SCHEMAS:
        logger.info(f"Found schema for table {table_name} using lowercase name: {table_name.lower()}")
        return TABLE_SCHEMAS[table_name.lower()]
        
    # Try all possible versions
    # Check for plural variants (both with and without capitalization)
    if table_name.lower().endswith('s'):
        singular = table_name.lower()[:-1]
        if singular in TABLE_SCHEMAS:
            logger.info(f"Found schema for table {table_name} using singular form: {singular}")
            return TABLE_SCHEMAS[singular]
    
    # Default schema for tables not explicitly defined
    # Use Id with PascalCase to respect .NET naming convention
    logger.warning(f"No specific schema found for table {table_name}, using default schema")
    return {
        "engine": "MergeTree() ORDER BY (Id)",
        "partition_by": "",
        "primary_key": "Id",
        "columns": {}
    }
