#!/usr/bin/env python3
"""
Check ClickHouse connectivity and setup script.
This script verifies that ClickHouse is ready and properly configured.
"""

import time
import sys
from clickhouse_driver import Client
import logging

# Setup basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ch_check")

def check_clickhouse(host="clickhouse", port=9000, user="default", password="clickhouse_password", database="default", max_retries=10):
    """Check ClickHouse connectivity and setup"""
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            logger.info(f"Attempt {retry_count + 1}/{max_retries} to connect to ClickHouse")
            
            # Try to connect
            client = Client(
                host=host,
                port=port,
                user=user,
                password=password,
                database=database
            )
            
            # Check basic functionality
            result = client.execute("SELECT 1")
            if result and result[0][0] == 1:
                logger.info("Successfully connected to ClickHouse")
                
                # Check that required system tables are available
                system_tables = client.execute("SHOW TABLES FROM system")
                if system_tables:
                    logger.info(f"Found {len(system_tables)} system tables")
                    
                    # Check database creation permission
                    try:
                        client.execute("CREATE DATABASE IF NOT EXISTS test_temp_db")
                        client.execute("DROP DATABASE IF EXISTS test_temp_db")
                        logger.info("Successfully verified database creation permissions")
                    except Exception as e:
                        logger.warning(f"Database creation permission check failed: {e}")
                        
                    # Check table creation permission
                    try:
                        client.execute("CREATE TABLE IF NOT EXISTS default.test_temp_table (id UInt32) ENGINE = MergeTree() ORDER BY id")
                        client.execute("DROP TABLE IF EXISTS default.test_temp_table")
                        logger.info("Successfully verified table creation permissions")
                    except Exception as e:
                        logger.warning(f"Table creation permission check failed: {e}")
                    
                    # All checks passed
                    return True
            
            # If we got here, something is still not fully ready
            logger.warning("ClickHouse is accessible but may not be fully initialized")
            
        except Exception as e:
            logger.warning(f"ClickHouse connection failed: {e}")
            
        # Wait before next attempt
        retry_count += 1
        if retry_count < max_retries:
            sleep_time = 2 ** min(retry_count, 5)  # Exponential backoff up to 32 seconds
            logger.info(f"Waiting {sleep_time} seconds before next attempt...")
            time.sleep(sleep_time)
    
    logger.error("Failed to verify ClickHouse setup after maximum retries")
    return False

if __name__ == "__main__":
    # Get connection parameters from command line arguments or use defaults
    import argparse
    parser = argparse.ArgumentParser(description='Check ClickHouse connectivity and setup')
    parser.add_argument('--host', default='clickhouse', help='ClickHouse host')
    parser.add_argument('--port', type=int, default=9000, help='ClickHouse port')
    parser.add_argument('--user', default='default', help='ClickHouse user')
    parser.add_argument('--password', default='clickhouse_password', help='ClickHouse password')
    parser.add_argument('--database', default='default', help='ClickHouse database')
    parser.add_argument('--retries', type=int, default=10, help='Maximum number of retries')
    
    args = parser.parse_args()
    
    if check_clickhouse(args.host, args.port, args.user, args.password, args.database, args.retries):
        logger.info("ClickHouse is ready!")
        sys.exit(0)
    else:
        logger.error("ClickHouse is not ready!")
        sys.exit(1)
