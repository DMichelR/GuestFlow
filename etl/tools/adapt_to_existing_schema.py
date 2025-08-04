#!/usr/bin/env python3
"""
Script para adaptar el ETL para usar el esquema existente en ClickHouse.
Este script mapea las tablas del esquema existente en ClickHouse (definido en init.sql)
a las operaciones ETL para asegurar compatibilidad.
"""

import sys
import logging
import time
from pathlib import Path
import os

# Add parent directory to path to import modules
sys.path.append(str(Path(__file__).parent.parent))

from db import ClickHouseConnection
from config import config

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Definir mapeo entre tablas de PostgreSQL y tablas dimensionales de ClickHouse
PG_TO_CH_TABLE_MAPPING = {
    # Tablas dimensionales
    "Tenants": "DimTenant",
    "Guests": "DimGuest",
    "Rooms": "DimRoom",
    "Companies": "DimCompany",
    "Services": "DimService",
    "VisitReasons": "DimVisitReason",
    "Users": "DimUser",
    
    # Tablas de hechos
    "Stays": "FactStay",
    "ServiceTickets": "FactServiceTicket",
    
    # Tablas de puente
    "GroupGuests": "BridgeStayGuests",
    "GroupRooms": "BridgeStayRooms"
}

def check_existing_schema():
    """
    Verifica que el esquema existente en ClickHouse tenga las tablas necesarias
    """
    logger.info("Verificando esquema existente en ClickHouse...")
    
    # Inicializar conexión a ClickHouse
    ch_conn = ClickHouseConnection()
    ch_conn.connect()
    
    # Obtener tablas existentes
    tables_query = f"SHOW TABLES FROM {config.CLICKHOUSE_DB}"
    existing_tables = ch_conn.execute_query(tables_query)
    existing_table_names = [row[0] for row in existing_tables]
    
    # Verificar tablas necesarias
    required_tables = set(PG_TO_CH_TABLE_MAPPING.values())
    missing_tables = required_tables - set(existing_table_names)
    
    if missing_tables:
        logger.warning(f"Las siguientes tablas no existen en el esquema de ClickHouse: {', '.join(missing_tables)}")
        logger.warning("El ETL podría no funcionar correctamente sin estas tablas.")
    else:
        logger.info("Todas las tablas necesarias existen en el esquema de ClickHouse.")
    
    # Guardar el mapeo en una variable de entorno para que el ETL la use
    os.environ["PG_TO_CH_TABLE_MAPPING"] = ",".join([f"{pg_table}:{ch_table}" for pg_table, ch_table in PG_TO_CH_TABLE_MAPPING.items()])
    os.environ["USE_EXISTING_SCHEMA"] = "True"
    
    logger.info("ETL configurado para usar el esquema existente.")
    return len(missing_tables) == 0

if __name__ == "__main__":
    if check_existing_schema():
        logger.info("La verificación del esquema existente fue exitosa.")
    else:
        logger.warning("La verificación del esquema existente encontró problemas.")
        logger.warning("El ETL intentará continuar, pero podría haber errores.")
