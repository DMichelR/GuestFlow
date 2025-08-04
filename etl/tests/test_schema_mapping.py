"""
Tests for schema mapper functionality.
Ensures that our schema mapping correctly handles casing conversion between PostgreSQL and ClickHouse.
"""
import sys
import os
import unittest

# Add parent directory to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from schema_mapper import get_clickhouse_type, get_table_schema, TABLE_SCHEMAS


class TestSchemaMapper(unittest.TestCase):
    def test_pg_to_ch_type_conversion(self):
        """Test PostgreSQL to ClickHouse type conversion"""
        self.assertEqual(get_clickhouse_type("integer"), "Int32")
        self.assertEqual(get_clickhouse_type("varchar"), "String")
        self.assertEqual(get_clickhouse_type("character varying", 50), "FixedString(50)")
        self.assertEqual(get_clickhouse_type("character varying", 500), "String")
        self.assertEqual(get_clickhouse_type("boolean"), "UInt8")
        self.assertEqual(get_clickhouse_type("timestamp without time zone"), "DateTime")
        self.assertEqual(get_clickhouse_type("uuid"), "UUID")
        self.assertEqual(get_clickhouse_type("unknown_type"), "String")  # Default fallback

    def test_table_schema_lookup(self):
        """Test lookup of table schemas with different casings"""
        # Test exact match
        schema = get_table_schema("tenant")
        self.assertEqual(schema["engine"], "MergeTree() ORDER BY (Id)")
        self.assertEqual(schema["primary_key"], "Id")
        
        # Test case insensitive match - PascalCase
        schema = get_table_schema("Tenant")
        self.assertEqual(schema["engine"], "MergeTree() ORDER BY (Id)")
        self.assertEqual(schema["primary_key"], "Id")
        
        # Test pluralized name
        schema = get_table_schema("tenants")
        self.assertEqual(schema["engine"], "MergeTree() ORDER BY (Id)")
        self.assertEqual(schema["primary_key"], "Id")
        
        # Test pluralized PascalCase
        schema = get_table_schema("Tenants")
        self.assertEqual(schema["engine"], "MergeTree() ORDER BY (Id)")
        self.assertEqual(schema["primary_key"], "Id")
        
        # Test missing schema defaults
        schema = get_table_schema("non_existent_table")
        self.assertEqual(schema["engine"], "MergeTree() ORDER BY (Id)")
        self.assertEqual(schema["primary_key"], "Id")
        self.assertEqual(schema["columns"], {})
        
    def test_stay_schema(self):
        """Test stay table schema which uses toYYYYMM for partitioning"""
        schema = get_table_schema("stay")
        self.assertEqual(schema["engine"], "MergeTree() ORDER BY (Id, ArrivalDate, TenantId)")
        self.assertEqual(schema["partition_by"], "toYYYYMM(ArrivalDate)")
        self.assertTrue("stay_duration_days" in schema["columns"])
        self.assertTrue("revenue_per_day" in schema["columns"])
        
if __name__ == "__main__":
    unittest.main()
