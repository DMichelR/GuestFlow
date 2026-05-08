#!/usr/bin/env python3
"""
Create Star Schema Script
Creates all dimension, fact, and bridge tables for the GuestFlow star schema.
Also populates the DimTime dimension table.
"""

import sys
import os
import logging
from datetime import datetime, timedelta

# Add parent directory to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import ClickHouseConnection
from config import config
from star_schema import (
    get_all_star_schema_tables,
    get_table_order,
    DIMENSION_TABLES,
    FACT_TABLES,
    BRIDGE_TABLES
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class StarSchemaCreator:
    def __init__(self):
        self.ch_conn = ClickHouseConnection()
        
    def connect(self):
        """Connect to ClickHouse"""
        try:
            self.ch_conn.connect()
            logger.info("Successfully connected to ClickHouse")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to ClickHouse: {e}")
            return False
    
    def table_exists(self, table_name):
        """Check if a table exists in ClickHouse"""
        try:
            query = f"""
            SELECT count() as cnt
            FROM system.tables
            WHERE database = '{config.CLICKHOUSE_DB}'
            AND name = '{table_name}'
            """
            result = self.ch_conn.execute_query(query)
            return result[0][0] > 0
        except Exception as e:
            logger.error(f"Error checking if table {table_name} exists: {e}")
            return False
    
    def create_table(self, table_name, ddl, description):
        """Create a table in ClickHouse"""
        try:
            if self.table_exists(table_name):
                logger.info(f"Table {table_name} already exists, skipping creation")
                return True
            
            logger.info(f"Creating table: {table_name}")
            logger.debug(f"Description: {description}")
            logger.debug(f"DDL: {ddl}")
            
            self.ch_conn.execute_query(ddl)
            logger.info(f"✓ Successfully created table: {table_name}")
            return True
        except Exception as e:
            logger.error(f"✗ Error creating table {table_name}: {e}")
            return False
    
    def create_all_tables(self):
        """Create all star schema tables in the correct order"""
        logger.info("=" * 70)
        logger.info("Starting Star Schema Creation")
        logger.info("=" * 70)
        
        all_tables = get_all_star_schema_tables()
        table_order = get_table_order()
        
        created_count = 0
        failed_count = 0
        skipped_count = 0
        
        for table_name in table_order:
            if table_name not in all_tables:
                logger.warning(f"Table {table_name} not found in schema definitions")
                continue
            
            table_def = all_tables[table_name]
            
            if self.table_exists(table_name):
                logger.info(f"⊙ Table {table_name} already exists")
                skipped_count += 1
                continue
            
            success = self.create_table(
                table_name,
                table_def['ddl'],
                table_def['description']
            )
            
            if success:
                created_count += 1
            else:
                failed_count += 1
        
        logger.info("=" * 70)
        logger.info("Star Schema Creation Summary")
        logger.info("=" * 70)
        logger.info(f"Tables created: {created_count}")
        logger.info(f"Tables skipped (already exist): {skipped_count}")
        logger.info(f"Tables failed: {failed_count}")
        logger.info(f"Total tables processed: {len(table_order)}")
        
        return failed_count == 0
    
    def populate_dim_time(self, start_year=2022, end_year=2030):
        """Populate the DimTime dimension table"""
        logger.info("=" * 70)
        logger.info("Populating DimTime Dimension")
        logger.info("=" * 70)
        
        try:
            # Check if table already has data
            count_query = f"SELECT count() FROM {config.CLICKHOUSE_DB}.DimTime"
            result = self.ch_conn.execute_query(count_query)
            existing_count = result[0][0]
            
            if existing_count > 0:
                logger.info(f"DimTime already has {existing_count} records, skipping population")
                return True
            
            # Generate date range
            start_date = datetime(start_year, 1, 1)
            end_date = datetime(end_year, 12, 31)
            
            dates = []
            current_date = start_date
            
            while current_date <= end_date:
                dates.append({
                    'DateKey': current_date.date(),
                    'Day': current_date.day,
                    'Month': current_date.strftime('%B'),
                    'Quarter': (current_date.month - 1) // 3 + 1,
                    'Year': current_date.year,
                    'IsWeekend': 1 if current_date.weekday() >= 5 else 0,
                    'IsHoliday': 0  # Not tracking holidays for now
                })
                current_date += timedelta(days=1)
            
            logger.info(f"Generated {len(dates)} date records from {start_year} to {end_year}")
            
            # Insert in batches
            batch_size = 1000
            total_batches = (len(dates) + batch_size - 1) // batch_size
            
            for i in range(0, len(dates), batch_size):
                batch = dates[i:i + batch_size]
                batch_num = i // batch_size + 1
                
                values = []
                for row in batch:
                    values.append(
                        f"('{row['DateKey']}', {row['Day']}, '{row['Month']}', "
                        f"{row['Quarter']}, {row['Year']}, {row['IsWeekend']}, {row['IsHoliday']})"
                    )
                
                insert_query = f"""
                INSERT INTO {config.CLICKHOUSE_DB}.DimTime 
                (DateKey, Day, Month, Quarter, Year, IsWeekend, IsHoliday)
                VALUES {', '.join(values)}
                """
                
                self.ch_conn.execute_query(insert_query)
                logger.info(f"Inserted batch {batch_num}/{total_batches} ({len(batch)} records)")
            
            # Verify insertion
            count_query = f"SELECT count() FROM {config.CLICKHOUSE_DB}.DimTime"
            result = self.ch_conn.execute_query(count_query)
            final_count = result[0][0]
            
            logger.info(f"✓ Successfully populated DimTime with {final_count} records")
            return True
            
        except Exception as e:
            logger.error(f"✗ Error populating DimTime: {e}")
            return False
    
    def verify_schema(self):
        """Verify that all tables were created successfully"""
        logger.info("=" * 70)
        logger.info("Verifying Star Schema")
        logger.info("=" * 70)
        
        all_tables = get_all_star_schema_tables()
        
        logger.info("\nDimension Tables:")
        for table_name in DIMENSION_TABLES.keys():
            exists = self.table_exists(table_name)
            status = "✓" if exists else "✗"
            logger.info(f"  {status} {table_name}")
        
        logger.info("\nFact Tables:")
        for table_name in FACT_TABLES.keys():
            exists = self.table_exists(table_name)
            status = "✓" if exists else "✗"
            logger.info(f"  {status} {table_name}")
        
        logger.info("\nBridge Tables:")
        for table_name in BRIDGE_TABLES.keys():
            exists = self.table_exists(table_name)
            status = "✓" if exists else "✗"
            logger.info(f"  {status} {table_name}")
        
        # Check if all tables exist
        all_exist = all(self.table_exists(name) for name in all_tables.keys())
        
        if all_exist:
            logger.info("\n✓ All star schema tables verified successfully")
        else:
            logger.warning("\n⚠ Some tables are missing")
        
        return all_exist


def main():
    """Main execution function"""
    logger.info("GuestFlow Star Schema Creation Tool")
    logger.info(f"ClickHouse Host: {config.CLICKHOUSE_HOST}")
    logger.info(f"ClickHouse Database: {config.CLICKHOUSE_DB}")
    logger.info("")
    
    creator = StarSchemaCreator()
    
    # Connect to ClickHouse
    if not creator.connect():
        logger.error("Cannot proceed without ClickHouse connection")
        sys.exit(1)
    
    # Create all tables
    success = creator.create_all_tables()
    
    if not success:
        logger.error("Some tables failed to create")
        sys.exit(1)
    
    # Populate DimTime
    if not creator.populate_dim_time(start_year=2022, end_year=2030):
        logger.warning("Failed to populate DimTime, but continuing...")
    
    # Verify schema
    creator.verify_schema()
    
    logger.info("\n" + "=" * 70)
    logger.info("Star Schema Creation Complete!")
    logger.info("=" * 70)
    logger.info("\nNext Steps:")
    logger.info("1. Run the ETL process to populate dimension tables")
    logger.info("2. Run the ETL process to populate fact tables")
    logger.info("3. Run validate_etl.py to verify data integrity")


if __name__ == "__main__":
    main()
