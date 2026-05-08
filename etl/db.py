import logging
import psycopg2
from psycopg2.extras import DictCursor
from clickhouse_driver import Client
from sqlalchemy import create_engine, text
import pandas as pd
from config import config

logger = logging.getLogger(__name__)

class PostgresConnection:
    def __init__(self):
        self.conn_string = config.postgres_connection_string
        self.engine = create_engine(self.conn_string)
        self.connection = None
        
    def connect(self):
        try:
            self.connection = psycopg2.connect(
                host=config.POSTGRES_HOST,
                port=config.POSTGRES_PORT,
                dbname=config.POSTGRES_DB,
                user=config.POSTGRES_USER,
                password=config.POSTGRES_PASSWORD
            )
            logger.info("Successfully connected to PostgreSQL")
            return self.connection
        except Exception as e:
            logger.error(f"Error connecting to PostgreSQL: {e}")
            raise
    
    def close(self):
        if self.connection:
            self.connection.close()
            logger.info("PostgreSQL connection closed")
    
    def execute_query(self, query, params=None):
        """Execute a query and return the results as a list of dictionaries"""
        with self.connection.cursor(cursor_factory=DictCursor) as cursor:
            cursor.execute(query, params or {})
            columns = [desc[0] for desc in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    def execute_query_df(self, query, params=None):
        """Execute a query and return the results as a pandas DataFrame"""
        with self.connection.cursor(cursor_factory=DictCursor) as cursor:
            cursor.execute(query, params or {})
            columns = [desc[0] for desc in cursor.description]
            data = cursor.fetchall()
            return pd.DataFrame(data, columns=columns)
    
    def get_table_schema(self, table_name):
        """Get the schema of a table"""
        query = """
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = %s
        ORDER BY ordinal_position;
        """
        return self.execute_query(query, (table_name,))
    
    def get_all_tables(self):
        """Get all tables in the database"""
        query = """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
        """
        result = self.execute_query(query)
        return [row["table_name"] for row in result]
    
    def get_proper_table_name(self, table_name):
        """
        Finds the proper case-sensitive name of a table in PostgreSQL.
        This helps with tables using PascalCase naming convention from .NET
        """
        # First check if the exact name exists
        query = """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name = %s;
        """
        result = self.execute_query(query, (table_name,))
        if result:
            return result[0]["table_name"]
            
        # If not found, try case-insensitive search
        query = """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND lower(table_name) = lower(%s);
        """
        result = self.execute_query(query, (table_name,))
        if result:
            return result[0]["table_name"]
            
        # If still not found, try with/without 's' at the end (singular/plural)
        if table_name.endswith('s'):
            # Try singular form
            singular = table_name[:-1]
            query = """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            AND lower(table_name) = lower(%s);
            """
            result = self.execute_query(query, (singular,))
            if result:
                return result[0]["table_name"]
        else:
            # Try plural form
            plural = f"{table_name}s"
            query = """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            AND lower(table_name) = lower(%s);
            """
            result = self.execute_query(query, (plural,))
            if result:
                return result[0]["table_name"]
        
        # Not found in any form
        return None

class ClickHouseConnection:
    def __init__(self):
        self.config = config.clickhouse_connection_dict
        self.client = None
        
    def connect(self):
        try:
            self.client = Client(**self.config)
            logger.info("Successfully connected to ClickHouse")
            return self.client
        except Exception as e:
            logger.error(f"Error connecting to ClickHouse: {e}")
            raise
    
    def close(self):
        # ClickHouse client doesn't need explicit closing
        pass
    
    def execute_query(self, query, params=None):
        """Execute a query in ClickHouse"""
        try:
            result = self.client.execute(query, params or {})
            return result
        except Exception as e:
            logger.error(f"Error executing ClickHouse query: {e}")
            raise
    
    def execute_with_column_types(self, query, params=None):
        """Execute a query and return results with column types"""
        try:
            result, columns = self.client.execute(
                query, params or {}, with_column_types=True
            )
            return result, columns
        except Exception as e:
            logger.error(f"Error executing ClickHouse query: {e}")
            raise
    
    def check_table_exists(self, table_name):
        """Check if a table exists in ClickHouse"""
        query = f"SELECT 1 FROM system.tables WHERE database = '{config.CLICKHOUSE_DB}' AND name = '{table_name}'"
        result = self.client.execute(query)
        return len(result) > 0
