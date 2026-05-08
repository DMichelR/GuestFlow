"""
CDC (Change Data Capture) handler for streaming changes from PostgreSQL to ClickHouse
This module handles the real-time streaming of changes from PostgreSQL to ClickHouse
using logical replication and WAL decoding.
"""

import logging
import time
import json
import psycopg2
import psycopg2.extras
import pandas as pd
from config import config
from db import PostgresConnection, ClickHouseConnection
from transformer import DataTransformer

logger = logging.getLogger(__name__)

class CDCHandler:
    def __init__(self, pg_conn, ch_conn, transformer):
        self.pg_conn = pg_conn
        self.ch_conn = ch_conn
        self.transformer = transformer
        self.slot_name = "guestflow_cdc_slot"
        self.replication_connection = None
        
    def initialize(self):
        """Initialize CDC infrastructure"""
        # Check if replication slot exists, create if needed
        self._ensure_replication_slot()
        
        # Setup listener for change notifications
        self._setup_notification_listener()
        
        logger.info("CDC handler initialized")
    
    def _ensure_replication_slot(self):
        """Ensure that the logical replication slot exists and is healthy"""
        try:
            # Check if replication slot exists
            check_slot_query = """
            SELECT slot_name, slot_type, active FROM pg_replication_slots 
            WHERE slot_name = %s
            """
            result = self.pg_conn.execute_query(check_slot_query, (self.slot_name,))
            
            # If slot exists but might be in a bad state, drop it and recreate
            if result:
                is_active = result[0].get('active', False)
                logger.info(f"Found replication slot {self.slot_name}, active status: {is_active}")
                
                # Drop existing slot if it exists (to avoid issues with existing configuration)
                try:
                    drop_slot_query = """
                    SELECT pg_drop_replication_slot(%s)
                    """
                    self.pg_conn.execute_query(drop_slot_query, (self.slot_name,))
                    logger.info(f"Dropped existing replication slot: {self.slot_name}")
                except Exception as drop_err:
                    # If dropping fails, the slot might be in use
                    logger.warning(f"Could not drop replication slot: {drop_err}")
                    # Continue - we'll try to use the existing slot
            
            # Create or recreate the replication slot
            try:
                create_slot_query = """
                SELECT pg_create_logical_replication_slot(%s, 'test_decoding')
                """
                self.pg_conn.execute_query(create_slot_query, (self.slot_name,))
                logger.info(f"Created replication slot: {self.slot_name}")
            except psycopg2.errors.DuplicateObject:
                # Slot already exists, this is fine
                logger.info(f"Using existing replication slot: {self.slot_name}")
            except Exception as create_err:
                logger.error(f"Error creating replication slot: {create_err}")
                raise
                
        except Exception as e:
            logger.error(f"Error setting up replication slot: {e}")
            raise
    
    def _setup_notification_listener(self):
        """Setup listener for PostgreSQL notifications"""
        try:
            # Create a separate connection for notifications
            conn_string = config.postgres_connection_string
            self.replication_connection = psycopg2.connect(conn_string)
            self.replication_connection.set_isolation_level(
                psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT
            )
            
            # Setup listener for guestflow_changes channel
            cursor = self.replication_connection.cursor()
            cursor.execute("LISTEN guestflow_changes;")
            logger.info("Notification listener setup complete")
        except Exception as e:
            logger.error(f"Error setting up notification listener: {e}")
            raise
    
    def process_changes(self):
        """Process changes from PostgreSQL to ClickHouse"""
        try:
            # Get pending changes
            if not self.replication_connection:
                self._setup_notification_listener()
                
            changes = self._get_changes()
            if not changes:
                return True
            
            # Process each change
            for change in changes:
                table_name = change.get('table')
                operation = change.get('operation')
                record_id = change.get('record_id')
                
                if table_name and operation and record_id:
                    self._process_change(table_name, operation, record_id)
                
            # Acknowledge changes have been processed
            if changes:
                self._acknowledge_changes(changes[-1].get('lsn', 0))
            
            return True
        except Exception as e:
            logger.error(f"Error processing changes: {e}")
            return False
            
    def get_all_changes(self):
        """
        Obtiene todos los cambios pendientes pero no los procesa directamente.
        Devuelve un diccionario con los cambios organizados por tabla y operación.
        
        Returns:
            dict: {
                'table_name': {
                    'INSERT': [lista_de_registros],
                    'UPDATE': [lista_de_registros],
                    'DELETE': [lista_de_registros]
                }
            }
        """
        try:
            # Get pending changes
            if not self.replication_connection:
                self._setup_notification_listener()
                
            changes = self._get_changes()
            if not changes:
                return {}
            
            # Organizar los cambios por tabla y operación
            organized_changes = {}
            
            for change in changes:
                table_name = change.get('table')
                operation = change.get('operation')
                data = change.get('data', {})
                
                # Inicializar estructura si es necesario
                if table_name not in organized_changes:
                    organized_changes[table_name] = {
                        'INSERT': [],
                        'UPDATE': [],
                        'DELETE': []
                    }
                
                # Agregar datos a la estructura
                if operation in ['INSERT', 'UPDATE', 'DELETE']:
                    organized_changes[table_name][operation].append(data)
            
            return organized_changes
            
        except Exception as e:
            logger.error(f"Error obteniendo cambios: {e}")
            return {}
    
    def commit_processed_changes(self):
        """
        Confirma que los cambios han sido procesados y avanza el slot de replicación
        """
        try:
            # Get the latest LSN
            query = "SELECT pg_current_wal_lsn() as lsn"
            result = self.pg_conn.execute_query(query)
            lsn = result[0][0] if result else None
            
            if lsn:
                self._acknowledge_changes(lsn)
                logger.info(f"Avanzado slot de replicación hasta LSN {lsn}")
                return True
            else:
                logger.warning("No se pudo obtener LSN actual")
                return False
        except Exception as e:
            logger.error(f"Error confirmando cambios procesados: {e}")
            return False
    
    def _process_change(self, table_name, operation, record_id):
        """Process a single change event"""
        try:
            # Handle PascalCase table names by properly quoting
            quoted_table_name = f'"{table_name}"'
            
            # Get the corresponding ClickHouse table name from PG_TO_CH_TABLE_MAPPING
            from etl import PG_TO_CH_TABLE_MAPPING
            ch_table_name = PG_TO_CH_TABLE_MAPPING.get(table_name)
            
            if not ch_table_name:
                logger.warning(f"No mapping found for table {table_name}, skipping CDC change")
                return
            
            logger.info(f"CDC: Processing {operation} on {table_name} -> {ch_table_name}, ID: {record_id}")
            
            # For INSERT and UPDATE, get the current record and transform it
            if operation in ('INSERT', 'UPDATE'):
                # Query the record with proper column quoting for PascalCase
                query = f'SELECT * FROM {quoted_table_name} WHERE "Id" = %s'
                result = self.pg_conn.execute_query(query, (record_id,))
                
                if result:
                    # Convert result to DataFrame
                    df = pd.DataFrame(result)
                    
                    # Get the ETL instance to use its transformation methods
                    # This is a bit hacky but necessary to reuse the existing transformations
                    from etl import ETL
                    etl_instance = ETL.__new__(ETL)
                    etl_instance.pg_conn = self.pg_conn
                    etl_instance.ch_conn = self.ch_conn
                    
                    # Apply the appropriate transformation based on the target table
                    if ch_table_name == "DimTenant":
                        transformed_df = etl_instance.transform_data_for_dim_tenant(df)
                    elif ch_table_name == "DimGuest":
                        transformed_df = etl_instance.transform_data_for_dim_guest(df)
                    elif ch_table_name == "DimRoom":
                        transformed_df = etl_instance.transform_data_for_dim_room(df)
                    elif ch_table_name == "FactStay":
                        transformed_df = etl_instance.transform_data_for_fact_stay(df)
                    elif ch_table_name == "FactServiceTicket":
                        transformed_df = etl_instance.transform_data_for_fact_service_ticket(df)
                    else:
                        # For other tables, use simple transformation
                        logger.warning(f"No specific transformation for {ch_table_name}, using generic approach")
                        transformed_df = df
                    
                    # For UPDATE, delete the old record first
                    if operation == 'UPDATE':
                        # Convert UUID to UInt64 for key lookup
                        from etl import uuid_to_uint64
                        key_value = uuid_to_uint64(record_id)
                        
                        # Determine the key column name based on table
                        key_column = self._get_key_column_for_table(ch_table_name)
                        delete_query = f"ALTER TABLE {self.ch_conn.database}.{ch_table_name} DELETE WHERE {key_column} = {key_value}"
                        self.ch_conn.execute_query(delete_query)
                        logger.info(f"Deleted old record for UPDATE: {ch_table_name}.{key_column} = {key_value}")
                    
                    # Insert the new/updated record
                    self._insert_into_clickhouse(ch_table_name, transformed_df)
                    logger.info(f"CDC: Successfully processed {operation} on {ch_table_name}")
                else:
                    logger.warning(f"No record found for {table_name} with ID {record_id} during {operation}")
            
            # For DELETE, remove the record from ClickHouse
            elif operation == 'DELETE':
                from etl import uuid_to_uint64
                key_value = uuid_to_uint64(record_id)
                key_column = self._get_key_column_for_table(ch_table_name)
                
                delete_query = f"ALTER TABLE {self.ch_conn.database}.{ch_table_name} DELETE WHERE {key_column} = {key_value}"
                self.ch_conn.execute_query(delete_query)
                logger.info(f"CDC: Successfully processed DELETE on {ch_table_name}.{key_column} = {key_value}")
                
        except Exception as e:
            logger.error(f"Error processing change for {table_name} (ID: {record_id}): {e}", exc_info=True)
    
    def _get_key_column_for_table(self, ch_table_name):
        """Get the primary key column name for a ClickHouse table"""
        key_mapping = {
            'DimTenant': 'TenantKey',
            'DimGuest': 'GuestKey',
            'DimRoom': 'RoomKey',
            'DimCompany': 'CompanyKey',
            'DimService': 'ServiceKey',
            'DimVisitReason': 'VisitReasonKey',
            'DimUser': 'UserKey',
            'FactStay': 'StayKey',
            'FactServiceTicket': 'ServiceTicketKey'
        }
        return key_mapping.get(ch_table_name, 'Id')
    
    def _insert_into_clickhouse(self, table_name, df):
        """Insert data into ClickHouse table"""
        if df.empty:
            return
            
        # Convert DataFrame to list of tuples for ClickHouse insert
        data = [tuple(row) for row in df.to_records(index=False)]
        
        # Insert data into ClickHouse
        column_names = ', '.join([f"`{col}`" for col in df.columns])
        query = f"INSERT INTO {config.CLICKHOUSE_DB}.{table_name} ({column_names}) VALUES"
        
        try:
            self.ch_conn.client.execute(query, data)
            logger.debug(f"Inserted {len(data)} rows into {table_name}")
        except Exception as e:
            logger.error(f"Error inserting into ClickHouse table {table_name}: {e}")
    
    def _delete_from_clickhouse(self, table_name, record_id):
        """Delete a record from ClickHouse table"""
        query = f"ALTER TABLE {config.CLICKHOUSE_DB}.{table_name} DELETE WHERE id = '{record_id}'"
        
        try:
            self.ch_conn.execute_query(query)
            logger.debug(f"Deleted record {record_id} from {table_name}")
        except Exception as e:
            logger.error(f"Error deleting from ClickHouse table {table_name}: {e}")
    
    def _get_changes(self):
        """
        Get pending changes from notification listeners.
        Returns a list of change dictionaries with table, operation, and record_id.
        
        Note: This method checks for changes via PostgreSQL NOTIFY/LISTEN mechanism,
        not from the replication slot directly. The actual WAL processing happens
        in _process_replication_slot_changes().
        """
        try:
            # Check if we have any notifications pending
            # This is a placeholder implementation - in practice, notifications
            # are received asynchronously via the LISTEN mechanism setup in __init__
            
            # For now, we'll return an empty list since the actual change detection
            # happens in _process_replication_slot_changes() which is called separately
            # by the monitor_changes() loop
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting changes from notification system: {e}")
            return []
    
    def _acknowledge_changes(self, lsn=None):
        """
        Acknowledge that changes have been processed.
        
        Note: This method is a placeholder. The actual acknowledgment of processed
        changes happens in _process_replication_slot_changes() when we consume
        the changes from the replication slot using pg_logical_slot_get_changes().
        """
        try:
            # The acknowledgment is implicit when we use pg_logical_slot_get_changes()
            # in _process_replication_slot_changes(), which automatically advances the slot
            logger.debug(f"Changes acknowledged (implicit via slot consumption)")
        except Exception as e:
            logger.error(f"Error acknowledging changes: {e}")
    
    def monitor_changes(self):
        """
        Public method to monitor and process changes from the replication slot.
        This is the main entry point for CDC monitoring loops.
        """
        try:
            self._process_replication_slot_changes()
        except Exception as e:
            logger.error(f"Error monitoring changes: {e}")
    
    def _process_replication_slot_changes(self):
        """Process changes directly from replication slot"""
        try:
            # Get and consume changes from replication slot
            # Note: pg_logical_slot_get_changes automatically advances the slot
            query = """
            SELECT * FROM pg_logical_slot_get_changes(%s, NULL, NULL)
            """
            changes = self.pg_conn.execute_query(query, (self.slot_name,))
            
            if changes:
                change_count = len(changes)
                logger.info(f"Processing {change_count} changes from replication slot")
                
                # Process each change
                for change in changes:
                    try:
                        # Parse the WAL message
                        lsn = change.get('lsn')
                        data = change.get('data')
                        
                        # Skip BEGIN and COMMIT messages from test_decoding
                        if data.startswith('BEGIN') or data.startswith('COMMIT'):
                            continue
                        
                        # Only process data changes (INSERT, UPDATE, DELETE)
                        # test_decoding format uses ": INSERT:", ": UPDATE:", ": DELETE:"
                        if any(op in data for op in (': INSERT:', ': UPDATE:', ': DELETE:')):
                            table_name = self._extract_table_name(data)
                            operation = self._extract_operation(data)
                            record_id = self._extract_record_id(data)
                            
                            if table_name and operation and record_id:
                                logger.info(f"CDC: Detected {operation} on {table_name}, ID: {record_id}")
                                self._process_change(table_name, operation, record_id)
                            else:
                                logger.warning(f"Could not extract complete info from WAL: table={table_name}, op={operation}, id={record_id}")
                    except Exception as e:
                        logger.error(f"Error processing WAL message: {e}", exc_info=True)
                
                # Note: The replication slot was already advanced when we called
                # pg_logical_slot_get_changes() at the beginning of this method
                logger.info(f"Processed and acknowledged {change_count} changes")
        except Exception as e:
            logger.error(f"Error processing replication slot changes: {e}")
    
    def _extract_table_name(self, wal_data):
        """Extract table name from WAL data (test_decoding format)"""
        try:
            # test_decoding format: table public."TableName": INSERT: ...
            if "table " in wal_data and ("INSERT:" in wal_data or "UPDATE:" in wal_data or "DELETE:" in wal_data):
                # Extract table name between "table " and ":"
                table_part = wal_data.split("table ")[1].split(":")[0].strip()
                # Remove schema name if present (public.)
                table_name = table_part.split(".")[-1].strip()
                return self._clean_table_name(table_name)
                
        except Exception as e:
            logger.error(f"Error extracting table name from WAL data: {e}")
        return None
        
    def _clean_table_name(self, table_name):
        """Clean up a table name by removing quotes and handling special characters"""
        # Remove quotes if they exist
        table_name = table_name.strip('"')
        
        # Handle PostgreSQL's special quoting for reserved keywords
        if table_name.startswith('"') and table_name.endswith('"'):
            table_name = table_name[1:-1]
            
        # Handle public schema qualification
        if table_name.startswith('public.'):
            table_name = table_name[7:]
            
        logger.debug(f"Cleaned table name: {table_name}")
        return table_name
    
    def _extract_operation(self, wal_data):
        """Extract operation type from WAL data (test_decoding format)"""
        # test_decoding format uses: INSERT:, UPDATE:, DELETE:
        if ": INSERT:" in wal_data:
            return "INSERT"
        elif ": UPDATE:" in wal_data:
            return "UPDATE"
        elif ": DELETE:" in wal_data:
            return "DELETE"
        return None
    
    def _extract_record_id(self, wal_data):
        """Extract record ID from WAL data (test_decoding format)"""
        try:
            # test_decoding format: "Id"[uuid]:'uuid-value'
            if '"Id"[uuid]:\'' in wal_data:
                id_part = wal_data.split('"Id"[uuid]:\'')[1].split('\'')[0]
                return id_part
            # Also try lowercase id for compatibility
            elif '"id"[uuid]:\'' in wal_data:
                id_part = wal_data.split('"id"[uuid]:\'')[1].split('\'')[0]
                return id_part
        except Exception as e:
            logger.error(f"Error extracting record ID from WAL data: {e}")
        return None
    
    def close(self):
        """Close connections"""
        if self.replication_connection:
            self.replication_connection.close()
            logger.info("CDC replication connection closed")
