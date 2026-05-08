#!/usr/bin/env python3
"""
ETL Validation Script
Validates data integrity and referential integrity between PostgreSQL source
and ClickHouse star schema tables.
"""

import sys
import os
import logging
from datetime import datetime

# Add parent directory to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import PostgresConnection, ClickHouseConnection
from config import config
from star_schema import get_table_relationships, get_all_star_schema_tables

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ETLValidator:
    def __init__(self):
        self.pg_conn = PostgresConnection()
        self.ch_conn = ClickHouseConnection()
        self.errors = []
        self.warnings = []
        
    def connect(self):
        """Connect to both databases"""
        try:
            self.pg_conn.connect()
            logger.info("✓ Connected to PostgreSQL")
            
            self.ch_conn.connect()
            logger.info("✓ Connected to ClickHouse")
            
            return True
        except Exception as e:
            logger.error(f"Connection error: {e}")
            return False
    
    def validate_table_exists(self, table_name):
        """Validate that a table exists in ClickHouse"""
        try:
            query = f"""
            SELECT count() as cnt
            FROM system.tables
            WHERE database = '{config.CLICKHOUSE_DB}'
            AND name = '{table_name}'
            """
            result = self.ch_conn.execute_query(query)
            exists = result[0][0] > 0
            
            if not exists:
                self.errors.append(f"Table {table_name} does not exist in ClickHouse")
                return False
            
            return True
        except Exception as e:
            self.errors.append(f"Error checking table {table_name}: {e}")
            return False
    
    def get_table_count(self, table_name):
        """Get row count for a ClickHouse table"""
        try:
            query = f"SELECT count() FROM {config.CLICKHOUSE_DB}.{table_name}"
            result = self.ch_conn.execute_query(query)
            return result[0][0]
        except Exception as e:
            logger.error(f"Error getting count for {table_name}: {e}")
            return 0
    
    def validate_referential_integrity(self, fact_table, fk_column, dim_table, pk_column):
        """
        Validate referential integrity between fact and dimension tables.
        Checks if all foreign keys in fact table exist in dimension table.
        """
        try:
            # Query to find orphaned records
            query = f"""
            SELECT count() as orphaned_count
            FROM {config.CLICKHOUSE_DB}.{fact_table} f
            LEFT JOIN {config.CLICKHOUSE_DB}.{dim_table} d
            ON f.{fk_column} = d.{pk_column}
            WHERE d.{pk_column} IS NULL
            AND f.{fk_column} != 0
            """
            
            result = self.ch_conn.execute_query(query)
            orphaned_count = result[0][0]
            
            if orphaned_count > 0:
                error_msg = (
                    f"Referential integrity violation: {fact_table}.{fk_column} -> "
                    f"{dim_table}.{pk_column}: {orphaned_count} orphaned records"
                )
                self.errors.append(error_msg)
                logger.error(f"✗ {error_msg}")
                return False
            else:
                logger.info(
                    f"✓ {fact_table}.{fk_column} -> {dim_table}.{pk_column}: OK"
                )
                return True
                
        except Exception as e:
            error_msg = (
                f"Error validating {fact_table}.{fk_column} -> "
                f"{dim_table}.{pk_column}: {e}"
            )
            self.errors.append(error_msg)
            logger.error(f"✗ {error_msg}")
            return False
    
    def validate_table_relationships(self, table_name):
        """Validate all relationships for a given table"""
        logger.info(f"\nValidating relationships for {table_name}:")
        logger.info("-" * 60)
        
        relationships = get_table_relationships(table_name)
        
        if not relationships:
            logger.info(f"  No relationships defined for {table_name}")
            return True
        
        dimensions = relationships.get('dimensions', [])
        
        if not dimensions:
            logger.info(f"  No dimension relationships for {table_name}")
            return True
        
        all_valid = True
        
        for fk_column, ref_table, ref_column in dimensions:
            valid = self.validate_referential_integrity(
                table_name, fk_column, ref_table, ref_column
            )
            if not valid:
                all_valid = False
        
        return all_valid
    
    def validate_no_duplicates(self, table_name, key_column):
        """Validate that there are no duplicate keys in a table"""
        try:
            query = f"""
            SELECT {key_column}, count() as cnt
            FROM {config.CLICKHOUSE_DB}.{table_name}
            GROUP BY {key_column}
            HAVING cnt > 1
            """
            
            result = self.ch_conn.execute_query(query)
            
            if result:
                duplicate_count = len(result)
                error_msg = (
                    f"Duplicate keys found in {table_name}.{key_column}: "
                    f"{duplicate_count} duplicates"
                )
                self.errors.append(error_msg)
                logger.error(f"✗ {error_msg}")
                return False
            else:
                logger.info(f"✓ No duplicates in {table_name}.{key_column}")
                return True
                
        except Exception as e:
            error_msg = f"Error checking duplicates in {table_name}.{key_column}: {e}"
            self.errors.append(error_msg)
            logger.error(f"✗ {error_msg}")
            return False
    
    def validate_date_ranges(self, table_name, date_column):
        """Validate that dates are within reasonable ranges"""
        try:
            query = f"""
            SELECT
                min({date_column}) as min_date,
                max({date_column}) as max_date
            FROM {config.CLICKHOUSE_DB}.{table_name}
            WHERE {date_column} IS NOT NULL
            """
            
            result = self.ch_conn.execute_query(query)
            
            if not result or not result[0]:
                self.warnings.append(
                    f"No date data found in {table_name}.{date_column}"
                )
                return True
            
            min_date = result[0][0]
            max_date = result[0][1]
            
            # Check if dates are reasonable (between 2020 and 2035)
            min_reasonable = datetime(2020, 1, 1).date()
            max_reasonable = datetime(2035, 12, 31).date()
            
            if min_date < min_reasonable or max_date > max_reasonable:
                warning_msg = (
                    f"Date range in {table_name}.{date_column} may be incorrect: "
                    f"{min_date} to {max_date}"
                )
                self.warnings.append(warning_msg)
                logger.warning(f"⚠ {warning_msg}")
            else:
                logger.info(
                    f"✓ Date range in {table_name}.{date_column}: "
                    f"{min_date} to {max_date}"
                )
            
            return True
            
        except Exception as e:
            logger.warning(f"Could not validate date range for {table_name}.{date_column}: {e}")
            return True
    
    def validate_dimension_tables(self):
        """Validate dimension tables"""
        logger.info("\n" + "=" * 70)
        logger.info("VALIDATING DIMENSION TABLES")
        logger.info("=" * 70)
        
        dimension_validations = [
            ("DimTenant", "TenantKey"),
            ("DimGuest", "GuestKey"),
            ("DimRoom", "RoomKey"),
            ("DimCompany", "CompanyKey"),
            ("DimService", "ServiceKey"),
            ("DimUser", "UserKey"),
            ("DimVisitReason", "VisitReasonKey"),
            ("DimTime", "DateKey")
        ]
        
        all_valid = True
        
        for table_name, key_column in dimension_validations:
            logger.info(f"\nValidating {table_name}:")
            logger.info("-" * 60)
            
            # Check if table exists
            if not self.validate_table_exists(table_name):
                all_valid = False
                continue
            
            # Get row count
            count = self.get_table_count(table_name)
            logger.info(f"  Row count: {count}")
            
            if count == 0:
                self.warnings.append(f"{table_name} is empty")
                logger.warning(f"⚠ {table_name} is empty")
            
            # Check for duplicates (except for Type 2 SCDs)
            if table_name not in ["DimGuest", "DimRoom"]:
                self.validate_no_duplicates(table_name, key_column)
        
        return all_valid
    
    def validate_fact_tables(self):
        """Validate fact tables and their relationships"""
        logger.info("\n" + "=" * 70)
        logger.info("VALIDATING FACT TABLES")
        logger.info("=" * 70)
        
        fact_tables = ["FactStay", "FactServiceTicket"]
        
        all_valid = True
        
        for table_name in fact_tables:
            logger.info(f"\nValidating {table_name}:")
            logger.info("-" * 60)
            
            # Check if table exists
            if not self.validate_table_exists(table_name):
                all_valid = False
                continue
            
            # Get row count
            count = self.get_table_count(table_name)
            logger.info(f"  Row count: {count}")
            
            if count == 0:
                self.warnings.append(f"{table_name} is empty")
                logger.warning(f"⚠ {table_name} is empty")
                continue
            
            # Validate relationships
            if not self.validate_table_relationships(table_name):
                all_valid = False
            
            # Validate date ranges
            if table_name == "FactStay":
                self.validate_date_ranges(table_name, "ArrivalDateKey")
                self.validate_date_ranges(table_name, "DepartureDateKey")
            elif table_name == "FactServiceTicket":
                self.validate_date_ranges(table_name, "CreatedDateKey")
        
        return all_valid
    
    def validate_bridge_tables(self):
        """Validate bridge tables"""
        logger.info("\n" + "=" * 70)
        logger.info("VALIDATING BRIDGE TABLES")
        logger.info("=" * 70)
        
        bridge_tables = ["BridgeStayGuests", "BridgeStayRooms"]
        
        all_valid = True
        
        for table_name in bridge_tables:
            logger.info(f"\nValidating {table_name}:")
            logger.info("-" * 60)
            
            # Check if table exists
            if not self.validate_table_exists(table_name):
                all_valid = False
                continue
            
            # Get row count
            count = self.get_table_count(table_name)
            logger.info(f"  Row count: {count}")
            
            if count == 0:
                self.warnings.append(f"{table_name} is empty")
                logger.warning(f"⚠ {table_name} is empty")
                continue
            
            # Validate relationships
            if not self.validate_table_relationships(table_name):
                all_valid = False
        
        return all_valid
    
    def print_summary(self):
        """Print validation summary"""
        logger.info("\n" + "=" * 70)
        logger.info("VALIDATION SUMMARY")
        logger.info("=" * 70)
        
        if self.errors:
            logger.error(f"\n❌ Found {len(self.errors)} error(s):")
            for i, error in enumerate(self.errors, 1):
                logger.error(f"  {i}. {error}")
        
        if self.warnings:
            logger.warning(f"\n⚠️  Found {len(self.warnings)} warning(s):")
            for i, warning in enumerate(self.warnings, 1):
                logger.warning(f"  {i}. {warning}")
        
        if not self.errors and not self.warnings:
            logger.info("\n✅ All validations passed successfully!")
            return True
        elif not self.errors:
            logger.info("\n✅ All validations passed (with warnings)")
            return True
        else:
            logger.error("\n❌ Validation failed with errors")
            return False


def main():
    """Main execution function"""
    logger.info("GuestFlow ETL Validation Tool")
    logger.info(f"PostgreSQL: {config.POSTGRES_HOST}/{config.POSTGRES_DB}")
    logger.info(f"ClickHouse: {config.CLICKHOUSE_HOST}/{config.CLICKHOUSE_DB}")
    logger.info("")
    
    validator = ETLValidator()
    
    # Connect to databases
    if not validator.connect():
        logger.error("Cannot proceed without database connections")
        sys.exit(1)
    
    # Run validations
    dim_valid = validator.validate_dimension_tables()
    fact_valid = validator.validate_fact_tables()
    bridge_valid = validator.validate_bridge_tables()
    
    # Print summary
    success = validator.print_summary()
    
    # Exit with appropriate code
    if success:
        logger.info("\n✅ ETL validation completed successfully")
        sys.exit(0)
    else:
        logger.error("\n❌ ETL validation failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
