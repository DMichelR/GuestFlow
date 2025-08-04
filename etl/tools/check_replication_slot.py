#!/usr/bin/env python3
"""
Checks and repairs PostgreSQL replication slots if needed.
Use this script to ensure the replication slots are in a good state before running the ETL.
"""

import os
import sys
import logging
import psycopg2
import argparse
from pathlib import Path

# Add parent directory to path to import modules
sys.path.append(str(Path(__file__).parent.parent))

# Set up logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Check and repair PostgreSQL replication slots')
    parser.add_argument('--host', default=os.environ.get('POSTGRES_HOST', 'postgres-primary'),
                        help='PostgreSQL host')
    parser.add_argument('--port', type=int, default=int(os.environ.get('POSTGRES_PORT', 5432)),
                        help='PostgreSQL port')
    parser.add_argument('--dbname', default=os.environ.get('POSTGRES_DB', 'guestflow'),
                        help='PostgreSQL database name')
    parser.add_argument('--user', default=os.environ.get('POSTGRES_USER', 'postgres'),
                        help='PostgreSQL user')
    parser.add_argument('--password', default=os.environ.get('POSTGRES_PASSWORD', 'postgres_password'),
                        help='PostgreSQL password')
    parser.add_argument('--slot-name', default='guestflow_cdc_slot',
                        help='Name of the replication slot to check')
    return parser.parse_args()

def get_pg_connection(args):
    """Create a connection to PostgreSQL"""
    conn_params = {
        'host': args.host,
        'port': args.port,
        'dbname': args.dbname,
        'user': args.user,
        'password': args.password
    }
    logger.info(f"Connecting to PostgreSQL at {args.host}:{args.port}/{args.dbname}")
    return psycopg2.connect(**conn_params)

def check_replication_slot(conn, slot_name):
    """Check if a replication slot exists and its status"""
    logger.info(f"Checking replication slot: {slot_name}")
    
    with conn.cursor() as cur:
        # Check if slot exists
        cur.execute("""
        SELECT slot_name, slot_type, active, restart_lsn 
        FROM pg_replication_slots 
        WHERE slot_name = %s
        """, (slot_name,))
        
        result = cur.fetchone()
        
        if not result:
            logger.info(f"Replication slot {slot_name} does not exist")
            return False, None
        
        slot_active = result[2]
        restart_lsn = result[3]
        
        logger.info(f"Replication slot {slot_name} exists:")
        logger.info(f"- Type: {result[1]}")
        logger.info(f"- Active: {slot_active}")
        logger.info(f"- Restart LSN: {restart_lsn}")
        
        return True, slot_active

def drop_replication_slot(conn, slot_name):
    """Drop a replication slot"""
    logger.info(f"Attempting to drop replication slot: {slot_name}")
    
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT pg_drop_replication_slot(%s)", (slot_name,))
            conn.commit()
            logger.info(f"Successfully dropped replication slot: {slot_name}")
            return True
    except psycopg2.Error as e:
        conn.rollback()
        logger.error(f"Error dropping replication slot: {e}")
        return False

def create_replication_slot(conn, slot_name):
    """Create a logical replication slot"""
    logger.info(f"Creating logical replication slot: {slot_name}")
    
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT pg_create_logical_replication_slot(%s, 'pgoutput')",
                (slot_name,)
            )
            conn.commit()
            logger.info(f"Successfully created replication slot: {slot_name}")
            return True
    except psycopg2.Error as e:
        conn.rollback()
        logger.error(f"Error creating replication slot: {e}")
        return False

def repair_slot_if_needed(conn, slot_name):
    """Check and repair a replication slot if needed"""
    exists, is_active = check_replication_slot(conn, slot_name)
    
    if exists:
        if is_active:
            logger.info(f"Replication slot {slot_name} is active and healthy")
            return True
        else:
            # Slot exists but is inactive, try to drop and recreate it
            logger.warning(f"Replication slot {slot_name} exists but is inactive")
            if drop_replication_slot(conn, slot_name):
                return create_replication_slot(conn, slot_name)
            else:
                return False
    else:
        # Slot doesn't exist, create it
        return create_replication_slot(conn, slot_name)

def main():
    """Main function"""
    args = parse_args()
    
    try:
        conn = get_pg_connection(args)
        success = repair_slot_if_needed(conn, args.slot_name)
        
        if success:
            logger.info("Replication slot check/repair completed successfully")
            sys.exit(0)
        else:
            logger.error("Failed to check/repair replication slot")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(2)
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    main()
