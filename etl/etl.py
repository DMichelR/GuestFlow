import logging
import time
import pandas as pd
import os
from db import PostgresConnection, ClickHouseConnection
from transformer import DataTransformer
from schema_mapper import get_clickhouse_type, get_table_schema
from materialized_views import get_all_materialized_views
from config import config

logger = logging.getLogger(__name__)

# Verificar si debemos usar el esquema existente en ClickHouse
USE_EXISTING_SCHEMA = os.environ.get('USE_EXISTING_SCHEMA', 'False').lower() in ('true', '1', 't')

# Mapeo de tablas de PostgreSQL a tablas del esquema existente en ClickHouse
PG_TO_CH_TABLE_MAPPING = {}
if USE_EXISTING_SCHEMA:
    table_mapping_str = os.environ.get('PG_TO_CH_TABLE_MAPPING', '')
    if table_mapping_str:
        for mapping in table_mapping_str.split(','):
            pg_table, ch_table = mapping.split(':')
            PG_TO_CH_TABLE_MAPPING[pg_table] = ch_table
        logger.info(f"Usando mapeo de tablas existente: {PG_TO_CH_TABLE_MAPPING}")
    else:
        logger.warning("USE_EXISTING_SCHEMA está activado pero no se encontró PG_TO_CH_TABLE_MAPPING")

class ETL:
    def __init__(self):
        self.pg_conn = PostgresConnection()
        self.ch_conn = ClickHouseConnection()
        self.transformer = DataTransformer()
        self.replication_state = {}
        
    def initialize(self):
        """Initialize connections and perform setup"""
        self.pg_conn.connect()
        self.ch_conn.connect()
        logger.info("ETL service initialized")
    
    def create_clickhouse_table(self, table_name, pg_schema):
        """
        Create ClickHouse table based on PostgreSQL schema
        Adaptado para manejar las convenciones de nombres de .NET (PascalCase)
        """
        try:
            # Check if table already exists
            try:
                check_query = f"SELECT 1 FROM {config.CLICKHOUSE_DB}.{table_name} LIMIT 1"
                result = self.ch_conn.execute_query(check_query)
                logger.info(f"Table {table_name} already exists in ClickHouse")
                # Table exists, no need to create it again
                return True
            except Exception:
                # Table doesn't exist, we'll create it
                logger.debug(f"Table {table_name} will be created")
                
            # Primero intentamos obtener el esquema para este nombre de tabla específico
            # Y luego probamos con la versión normalizada (minúsculas)
            logger.debug(f"Obteniendo esquema para tabla: {table_name}")
            ch_schema = get_table_schema(table_name)
            
            columns = []
            
            # Obtener el primary key desde el esquema
            primary_key = ch_schema['primary_key']
            logger.debug(f"Primary key para {table_name}: {primary_key}")
            
            # Aquí almacenamos una referencia de qué columnas reales corresponden a 
            # las columnas en la definición del esquema
            column_mapping = {}
        except Exception as e:
            logger.error(f"Error in initialization phase of table creation for {table_name}: {e}")
            raise
        
        # Map PostgreSQL columns to ClickHouse columns
        for col in pg_schema:
            col_name = col['column_name']
            pg_type = col['data_type']
            length = col['character_maximum_length']
            
            logger.debug(f"Mapeando columna PostgreSQL: {col_name} ({pg_type})")
            
            # Use explicit mapping if defined, otherwise infer from PostgreSQL type
            if col_name.lower() in [k.lower() for k in ch_schema['columns'].keys()]:
                # Encontrar la key exacta con case-insensitive search
                matching_key = next(k for k in ch_schema['columns'].keys() if k.lower() == col_name.lower())
                ch_type = ch_schema['columns'][matching_key]
                logger.debug(f"Columna {col_name} mapeada a definición explícita: {matching_key} ({ch_type})")
            else:
                ch_type = get_clickhouse_type(pg_type, length)
                logger.debug(f"Columna {col_name} mapeada por inferencia de tipo: {ch_type}")
            
            # Guardamos el nombre real de la columna para usarlo en el ORDER BY y PRIMARY KEY
            if col_name.lower() == primary_key.lower():
                column_mapping[primary_key.lower()] = col_name
                logger.debug(f"Primary key {primary_key} mapeado a columna real {col_name}")
                
            columns.append(f"`{col_name}` {ch_type}")
        
        # Add custom columns defined in schema but not in PostgreSQL
        for col_name, ch_type in ch_schema['columns'].items():
            if col_name.lower() not in [col['column_name'].lower() for col in pg_schema]:
                columns.append(f"`{col_name}` {ch_type}")
                logger.debug(f"Añadiendo columna personalizada: {col_name} ({ch_type})")
        
        # Create the table
        columns_str = ",\n    ".join(columns)
        
        # Asegurar que la cláusula ORDER BY use el nombre correcto de la columna
        # respetando el caso (mayúscula/minúscula)
        # Verificamos si el primary key se encuentra en nuestro mapeo
        real_primary_key = column_mapping.get(primary_key.lower(), primary_key)
        
        # Construir ENGINE con el nombre de columna correcto
        engine_original = ch_schema['engine']
        
        # Reemplazar ORDER BY cláusula con el nombre de columna real
        # Maneja tanto ORDER BY (id) como ORDER BY (id, other_col)
        if "ORDER BY" in engine_original:
            order_by_parts = []
            order_by_clause = engine_original.split("ORDER BY")[1].strip()
            
            # Extraer columnas dentro de los paréntesis
            if order_by_clause.startswith("(") and ")" in order_by_clause:
                columns_str_original = order_by_clause.split("(")[1].split(")")[0]
                order_by_columns = [col.strip() for col in columns_str_original.split(",")]
                
                # Reemplazar cada columna con su nombre real
                for col in order_by_columns:
                    real_col = column_mapping.get(col.lower(), col)
                    order_by_parts.append(real_col)
                
                # Construir nueva cláusula ORDER BY
                new_order_by = f"ORDER BY ({', '.join(order_by_parts)})"
                engine = engine_original.split("ORDER BY")[0] + new_order_by
            else:
                # Caso simple sin paréntesis
                engine = engine_original
        else:
            engine = engine_original
            
        logger.debug(f"Engine para {table_name}: {engine}")
        
        # Obtener PARTITION BY si existe y reemplazar nombres de columnas si es necesario
        partition_by_original = ch_schema['partition_by']
        if partition_by_original:
            # Buscar nombres de columnas en la cláusula y reemplazarlos
            partition_by_parts = partition_by_original.split("(")
            if len(partition_by_parts) > 1:
                func_name = partition_by_parts[0]
                col_name = partition_by_parts[1].split(")")[0]
                if col_name.lower() in column_mapping:
                    real_col = column_mapping[col_name.lower()]
                    partition_by = f"PARTITION BY {func_name}({real_col})"
                else:
                    partition_by = f"PARTITION BY {partition_by_original}"
            else:
                # No hay función, solo nombre de columna
                col_name = partition_by_original
                if col_name.lower() in column_mapping:
                    real_col = column_mapping[col_name.lower()]
                    partition_by = f"PARTITION BY {real_col}"
                else:
                    partition_by = f"PARTITION BY {partition_by_original}"
        else:
            partition_by = ""
            
        if partition_by:
            logger.debug(f"Partition by para {table_name}: {partition_by}")
        
        create_query = f"""
        CREATE TABLE IF NOT EXISTS {config.CLICKHOUSE_DB}.{table_name} (
            {columns_str}
        ) ENGINE = {engine}
        {partition_by}
        """
        
        logger.debug(f"Query para crear tabla {table_name}:\n{create_query}")
        
        # Safety check for empty column list
        if not columns:
            logger.error(f"Cannot create table {table_name}: column list is empty")
            return False
            
        try:
            logger.info(f"Creating ClickHouse table: {table_name}")
            self.ch_conn.execute_query(create_query)
            
            # Verify table was created
            check_query = f"SELECT 1 FROM {config.CLICKHOUSE_DB}.{table_name} WHERE 1=0"
            self.ch_conn.execute_query(check_query)
            logger.info(f"Table {table_name} created successfully")
            return True
        except Exception as e:
            logger.error(f"Error creating table {table_name}: {e}")
            return False
    
    def sync_table(self, table_name):
        """
        Synchronize data from PostgreSQL to ClickHouse for a specific table
        """
        logger.info(f"Syncing table: {table_name}")
        
        try:
            # Find the proper case-sensitive name of the table in PostgreSQL
            proper_pg_table_name = self.pg_conn.get_proper_table_name(table_name)
            
            if proper_pg_table_name is None:
                logger.warning(f"Table {table_name} not found in PostgreSQL in any form")
                return False
                
            logger.info(f"Found actual PostgreSQL table name: {proper_pg_table_name}")
            
            # Get PostgreSQL schema
            pg_schema = self.pg_conn.get_table_schema(proper_pg_table_name)
            if not pg_schema:
                logger.warning(f"Table schema for {proper_pg_table_name} not found in PostgreSQL")
                return False
            
            # Store the ClickHouse table name - in most cases will be the same as PostgreSQL
            # but we keep the option to map differently if needed
            ch_table_name = table_name
            
            # Si estamos usando el esquema existente, mapeamos la tabla de PostgreSQL a la tabla de ClickHouse
            if USE_EXISTING_SCHEMA and table_name in PG_TO_CH_TABLE_MAPPING:
                ch_table_name = PG_TO_CH_TABLE_MAPPING[table_name]
                logger.info(f"Usando tabla de ClickHouse mapeada: {ch_table_name} para {table_name}")
            
            # Create or update ClickHouse table
            table_created = self.create_clickhouse_table(ch_table_name, pg_schema)
            if not table_created:
                logger.error(f"Failed to create ClickHouse table for {ch_table_name}")
                return False
            
            # Get data from PostgreSQL - use properly quoted table name to handle special characters,
            # capitalization, and schema-qualified names
            query = f'SELECT * FROM "{proper_pg_table_name}"'
            
            # If the table name contains a dot, it might be schema-qualified
            if '.' in proper_pg_table_name:
                schema, tab = proper_pg_table_name.split('.')
                query = f'SELECT * FROM "{schema}"."{tab}"'
                
            logger.info(f"Executing query: {query}")
            pg_data = self.pg_conn.execute_query(query)
            logger.info(f"Retrieved {len(pg_data)} rows from PostgreSQL table {proper_pg_table_name}")
            
            # Transform data
            transformed_data = self.transformer.transform_data(pg_data, table_name)
            
            # Load data to ClickHouse
            if not transformed_data.empty:
                self.load_to_clickhouse(ch_table_name, transformed_data)
                logger.info(f"Successfully loaded {len(transformed_data)} rows to ClickHouse table {ch_table_name}")
            else:
                logger.info(f"No data to load for table {ch_table_name}")
            
            return True
        except Exception as e:
            logger.error(f"Error syncing table {table_name}: {e}")
            return False
    
    def load_to_clickhouse(self, table_name, df):
        """
        Load pandas DataFrame to ClickHouse table
        """
        # Convert DataFrame to list of tuples for ClickHouse insert
        data = [tuple(row) for row in df.to_records(index=False)]
        
        # Insert data into ClickHouse
        column_names = ', '.join([f"`{col}`" for col in df.columns])
        query = f"INSERT INTO {config.CLICKHOUSE_DB}.{table_name} ({column_names}) VALUES"
        
        try:
            self.ch_conn.client.execute(query, data)
        except Exception as e:
            logger.error(f"Error loading data to ClickHouse table {table_name}: {e}")
            raise
    
    def setup_cdc(self):
        """
        Setup CDC (Change Data Capture) handler
        """
        try:
            from cdc_handler import CDCHandler
            self.cdc_handler = CDCHandler(self.pg_conn, self.ch_conn, self.transformer)
            self.cdc_handler.initialize()
            logger.info("CDC handler initialized")
            return True
        except Exception as e:
            logger.error(f"Error setting up CDC handler: {e}")
            return False
    
    def process_cdc_changes(self):
        """
        Process changes from PostgreSQL CDC using the enhanced CDC handler
        """
        try:
            if hasattr(self, 'cdc_handler'):
                if USE_EXISTING_SCHEMA:
                    # Para esquema estrella, necesitamos un procesamiento especial
                    result = self.process_cdc_changes_for_star_schema()
                else:
                    # Procesamiento normal para CDC
                    result = self.cdc_handler.process_changes()
                return result
            else:
                logger.error("CDC handler not initialized")
                return False
        except Exception as e:
            logger.error(f"Error processing CDC changes: {e}")
            return False
            
    def process_cdc_changes_for_star_schema(self):
        """
        Procesa los cambios CDC específicamente para el esquema estrella
        """
        try:
            # Obtener los cambios de todas las tablas monitoreadas
            changes = self.cdc_handler.get_all_changes()
            
            if not changes:
                # No hay cambios para procesar
                return True
                
            # Procesar los cambios para cada tabla
            for table_name, table_changes in changes.items():
                if not table_changes:
                    continue
                    
                logger.info(f"Procesando {len(table_changes)} cambios CDC para tabla {table_name}")
                
                # Si la tabla está en nuestro mapeo, procesamos los cambios para el esquema estrella
                if table_name in PG_TO_CH_TABLE_MAPPING:
                    ch_table = PG_TO_CH_TABLE_MAPPING[table_name]
                    
                    # Para cada operación (INSERT, UPDATE, DELETE)
                    for operation, records in table_changes.items():
                        if not records:
                            continue
                            
                        logger.info(f"Procesando {len(records)} operaciones {operation} para {table_name} -> {ch_table}")
                        
                        # Convertir los registros a un DataFrame
                        df = pd.DataFrame(records)
                        
                        # Para DELETE, necesitamos manejar la eliminación en el esquema estrella
                        if operation == 'DELETE':
                            self.handle_delete_in_star_schema(table_name, ch_table, df)
                        else:  # INSERT o UPDATE
                            # Aplicamos las transformaciones según la tabla destino
                            self.apply_star_schema_transformation(table_name, ch_table, df)
                else:
                    logger.warning(f"La tabla {table_name} no está en el mapeo para el esquema estrella, ignorando cambios")
            
            # Confirmar que procesamos todos los cambios
            self.cdc_handler.commit_processed_changes()
            return True
            
        except Exception as e:
            logger.error(f"Error procesando cambios CDC para esquema estrella: {e}")
            return False
            
    def handle_delete_in_star_schema(self, pg_table, ch_table, df):
        """
        Maneja las operaciones DELETE para el esquema estrella
        """
        try:
            # Para eliminar registros en dimensiones, necesitamos convertir los IDs a keys
            if not df.empty and 'Id' in df.columns:
                # Convertir GUIDs a UInt64 para las keys
                keys = df['Id'].apply(lambda x: int(x.hex[:16], 16)).tolist()
                
                if ch_table == 'DimTenant':
                    key_column = 'TenantKey'
                elif ch_table == 'DimGuest':
                    key_column = 'GuestKey'
                elif ch_table == 'DimRoom':
                    key_column = 'RoomKey'
                elif ch_table == 'DimCompany':
                    key_column = 'CompanyKey'
                elif ch_table == 'DimService':
                    key_column = 'ServiceKey'
                elif ch_table == 'DimVisitReason':
                    key_column = 'VisitReasonKey'
                elif ch_table == 'DimUser':
                    key_column = 'UserKey'
                elif ch_table == 'FactStay':
                    key_column = 'StayKey'
                elif ch_table == 'FactServiceTicket':
                    key_column = 'ServiceTicketKey'
                else:
                    logger.warning(f"No se ha definido columna key para {ch_table}, no se puede procesar DELETE")
                    return
                
                # Para tablas dimensionales con SCD Tipo 2, marcamos como expirados
                if ch_table.startswith('Dim') and any(col == 'CurrentFlag' for col in self.get_clickhouse_columns(ch_table)):
                    # Actualizar registros en lugar de eliminarlos (marcar como expirados)
                    today = pd.Timestamp.now().date()
                    update_query = f"""
                    ALTER TABLE {config.CLICKHOUSE_DB}.{ch_table} 
                    UPDATE CurrentFlag = 0, ExpiryDate = '{today}' 
                    WHERE {key_column} IN ({','.join(map(str, keys))}) AND CurrentFlag = 1
                    """
                    self.ch_conn.execute_query(update_query)
                    logger.info(f"Marcados como expirados {len(keys)} registros en {ch_table}")
                else:
                    # Para tablas de hechos, eliminamos directamente
                    delete_query = f"""
                    ALTER TABLE {config.CLICKHOUSE_DB}.{ch_table} 
                    DELETE WHERE {key_column} IN ({','.join(map(str, keys))})
                    """
                    self.ch_conn.execute_query(delete_query)
                    logger.info(f"Eliminados {len(keys)} registros de {ch_table}")
            else:
                logger.warning(f"DataFrame vacío o sin columna Id para DELETE en {ch_table}")
        except Exception as e:
            logger.error(f"Error manejando DELETE para {ch_table}: {e}")
            raise
    
    def apply_star_schema_transformation(self, pg_table, ch_table, df):
        """
        Aplica la transformación adecuada según la tabla destino para operaciones INSERT/UPDATE
        """
        try:
            # Para SCD Tipo 2, manejamos las actualizaciones de manera especial
            is_update = 'Updated' in df.columns and not all(df['Created'] == df['Updated'])
            
            # Antes de aplicar las transformaciones, obtenemos datos relacionados si es necesario
            if ch_table == "DimGuest" and is_update:
                # Si es una actualización, marcamos el registro actual como expirado antes de insertar el nuevo
                guest_keys = df['Id'].apply(lambda x: int(x.hex[:16], 16)).tolist()
                today = pd.Timestamp.now().date()
                
                # Actualizar registros antiguos
                update_query = f"""
                ALTER TABLE {config.CLICKHOUSE_DB}.DimGuest 
                UPDATE CurrentFlag = 0, ExpiryDate = '{today}' 
                WHERE GuestKey IN ({','.join(map(str, guest_keys))}) AND CurrentFlag = 1
                """
                self.ch_conn.execute_query(update_query)
                logger.info(f"Marcados como expirados {len(guest_keys)} registros en DimGuest para actualización")
            
            # Lo mismo para habitaciones
            if ch_table == "DimRoom" and is_update:
                room_keys = df['Id'].apply(lambda x: int(x.hex[:16], 16)).tolist()
                today = pd.Timestamp.now().date()
                
                update_query = f"""
                ALTER TABLE {config.CLICKHOUSE_DB}.DimRoom 
                UPDATE CurrentFlag = 0, ExpiryDate = '{today}' 
                WHERE RoomKey IN ({','.join(map(str, room_keys))}) AND CurrentFlag = 1
                """
                self.ch_conn.execute_query(update_query)
                logger.info(f"Marcados como expirados {len(room_keys)} registros en DimRoom para actualización")
            
            # Aplicar transformación según la tabla
            if ch_table == "DimTenant":
                self.transform_data_for_dim_tenant(df)
            elif ch_table == "DimGuest":
                self.transform_data_for_dim_guest(df)
            elif ch_table == "DimRoom":
                self.transform_data_for_dim_room(df)
            elif ch_table == "FactStay":
                self.transform_data_for_fact_stay(df)
            elif ch_table == "FactServiceTicket":
                self.transform_data_for_fact_service_ticket(df)
            elif ch_table == "DimCompany":
                transformed_df = pd.DataFrame()
                transformed_df['CompanyKey'] = df['Id'].apply(lambda x: int(x.hex[:16], 16))
                transformed_df['Name'] = df['Name']
                self._insert_transformed_data(transformed_df, 'DimCompany')
            elif ch_table == "DimService":
                transformed_df = pd.DataFrame()
                transformed_df['ServiceKey'] = df['Id'].apply(lambda x: int(x.hex[:16], 16))
                transformed_df['Name'] = df['Name']
                transformed_df['Description'] = df['Description'].fillna('')
                self._insert_transformed_data(transformed_df, 'DimService')
            elif ch_table == "DimVisitReason":
                transformed_df = pd.DataFrame()
                transformed_df['VisitReasonKey'] = df['Id'].apply(lambda x: int(x.hex[:16], 16))
                transformed_df['Name'] = df['Name']
                self._insert_transformed_data(transformed_df, 'DimVisitReason')
            elif ch_table == "DimUser":
                transformed_df = pd.DataFrame()
                transformed_df['UserKey'] = df['Id'].apply(lambda x: int(x.hex[:16], 16))
                transformed_df['FullName'] = df['Name'] + ' ' + df['LastName']
                transformed_df['Role'] = df['Role'].astype(str)
                self._insert_transformed_data(transformed_df, 'DimUser')
            else:
                logger.warning(f"No hay transformación específica para {ch_table}, ignorando cambios")
        
        except Exception as e:
            logger.error(f"Error aplicando transformación para {ch_table}: {e}")
            raise
    
    def get_clickhouse_columns(self, table_name):
        """Obtiene las columnas de una tabla en ClickHouse"""
        try:
            query = f"DESCRIBE TABLE {config.CLICKHOUSE_DB}.{table_name}"
            result = self.ch_conn.execute_query(query)
            return [row[0] for row in result]
        except Exception as e:
            logger.error(f"Error obteniendo columnas de {table_name}: {e}")
            return []
    
    def perform_initial_load(self):
        """
        Perform initial load of all tables in the correct order to respect dependencies
        """
        if USE_EXISTING_SCHEMA:
            logger.info("USE_EXISTING_SCHEMA=True: Utilizando el esquema existente en ClickHouse")
            logger.info("Los datos se cargarán directamente en las tablas del esquema existente")
            self.load_data_to_existing_schema()
            return
            
        logger.info("Starting initial data load")
        
        # Define the correct order for loading to respect dependencies
        # First dimensional tables, then fact tables - using PascalCase and plural forms as in PostgreSQL
        load_order = [
            # Main dimensions
            "Tenants", "Countries", "Cities", "RoomTypes", "VisitReasons", 
            "Professions", "Companies", "Services", "Users",
            
            # Main entities
            "Rooms", "Guests",
            
            # Fact tables and relationships
            "Stays", "ServiceTickets", "GroupGuests", "GroupRooms"
        ]
        
        # Get all tables from PostgreSQL
        all_tables = set(self.pg_conn.get_all_tables())
        logger.info(f"Found PostgreSQL tables: {all_tables}")
        
        # Filter out system tables
        filtered_tables = {
            t for t in all_tables 
            if not (t.startswith('pg_') or t.startswith('information_schema') or t.startswith('__'))
        }
        logger.info(f"Filtered PostgreSQL tables: {filtered_tables}")
        
        # Check if there are tables in load_order that don't exist in the database
        missing_tables = [t for t in load_order if t not in filtered_tables]
        if missing_tables:
            # Try case-insensitive matching
            filtered_tables_lower = {t.lower(): t for t in filtered_tables}
            adjusted_load_order = []
            
            for t in load_order:
                if t in filtered_tables:
                    adjusted_load_order.append(t)
                elif t.lower() in filtered_tables_lower:
                    adjusted_load_order.append(filtered_tables_lower[t.lower()])
                else:
                    logger.warning(f"Table not found in any form: {t}")
            
            load_order = adjusted_load_order
            logger.info(f"Adjusted load order after case matching: {load_order}")
            
            # Re-check missing tables
            missing_tables = [t for t in load_order if t not in filtered_tables]
            if missing_tables:
                logger.warning(f"Some defined tables don't exist in PostgreSQL: {missing_tables}")
        
        # Check if there are tables in the database that aren't in load_order
        extra_tables = filtered_tables - set(load_order)
        if extra_tables:
            logger.warning(f"Tables in PostgreSQL not included in load order: {extra_tables}")
            # Add them at the end
            load_order.extend(list(extra_tables))
        
        # Load tables in the specified order
        loaded_tables = []
        for table_name in load_order:
            if table_name in filtered_tables:
                try:
                    logger.info(f"Loading table: {table_name}")
                    self.sync_table(table_name)
                    loaded_tables.append(table_name)
                except Exception as e:
                    logger.error(f"Error loading table {table_name}: {e}")
        
        # Check if key tables were loaded successfully
        key_table_mapping = {
            "tenant": ["tenant", "Tenant", "tenants", "Tenants"],
            "room": ["room", "Room", "rooms", "Rooms"],
            "room_type": ["room_type", "RoomType", "room_types", "RoomTypes"],
            "stay": ["stay", "Stay", "stays", "Stays"]
        }
        
        # Check if any variant of each key table exists in loaded_tables
        missing_key_tables = []
        for key, variants in key_table_mapping.items():
            if not any(variant in loaded_tables for variant in variants):
                missing_key_tables.append(key)
        
        if not missing_key_tables:
            # Create materialized views after loading tables
            logger.info("All key tables loaded successfully, creating materialized views...")
            success = self.create_materialized_views()
            if success:
                logger.info("Materialized views created successfully")
            else:
                logger.warning("Some materialized views could not be created")
        else:
            logger.error(f"Cannot create materialized views. Key tables missing: {missing_key_tables}")
        
        logger.info("Initial data load completed")
        
    def create_materialized_views(self):
        """
        Crear vistas materializadas para facilitar el análisis
        """
        logger.info("Creating materialized views for analytics")
        
        # Map standard ClickHouse table names to possible variations in the database
        table_variations = {
            "tenant": ["tenant", "Tenant", "tenants", "Tenants"],
            "room": ["room", "Room", "rooms", "Rooms"],
            "room_type": ["room_type", "RoomType", "room_types", "RoomTypes", "roomtype", "roomtypes"],
            "stay": ["stay", "Stay", "stays", "Stays"],
            "guest": ["guest", "Guest", "guests", "Guests"],
            "group_rooms": ["group_rooms", "GroupRooms", "grouprooms", "GroupRooms"],
            "group_guests": ["group_guests", "GroupGuests", "groupguests", "GroupGuests"],
            "service": ["service", "Service", "services", "Services"],
            "service_ticket": ["service_ticket", "ServiceTicket", "service_tickets", "ServiceTickets", "serviceticket", "servicetickets"],
            "visit_reason": ["visit_reason", "VisitReason", "visit_reasons", "VisitReasons", "visitreason", "visitreasons"],
            "company": ["company", "Company", "companies", "Companies"]
        }
        
        # Get all tables from ClickHouse
        ch_tables_query = f"SHOW TABLES FROM {config.CLICKHOUSE_DB}"
        ch_tables_result = self.ch_conn.execute_query(ch_tables_query)
        ch_tables = [row[0] for row in ch_tables_result]
        logger.info(f"Found ClickHouse tables: {ch_tables}")
        
        # Map standard names to actual table names in database
        table_mapping = {}
        missing_tables = []
        
        for std_name, variations in table_variations.items():
            found = False
            for var in variations:
                if var in ch_tables:
                    table_mapping[std_name] = var
                    found = True
                    break
            
            if not found:
                missing_tables.append(std_name)
                logger.warning(f"No variation of table {std_name} found in ClickHouse")
        
        if missing_tables:
            logger.warning(f"The following tables are missing and may cause view creation to fail: {', '.join(missing_tables)}")
        
        # If too many tables are missing, delay view creation
        if len(missing_tables) > len(table_variations) / 2:
            logger.error("Too many required tables are missing. Delaying materialized view creation.")
            return False
            
        logger.info(f"Table mapping for views: {table_mapping}")            # Create materialized views with modified names to match actual table names
        materialized_views = get_all_materialized_views()
        for view_name, view_def in materialized_views.items():
            try:
                logger.info(f"Creating materialized view: {view_name}")
                # Use the query with the original table names
                query = view_def['query']
                
                # Replace all references to standard table names with their actual mapped names
                for std_name, actual_name in table_mapping.items():
                    # Replace FROM clauses
                    query = query.replace(f"FROM {std_name}", f"FROM {config.CLICKHOUSE_DB}.{actual_name}")
                    # Replace JOIN clauses
                    query = query.replace(f"JOIN {std_name} ", f"JOIN {config.CLICKHOUSE_DB}.{actual_name} ")
                
                logger.debug(f"Modified materialized view query: {query}")
                
                # Create the view
                self.ch_conn.execute_query(query)
                logger.info(f"Successfully created view: {view_name}")
            except Exception as e:
                logger.error(f"Error creating materialized view {view_name}: {e}")

        # Create dashboard views for Metabase
        try:
            from dashboard_views import get_all_dashboard_views
            logger.info("Creating dashboard views for Metabase")
            
            dashboard_views = get_all_dashboard_views()
            for view_name, view_def in dashboard_views.items():
                try:
                    logger.info(f"Creating dashboard view: {view_name}")
                    # Start with the original query
                    query = view_def['query']
                    
                    # Replace all references to standard table names with their actual mapped names
                    for std_name, actual_name in table_mapping.items():
                        # Replace FROM clauses
                        query = query.replace(f"FROM {std_name}", f"FROM {config.CLICKHOUSE_DB}.{actual_name}")
                        # Replace JOIN clauses
                        query = query.replace(f"JOIN {std_name} ", f"JOIN {config.CLICKHOUSE_DB}.{actual_name} ")
                    
                    logger.debug(f"Modified dashboard view query: {query}")
                    
                    self.ch_conn.execute_query(query)
                    logger.info(f"Successfully created dashboard view: {view_name}")
                except Exception as e:
                    logger.error(f"Error creating dashboard view {view_name}: {e}")
        except ImportError:
            logger.warning("Dashboard views module not found, skipping dashboard view creation")
        
        return True
    
    def run(self):
        """
        Main ETL process
        """
        try:
            # Initialize connections
            self.initialize()
            
            # Perform initial load if configured
            if config.INITIAL_LOAD:
                self.perform_initial_load()
                logger.info("Initial load completed")
            
            # Setup CDC for real-time updates
            cdc_setup_success = self.setup_cdc()
            
            if cdc_setup_success:
                # Continuous monitoring for changes
                logger.info("Starting continuous CDC monitoring")
                while True:
                    self.process_cdc_changes()
                    time.sleep(5)  # Poll every 5 seconds
            else:
                logger.error("CDC setup failed, ETL process cannot continue with real-time updates")
                if not config.INITIAL_LOAD:
                    logger.error("No initial load was performed and CDC setup failed. ETL process has nothing to do.")
        
        except KeyboardInterrupt:
            logger.info("ETL process interrupted")
        except Exception as e:
            logger.error(f"ETL process failed: {e}")
        finally:
            self.pg_conn.close()
            if hasattr(self, 'cdc_handler'):
                self.cdc_handler.close()
            self.ch_conn.close()
            logger.info("ETL process stopped")
    
    def load_data_to_existing_schema(self):
        """
        Carga datos desde PostgreSQL directamente en el esquema existente en ClickHouse
        definido en init.sql (DimTenant, DimGuest, etc.)
        """
        logger.info("Cargando datos en el esquema existente en ClickHouse")
        
        # Definir el orden de carga respetando dependencias
        load_order = [
            # Main dimensions
            "Tenants", "Countries", "Cities", "RoomTypes", "VisitReasons", 
            "Professions", "Companies", "Services", "Users",
            
            # Main entities
            "Rooms", "Guests",
            
            # Fact tables and relationships
            "Stays", "ServiceTickets", "GroupGuests", "GroupRooms"
        ]
        
        # Cargar datos para cada tabla en el orden especificado
        for pg_table in load_order:
            if pg_table in PG_TO_CH_TABLE_MAPPING:
                ch_table = PG_TO_CH_TABLE_MAPPING[pg_table]
                try:
                    logger.info(f"Cargando datos de {pg_table} en {ch_table}")
                    self.sync_table_to_existing_schema(pg_table, ch_table)
                except Exception as e:
                    logger.error(f"Error cargando datos de {pg_table} en {ch_table}: {e}")
            else:
                logger.warning(f"No existe mapeo para la tabla {pg_table}")
        
        # Generar y cargar la dimensión de tiempo
        try:
            self.generate_time_dimension()
        except Exception as e:
            logger.error(f"Error generando la dimensión de tiempo: {e}")
                
        logger.info("Carga de datos en el esquema existente completada")
        
    def generate_time_dimension(self):
        """
        Genera la dimensión de tiempo (DimTime) basada en el rango de fechas
        de las estancias en la base de datos
        """
        logger.info("Generando dimensión de tiempo (DimTime)")
        
        try:
            # Obtener el rango de fechas de las estancias
            min_date_query = "SELECT MIN(ArrivalDate) FROM Stays"
            max_date_query = "SELECT MAX(DepartureDate) FROM Stays"
            
            min_date_result = self.pg_conn.execute_query(min_date_query)
            max_date_result = self.pg_conn.execute_query(max_date_query)
            
            if not min_date_result or not max_date_result or min_date_result[0][0] is None or max_date_result[0][0] is None:
                logger.warning("No se encontraron fechas de estancias para generar la dimensión de tiempo")
                # Usar fechas predeterminadas: 2 años atrás hasta 1 año adelante
                min_date = pd.Timestamp.now() - pd.DateOffset(years=2)
                max_date = pd.Timestamp.now() + pd.DateOffset(years=1)
            else:
                min_date = min_date_result[0][0]
                max_date = max_date_result[0][0]
                
                # Agregar un margen de 1 año antes y después
                min_date = min_date - pd.DateOffset(years=1)
                max_date = max_date + pd.DateOffset(years=1)
            
            logger.info(f"Generando dimensión de tiempo desde {min_date.date()} hasta {max_date.date()}")
            
            # Verificar si la tabla ya tiene datos
            count_query = f"SELECT count() FROM {config.CLICKHOUSE_DB}.DimTime"
            existing_count = self.ch_conn.execute_query(count_query)[0][0]
            
            if existing_count > 0:
                logger.info(f"La tabla DimTime ya tiene {existing_count} registros. Truncando antes de insertar.")
                truncate_query = f"TRUNCATE TABLE {config.CLICKHOUSE_DB}.DimTime"
                self.ch_conn.execute_query(truncate_query)
            
            # Generar un DataFrame con todas las fechas en el rango
            date_range = pd.date_range(start=min_date, end=max_date)
            time_df = pd.DataFrame({'DateKey': date_range})
            
            # Agregar columnas adicionales
            time_df['Day'] = time_df['DateKey'].dt.day
            time_df['Month'] = time_df['DateKey'].dt.month_name()
            time_df['Quarter'] = time_df['DateKey'].dt.quarter
            time_df['Year'] = time_df['DateKey'].dt.year
            time_df['IsWeekend'] = time_df['DateKey'].dt.dayofweek.isin([5, 6]).astype(int)  # 5=Sábado, 6=Domingo
            
            # Determinar días festivos (simplificado, solo consideramos días fijos)
            holidays = [
                '01-01',  # Año Nuevo
                '05-01',  # Día del Trabajo
                '12-25',  # Navidad
            ]
            time_df['IsHoliday'] = time_df['DateKey'].dt.strftime('%m-%d').isin(holidays).astype(int)
            
            # Convertir a formato adecuado para ClickHouse
            time_df['DateKey'] = time_df['DateKey'].dt.date
            
            # Insertar en ClickHouse
            self._insert_transformed_data(time_df, 'DimTime')
            
            logger.info(f"Dimensión de tiempo generada con {len(time_df)} registros")
            
        except Exception as e:
            logger.error(f"Error generando la dimensión de tiempo: {e}")
            raise
        
    def sync_table_to_existing_schema(self, pg_table_name, ch_table_name):
        """
        Sincroniza datos de una tabla de PostgreSQL a una tabla existente en ClickHouse
        Adapta los datos según las convenciones de nombres y tipos del esquema existente
        """
        try:
            # Obtener los datos de PostgreSQL
            logger.info(f"Obteniendo datos de {pg_table_name} desde PostgreSQL")
            query = f"SELECT * FROM {pg_table_name}"
            df = self.pg_conn.execute_query_df(query)
            
            if df.empty:
                logger.warning(f"No hay datos en la tabla {pg_table_name}")
                return
                
            # Obtener la estructura de la tabla de ClickHouse
            ch_schema_query = f"DESCRIBE TABLE {config.CLICKHOUSE_DB}.{ch_table_name}"
            ch_schema = self.ch_conn.execute_query(ch_schema_query)
            ch_columns = [col[0] for col in ch_schema]
            
            logger.info(f"Columnas en ClickHouse para {ch_table_name}: {ch_columns}")
            logger.info(f"Columnas en PostgreSQL para {pg_table_name}: {df.columns.tolist()}")
            
            # Verificar si hay datos existentes en la tabla destino
            count_query = f"SELECT count() FROM {config.CLICKHOUSE_DB}.{ch_table_name}"
            existing_count = self.ch_conn.execute_query(count_query)[0][0]
            
            # Si ya hay datos en la tabla, truncarla antes de insertar nuevos datos
            if existing_count > 0:
                logger.info(f"La tabla {ch_table_name} tiene {existing_count} filas existentes. Truncando antes de insertar.")
                truncate_query = f"TRUNCATE TABLE {config.CLICKHOUSE_DB}.{ch_table_name}"
                self.ch_conn.execute_query(truncate_query)
                logger.info(f"Tabla {ch_table_name} truncada.")
            
            # Transformar los datos según el esquema de tablas existentes
            transformed_df = None
            if ch_table_name == "DimTenant":
                transformed_df = self.transform_data_for_dim_tenant(df)
            elif ch_table_name == "DimGuest":
                transformed_df = self.transform_data_for_dim_guest(df)
            elif ch_table_name == "DimRoom":
                transformed_df = self.transform_data_for_dim_room(df)
            elif ch_table_name == "FactStay":
                transformed_df = self.transform_data_for_fact_stay(df)
            elif ch_table_name == "FactServiceTicket":
                transformed_df = self.transform_data_for_fact_service_ticket(df)
            elif ch_table_name == "DimCompany":
                # Implementación simple para DimCompany
                logger.info("Transformando datos para DimCompany")
                transformed_df = pd.DataFrame()
                transformed_df['CompanyKey'] = df['Id'].apply(lambda x: int(x.hex[:16], 16))
                transformed_df['Name'] = df['Name']
                self._insert_transformed_data(transformed_df, 'DimCompany')
            elif ch_table_name == "DimService":
                # Implementación simple para DimService
                logger.info("Transformando datos para DimService")
                transformed_df = pd.DataFrame()
                transformed_df['ServiceKey'] = df['Id'].apply(lambda x: int(x.hex[:16], 16))
                transformed_df['Name'] = df['Name']
                transformed_df['Description'] = df['Description'].fillna('')
                self._insert_transformed_data(transformed_df, 'DimService')
            elif ch_table_name == "DimVisitReason":
                # Implementación simple para DimVisitReason
                logger.info("Transformando datos para DimVisitReason")
                transformed_df = pd.DataFrame()
                transformed_df['VisitReasonKey'] = df['Id'].apply(lambda x: int(x.hex[:16], 16))
                transformed_df['Name'] = df['Name']
                self._insert_transformed_data(transformed_df, 'DimVisitReason')
            elif ch_table_name == "DimUser":
                # Implementación simple para DimUser
                logger.info("Transformando datos para DimUser")
                transformed_df = pd.DataFrame()
                transformed_df['UserKey'] = df['Id'].apply(lambda x: int(x.hex[:16], 16))
                transformed_df['FullName'] = df['Name'] + ' ' + df['LastName']
                transformed_df['Role'] = df['Role'].astype(str)
                self._insert_transformed_data(transformed_df, 'DimUser')
            elif ch_table_name == "DimTime":
                # No hacemos nada aquí, ya que DimTime se llenará con datos generados automáticamente
                logger.info("La tabla DimTime se llenará con datos generados automáticamente")
            else:
                logger.warning(f"No hay transformación específica para {ch_table_name}, usando transformación genérica")
                # Para otras tablas, realizamos una transformación genérica si es necesario
                # Este caso solo debería ocurrir para tablas de puente o dimensiones adicionales
            
            # Si hemos procesado la tabla correctamente, mostramos el resultado
            if transformed_df is not None:
                logger.info(f"Datos sincronizados de {pg_table_name} a {ch_table_name}: {len(transformed_df)} filas procesadas")
            else:
                logger.info(f"No se realizó transformación para {ch_table_name} o la transformación se hizo dentro del método específico")
            
        except Exception as e:
            logger.error(f"Error sincronizando tabla {pg_table_name} a {ch_table_name}: {e}")
            raise
            
    def transform_data_for_dim_tenant(self, df):
        """Transforma datos para la tabla DimTenant"""
        # La tabla DimTenant en el esquema estrella contiene:
        # - TenantKey UInt64
        # - Name String
        
        # Verificamos que existan las columnas necesarias
        required_cols = ['Id', 'Name']
        self._verify_required_columns(df, required_cols, 'Tenants')
        
        # Crear un nuevo DataFrame con la estructura requerida
        transformed_df = pd.DataFrame()
        transformed_df['TenantKey'] = df['Id'].apply(lambda x: int(x.hex[:16], 16))  # Convertir GUID a UInt64
        transformed_df['Name'] = df['Name']
        
        # Insertar en ClickHouse
        self._insert_transformed_data(transformed_df, 'DimTenant')
        
        logger.info(f"Transformación completada para DimTenant: {len(transformed_df)} filas procesadas")
        return transformed_df
        
    def transform_data_for_dim_guest(self, df):
        """Transforma datos para la tabla DimGuest"""
        # La tabla DimGuest en el esquema estrella contiene:
        # - GuestKey UInt64
        # - CID String
        # - FullName String
        # - Age UInt16
        # - Profession String
        # - City String
        # - Country String
        # - EffectiveDate Date
        # - ExpiryDate Date
        # - CurrentFlag UInt8
        
        # Verificamos que existan las columnas necesarias
        required_cols = ['Id', 'Cid', 'Name', 'LastName', 'Birthday', 'ProfessionId', 'CityId', 'CountryId']
        self._verify_required_columns(df, required_cols, 'Guests')
        
        # Consultar información adicional necesaria (nombres de profesión, ciudad, país)
        # Primero obtenemos los datos de profesiones
        profession_query = "SELECT Id, Name FROM Professions"
        profession_df = self.pg_conn.execute_query_df(profession_query)
        profession_dict = dict(zip(profession_df['Id'], profession_df['Name']))
        
        # Obtenemos datos de ciudades
        city_query = "SELECT Id, Name FROM Cities"
        city_df = self.pg_conn.execute_query_df(city_query)
        city_dict = dict(zip(city_df['Id'], city_df['Name']))
        
        # Obtenemos datos de países
        country_query = "SELECT Id, Name FROM Countries"
        country_df = self.pg_conn.execute_query_df(country_query)
        country_dict = dict(zip(country_df['Id'], country_df['Name']))
        
        # Crear un nuevo DataFrame con la estructura requerida
        transformed_df = pd.DataFrame()
        transformed_df['GuestKey'] = df['Id'].apply(lambda x: int(x.hex[:16], 16))
        transformed_df['CID'] = df['Cid']
        transformed_df['FullName'] = df['Name'] + ' ' + df['LastName']
        
        # Calcular edad a partir de la fecha de nacimiento
        today = pd.Timestamp.now().date()
        transformed_df['Age'] = df['Birthday'].apply(lambda x: today.year - x.year - ((today.month, today.day) < (x.month, x.day)))
        
        # Mapear IDs a nombres usando los diccionarios
        transformed_df['Profession'] = df['ProfessionId'].map(lambda x: profession_dict.get(x, 'Unknown') if pd.notna(x) else 'Unknown')
        transformed_df['City'] = df['CityId'].map(lambda x: city_dict.get(x, 'Unknown') if pd.notna(x) else 'Unknown')
        transformed_df['Country'] = df['CountryId'].map(lambda x: country_dict.get(x, 'Unknown') if pd.notna(x) else 'Unknown')
        
        # Campos de SCD Tipo 2 (para futuras actualizaciones)
        transformed_df['EffectiveDate'] = df['Created'].dt.date
        transformed_df['ExpiryDate'] = pd.Timestamp('9999-12-31').date()
        transformed_df['CurrentFlag'] = 1  # 1 = registro actual
        
        # Insertar en ClickHouse
        self._insert_transformed_data(transformed_df, 'DimGuest')
        
        logger.info(f"Transformación completada para DimGuest: {len(transformed_df)} filas procesadas")
        return transformed_df
        
    def transform_data_for_dim_room(self, df):
        """Transforma datos para la tabla DimRoom"""
        # La tabla DimRoom en el esquema estrella contiene:
        # - RoomKey UInt64
        # - RoomNumber String
        # - RoomType String
        # - Price Decimal(12,2)
        # - Status String
        # - EffectiveDate Date
        # - ExpiryDate Date
        # - CurrentFlag UInt8
        
        # Verificamos que existan las columnas necesarias
        required_cols = ['Id', 'Number', 'RoomTypeId', 'Price', 'Status']
        self._verify_required_columns(df, required_cols, 'Rooms')
        
        # Consultar tipos de habitación
        room_type_query = "SELECT Id, Name FROM RoomTypes"
        room_type_df = self.pg_conn.execute_query_df(room_type_query)
        room_type_dict = dict(zip(room_type_df['Id'], room_type_df['Name']))
        
        # Crear un nuevo DataFrame con la estructura requerida
        transformed_df = pd.DataFrame()
        transformed_df['RoomKey'] = df['Id'].apply(lambda x: int(x.hex[:16], 16))
        transformed_df['RoomNumber'] = df['Number'].astype(str)
        transformed_df['RoomType'] = df['RoomTypeId'].map(lambda x: room_type_dict.get(x, 'Unknown') if pd.notna(x) else 'Unknown')
        transformed_df['Price'] = df['Price'].astype(float)
        
        # Mapear el estado numérico a texto descriptivo
        status_map = {
            0: 'Available',  # Corresponde a RoomStatus.Available en .NET
            1: 'Occupied',   # Corresponde a RoomStatus.Occupied en .NET
            2: 'Maintenance' # Corresponde a RoomStatus.Maintenance en .NET
        }
        transformed_df['Status'] = df['Status'].map(lambda x: status_map.get(x, 'Unknown') if pd.notna(x) else 'Unknown')
        
        # Campos de SCD Tipo 2 (para futuras actualizaciones)
        transformed_df['EffectiveDate'] = df['Created'].dt.date
        transformed_df['ExpiryDate'] = pd.Timestamp('9999-12-31').date()
        transformed_df['CurrentFlag'] = 1  # 1 = registro actual
        
        # Insertar en ClickHouse
        self._insert_transformed_data(transformed_df, 'DimRoom')
        
        logger.info(f"Transformación completada para DimRoom: {len(transformed_df)} filas procesadas")
        return transformed_df
        
    def transform_data_for_fact_stay(self, df):
        """Transforma datos para la tabla FactStay"""
        # La tabla FactStay en el esquema estrella contiene:
        # - StayKey UInt64
        # - FinalPrice Decimal(12,2)
        # - Pax UInt16
        # - Nights UInt16
        # - RoomsCount UInt8
        # - ServicesCount UInt16
        # - TenantKey UInt64
        # - GuestKey UInt64
        # - CompanyKey UInt64
        # - VisitReasonKey UInt64
        # - ArrivalDateKey Date
        # - DepartureDateKey Date
        # - ReservationDateKey Date
        
        # Verificamos que existan las columnas necesarias
        required_cols = ['Id', 'FinalPrice', 'Pax', 'ArrivalDate', 'DepartureDate', 'TenantId', 'HolderId', 'CompanyId', 'VisitReasonId']
        self._verify_required_columns(df, required_cols, 'Stays')
        
        # Obtener conteos adicionales de otras tablas
        # Contar habitaciones por estadía
        rooms_query = """
        SELECT StayId, COUNT(*) as RoomsCount 
        FROM GroupRooms 
        GROUP BY StayId
        """
        rooms_df = self.pg_conn.execute_query_df(rooms_query)
        rooms_dict = dict(zip(rooms_df['StayId'], rooms_df['RoomsCount']))
        
        # Contar servicios por estadía
        services_query = """
        SELECT StayId, COUNT(*) as ServicesCount 
        FROM ServiceTickets 
        GROUP BY StayId
        """
        services_df = self.pg_conn.execute_query_df(services_query)
        services_dict = dict(zip(services_df['StayId'], services_df['ServicesCount']))
        
        # Crear un nuevo DataFrame con la estructura requerida
        transformed_df = pd.DataFrame()
        transformed_df['StayKey'] = df['Id'].apply(lambda x: int(x.hex[:16], 16))
        transformed_df['FinalPrice'] = df['FinalPrice'].fillna(0).astype(float)
        transformed_df['Pax'] = df['Pax'].astype(int)
        
        # Calcular noches entre llegada y salida
        transformed_df['Nights'] = (df['DepartureDate'] - df['ArrivalDate']).dt.days
        
        # Obtener conteos de habitaciones y servicios
        transformed_df['RoomsCount'] = df['Id'].map(lambda x: rooms_dict.get(x, 0))
        transformed_df['ServicesCount'] = df['Id'].map(lambda x: services_dict.get(x, 0))
        
        # Convertir IDs a keys para las dimensiones
        transformed_df['TenantKey'] = df['TenantId'].apply(lambda x: int(x.hex[:16], 16))
        transformed_df['GuestKey'] = df['HolderId'].apply(lambda x: int(x.hex[:16], 16))
        transformed_df['CompanyKey'] = df['CompanyId'].fillna('00000000-0000-0000-0000-000000000000').apply(lambda x: int(x.hex[:16], 16))
        transformed_df['VisitReasonKey'] = df['VisitReasonId'].apply(lambda x: int(x.hex[:16], 16))
        
        # Fechas para dimension de tiempo
        transformed_df['ArrivalDateKey'] = df['ArrivalDate'].dt.date
        transformed_df['DepartureDateKey'] = df['DepartureDate'].dt.date
        transformed_df['ReservationDateKey'] = df['ReservationDate'].fillna(df['Created']).dt.date
        
        # Insertar en ClickHouse
        self._insert_transformed_data(transformed_df, 'FactStay')
        
        logger.info(f"Transformación completada para FactStay: {len(transformed_df)} filas procesadas")
        return transformed_df
        
    def transform_data_for_fact_service_ticket(self, df):
        """Transforma datos para la tabla FactServiceTicket"""
        # La tabla FactServiceTicket en el esquema estrella contiene:
        # - ServiceTicketKey UInt64
        # - ServicePrice Decimal(12,2)
        # - Quantity UInt16
        # - TenantKey UInt64
        # - StayKey UInt64
        # - ServiceKey UInt64
        # - UserKey UInt64
        # - CreatedDateKey Date
        
        # Verificamos que existan las columnas necesarias
        required_cols = ['Id', 'Price', 'TenantId', 'StayId', 'ServiceId', 'UserId', 'Created']
        self._verify_required_columns(df, required_cols, 'ServiceTickets')
        
        # Crear un nuevo DataFrame con la estructura requerida
        transformed_df = pd.DataFrame()
        transformed_df['ServiceTicketKey'] = df['Id'].apply(lambda x: int(x.hex[:16], 16))
        transformed_df['ServicePrice'] = df['Price'].astype(float)
        transformed_df['Quantity'] = 1  # Asumimos cantidad 1 por defecto
        
        # Convertir IDs a keys para las dimensiones
        transformed_df['TenantKey'] = df['TenantId'].apply(lambda x: int(x.hex[:16], 16))
        transformed_df['StayKey'] = df['StayId'].apply(lambda x: int(x.hex[:16], 16))
        transformed_df['ServiceKey'] = df['ServiceId'].apply(lambda x: int(x.hex[:16], 16))
        transformed_df['UserKey'] = df['UserId'].apply(lambda x: int(x.hex[:16], 16))
        
        # Fecha para dimension de tiempo
        transformed_df['CreatedDateKey'] = df['Created'].dt.date
        
        # Insertar en ClickHouse
        self._insert_transformed_data(transformed_df, 'FactServiceTicket')
        
        logger.info(f"Transformación completada para FactServiceTicket: {len(transformed_df)} filas procesadas")
        return transformed_df
    
    def _verify_required_columns(self, df, required_cols, table_name):
        """Verifica que el DataFrame tenga todas las columnas requeridas"""
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            error_msg = f"Faltan columnas requeridas en la tabla {table_name}: {missing_cols}"
            logger.error(error_msg)
            raise ValueError(error_msg)
    
    def _insert_transformed_data(self, df, table_name):
        """Inserta los datos transformados en ClickHouse"""
        if df.empty:
            logger.warning(f"No hay datos para insertar en {table_name}")
            return
            
        try:
            # Crear la consulta de inserción
            columns = ", ".join(df.columns)
            placeholders = ", ".join(["%s"] * len(df.columns))
            query = f"INSERT INTO {config.CLICKHOUSE_DB}.{table_name} ({columns}) VALUES"
            
            # Convertir DataFrame a lista de tuplas
            data = [tuple(x) for x in df.to_numpy()]
            
            # Ejecutar la inserción
            logger.info(f"Insertando {len(df)} filas en {table_name}")
            self.ch_conn.execute_query(query, data)
            logger.info(f"Datos insertados exitosamente en {table_name}")
        except Exception as e:
            logger.error(f"Error insertando datos en {table_name}: {e}")
            raise
