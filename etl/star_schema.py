"""
Star Schema Definitions for GuestFlow Data Warehouse
Defines all dimension tables, fact tables, and bridge tables for the star schema.
"""

import logging
from config import config

logger = logging.getLogger(__name__)

# ============================================================================
# DIMENSION TABLES
# ============================================================================

DIMENSION_TABLES = {
    "DimTenant": {
        "ddl": f"""
        CREATE TABLE IF NOT EXISTS {config.CLICKHOUSE_DB}.DimTenant (
            TenantKey UInt64,
            Name String
        ) ENGINE = MergeTree()
        ORDER BY TenantKey
        """,
        "description": "Tenant dimension - stores tenant/company information"
    },
    
    "DimGuest": {
        "ddl": f"""
        CREATE TABLE IF NOT EXISTS {config.CLICKHOUSE_DB}.DimGuest (
            GuestKey UInt64,
            CID String,
            FullName String,
            Age UInt16,
            Profession String,
            City String,
            Country String,
            EffectiveDate Date,
            ExpiryDate Date,
            CurrentFlag UInt8
        ) ENGINE = MergeTree()
        ORDER BY (GuestKey, EffectiveDate)
        """,
        "description": "Guest dimension - Type 2 SCD for tracking guest changes over time"
    },
    
    "DimRoom": {
        "ddl": f"""
        CREATE TABLE IF NOT EXISTS {config.CLICKHOUSE_DB}.DimRoom (
            RoomKey UInt64,
            RoomNumber String,
            RoomType String,
            Price Decimal(12, 2),
            Status String,
            EffectiveDate Date,
            ExpiryDate Date,
            CurrentFlag UInt8
        ) ENGINE = MergeTree()
        ORDER BY (RoomKey, EffectiveDate)
        """,
        "description": "Room dimension - Type 2 SCD for tracking room changes over time"
    },
    
    "DimCompany": {
        "ddl": f"""
        CREATE TABLE IF NOT EXISTS {config.CLICKHOUSE_DB}.DimCompany (
            CompanyKey UInt64,
            Name String
        ) ENGINE = MergeTree()
        ORDER BY CompanyKey
        """,
        "description": "Company dimension - stores company information"
    },
    
    "DimService": {
        "ddl": f"""
        CREATE TABLE IF NOT EXISTS {config.CLICKHOUSE_DB}.DimService (
            ServiceKey UInt64,
            Name String,
            Description String
        ) ENGINE = MergeTree()
        ORDER BY ServiceKey
        """,
        "description": "Service dimension - stores available services"
    },
    
    "DimUser": {
        "ddl": f"""
        CREATE TABLE IF NOT EXISTS {config.CLICKHOUSE_DB}.DimUser (
            UserKey UInt64,
            FullName String,
            Role String
        ) ENGINE = MergeTree()
        ORDER BY UserKey
        """,
        "description": "User dimension - stores system users"
    },
    
    "DimVisitReason": {
        "ddl": f"""
        CREATE TABLE IF NOT EXISTS {config.CLICKHOUSE_DB}.DimVisitReason (
            VisitReasonKey UInt64,
            Name String
        ) ENGINE = MergeTree()
        ORDER BY VisitReasonKey
        """,
        "description": "Visit reason dimension - stores reasons for visits"
    },
    
    "DimTime": {
        "ddl": f"""
        CREATE TABLE IF NOT EXISTS {config.CLICKHOUSE_DB}.DimTime (
            DateKey Date,
            Day UInt8,
            Month String,
            Quarter UInt8,
            Year UInt16,
            IsWeekend UInt8,
            IsHoliday UInt8
        ) ENGINE = MergeTree()
        ORDER BY DateKey
        """,
        "description": "Time dimension - stores date attributes for temporal analysis"
    }
}

# ============================================================================
# FACT TABLES
# ============================================================================

FACT_TABLES = {
    "FactStay": {
        "ddl": f"""
        CREATE TABLE IF NOT EXISTS {config.CLICKHOUSE_DB}.FactStay (
            StayKey UInt64,
            FinalPrice Decimal(12, 2),
            Pax UInt16,
            Nights UInt16,
            RoomsCount UInt8,
            ServicesCount UInt16,
            TenantKey UInt64,
            GuestKey UInt64,
            CompanyKey UInt64,
            VisitReasonKey UInt64,
            ArrivalDateKey Date,
            DepartureDateKey Date,
            ReservationDateKey Date
        ) ENGINE = MergeTree()
        PARTITION BY toYYYYMM(ArrivalDateKey)
        ORDER BY (TenantKey, ArrivalDateKey, StayKey)
        """,
        "description": "Stay fact table - stores stay transaction details"
    },
    
    "FactServiceTicket": {
        "ddl": f"""
        CREATE TABLE IF NOT EXISTS {config.CLICKHOUSE_DB}.FactServiceTicket (
            ServiceTicketKey UInt64,
            ServicePrice Decimal(12, 2),
            Quantity UInt16,
            TenantKey UInt64,
            StayKey UInt64,
            ServiceKey UInt64,
            UserKey UInt64,
            CreatedDateKey Date
        ) ENGINE = MergeTree()
        PARTITION BY toYYYYMM(CreatedDateKey)
        ORDER BY (TenantKey, CreatedDateKey, ServiceTicketKey)
        """,
        "description": "Service ticket fact table - stores service transaction details"
    }
}

# ============================================================================
# BRIDGE TABLES
# ============================================================================

BRIDGE_TABLES = {
    "BridgeStayGuests": {
        "ddl": f"""
        CREATE TABLE IF NOT EXISTS {config.CLICKHOUSE_DB}.BridgeStayGuests (
            StayKey UInt64,
            GuestKey UInt64,
            Role String
        ) ENGINE = MergeTree()
        ORDER BY (StayKey, GuestKey)
        """,
        "description": "Bridge table for many-to-many relationship between stays and guests"
    },
    
    "BridgeStayRooms": {
        "ddl": f"""
        CREATE TABLE IF NOT EXISTS {config.CLICKHOUSE_DB}.BridgeStayRooms (
            StayKey UInt64,
            RoomKey UInt64,
            UsageType String
        ) ENGINE = MergeTree()
        ORDER BY (StayKey, RoomKey)
        """,
        "description": "Bridge table for many-to-many relationship between stays and rooms"
    }
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_all_star_schema_tables():
    """Returns all star schema tables (dimensions, facts, and bridges)"""
    all_tables = {}
    all_tables.update(DIMENSION_TABLES)
    all_tables.update(FACT_TABLES)
    all_tables.update(BRIDGE_TABLES)
    return all_tables

def get_dimension_tables():
    """Returns only dimension tables"""
    return DIMENSION_TABLES

def get_fact_tables():
    """Returns only fact tables"""
    return FACT_TABLES

def get_bridge_tables():
    """Returns only bridge tables"""
    return BRIDGE_TABLES

def get_table_ddl(table_name):
    """Get DDL for a specific table"""
    all_tables = get_all_star_schema_tables()
    if table_name in all_tables:
        return all_tables[table_name]['ddl']
    return None

def get_table_order():
    """
    Returns the order in which tables should be created/populated.
    Dimensions first, then facts, then bridges.
    """
    order = []
    
    # First: Time dimension (no dependencies)
    order.append("DimTime")
    
    # Then: Simple dimensions (no dependencies)
    order.extend([
        "DimTenant",
        "DimCompany",
        "DimService",
        "DimUser",
        "DimVisitReason"
    ])
    
    # Then: Complex dimensions (may reference simple dimensions)
    order.extend([
        "DimGuest",
        "DimRoom"
    ])
    
    # Then: Fact tables (reference dimensions)
    order.extend([
        "FactStay",
        "FactServiceTicket"
    ])
    
    # Finally: Bridge tables (reference facts and dimensions)
    order.extend([
        "BridgeStayGuests",
        "BridgeStayRooms"
    ])
    
    return order

# ============================================================================
# TABLE RELATIONSHIPS (for validation)
# ============================================================================

TABLE_RELATIONSHIPS = {
    "FactStay": {
        "dimensions": [
            ("TenantKey", "DimTenant", "TenantKey"),
            ("GuestKey", "DimGuest", "GuestKey"),
            ("CompanyKey", "DimCompany", "CompanyKey"),
            ("VisitReasonKey", "DimVisitReason", "VisitReasonKey"),
            ("ArrivalDateKey", "DimTime", "DateKey"),
            ("DepartureDateKey", "DimTime", "DateKey"),
            ("ReservationDateKey", "DimTime", "DateKey")
        ]
    },
    "FactServiceTicket": {
        "dimensions": [
            ("TenantKey", "DimTenant", "TenantKey"),
            ("StayKey", "FactStay", "StayKey"),
            ("ServiceKey", "DimService", "ServiceKey"),
            ("UserKey", "DimUser", "UserKey"),
            ("CreatedDateKey", "DimTime", "DateKey")
        ]
    },
    "BridgeStayGuests": {
        "dimensions": [
            ("StayKey", "FactStay", "StayKey"),
            ("GuestKey", "DimGuest", "GuestKey")
        ]
    },
    "BridgeStayRooms": {
        "dimensions": [
            ("StayKey", "FactStay", "StayKey"),
            ("RoomKey", "DimRoom", "RoomKey")
        ]
    }
}

def get_table_relationships(table_name):
    """Get relationships for a specific table"""
    return TABLE_RELATIONSHIPS.get(table_name, {})
