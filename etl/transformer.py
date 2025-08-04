import logging
import pandas as pd
from typing import Dict, List, Any
from datetime import datetime, date
import numpy as np
from dateutil.relativedelta import relativedelta

logger = logging.getLogger(__name__)

class DataTransformer:
    def __init__(self):
        # Mapeos de valores para enums y otros campos
        self.room_status_map = {
            0: 'Available',
            1: 'Occupied',
            2: 'Maintenance',
            3: 'Cleaning',
            4: 'OutOfOrder'
        }
        
        self.stay_state_map = {
            0: 'Pending',
            1: 'Active',
            2: 'Completed',
            3: 'Canceled'
        }
        
        self.access_level_map = {
            0: 'Employee',
            1: 'Manager',
            2: 'Admin',
            3: 'Owner'
        }
    
    def transform_data(self, data: List[Dict[str, Any]], table_name: str) -> pd.DataFrame:
        """
        Transform data from PostgreSQL format to ClickHouse format
        """
        if not data:
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Extraer fecha de creación para análisis temporal (común a todas las tablas con BaseEntity)
        if 'created' in df.columns:
            try:
                df['created'] = pd.to_datetime(df['created'])
                df['created_date'] = df['created'].dt.date
                df['created_time'] = df['created']
            except Exception as e:
                logger.error(f"Error extracting created_date: {e}")
        
        # Apply table-specific transformations
        transform_method = getattr(self, f"transform_{table_name}", None)
        if transform_method:
            df = transform_method(df)
        
        # Common transformations for all tables
        df = self._handle_timestamps(df)
        df = self._handle_null_values(df)
        
        return df
    
    def _handle_timestamps(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle timestamp conversions for ClickHouse"""
        for col in df.columns:
            if df[col].dtype.kind == 'M':  # Timestamp type
                df[col] = df[col].dt.strftime('%Y-%m-%d %H:%M:%S')
        return df
    
    def _handle_null_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle null values based on column types"""
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].fillna('')
            elif df[col].dtype in ['int64', 'float64']:
                df[col] = df[col].fillna(0)
            elif df[col].dtype == 'bool':
                df[col] = df[col].fillna(False)
            elif 'datetime' in str(df[col].dtype).lower():
                # Para fechas NULL en ClickHouse, usamos una fecha especial
                df[col] = df[col].fillna(pd.Timestamp('1970-01-01'))
        return df
    
    def _calculate_age(self, birthday):
        """Calculate age based on birthday"""
        today = date.today()
        if pd.isnull(birthday):
            return 0
        try:
            return relativedelta(today, birthday).years
        except Exception:
            return 0
    
    # Transformaciones específicas por tabla
    def transform_tenant(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform Tenant data"""
        if 'name' in df.columns:
            df['tenant_name'] = df['name']
        
        # Asegurar que los campos obligatorios para ClickHouse estén presentes
        if 'is_active' not in df.columns:
            df['is_active'] = 1
            
        return df
    
    def transform_country(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform Country data"""
        if 'name' in df.columns:
            df['country_name'] = df['name']
            
        # Asegurar código de país
        if 'code' in df.columns:
            df['country_code'] = df['code']
        
        return df
    
    def transform_city(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform City data"""
        if 'name' in df.columns:
            df['city_name'] = df['name']
            
        return df
    
    def transform_room_type(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform RoomType data"""
        if 'name' in df.columns:
            df['type_name'] = df['name']
            
        return df
    
    def transform_visit_reason(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform VisitReason data"""
        if 'name' in df.columns:
            df['reason_name'] = df['name']
            
        return df
    
    def transform_profession(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform Profession data"""
        if 'name' in df.columns:
            df['profession_name'] = df['name']
            
        return df
    
    def transform_company(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform Company data"""
        if 'name' in df.columns:
            df['company_name'] = df['name']
            
        return df
    
    def transform_service(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform Service data"""
        if 'name' in df.columns:
            df['service_name'] = df['name']
            
        return df
    
    def transform_user(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform User data"""
        if 'name' in df.columns:
            df['user_name'] = df['name']
        
        # Convertir nivel de acceso a representación numérica
        if 'access_level' in df.columns:
            access_level_reverse = {v: k for k, v in self.access_level_map.items()}
            df['access_level'] = df['access_level'].map(access_level_reverse).fillna(0).astype(int)
            
        return df
    
    def transform_room(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform Room data"""
        # Renombrar campos para mayor claridad en el warehouse
        if 'number' in df.columns:
            df['room_number'] = df['number']
        
        # Convertir status a representación numérica y texto
        if 'status' in df.columns:
            df['status_text'] = df['status'].map(self.room_status_map)
            
        return df
    
    def transform_guest(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform Guest data"""
        # Crear nombre completo para facilitar las búsquedas
        if 'name' in df.columns and 'last_name' in df.columns:
            df['full_name'] = df['name'] + ' ' + df['last_name']
        
        # Calcular edad a partir de la fecha de nacimiento
        if 'birthday' in df.columns:
            try:
                df['birthday'] = pd.to_datetime(df['birthday'])
                df['age'] = df['birthday'].apply(self._calculate_age)
            except Exception as e:
                logger.error(f"Error calculating age: {e}")
                df['age'] = 0
                
        return df
    
    def transform_stay(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform Stay data para optimizar análisis en el warehouse"""
        # Renombrar campos para mayor claridad
        if 'arrivaldate' in df.columns:
            df['arrival_date'] = pd.to_datetime(df['arrivaldate'])
        elif 'arrival_date' in df.columns:
            df['arrival_date'] = pd.to_datetime(df['arrival_date'])
            
        if 'departuredate' in df.columns:
            df['departure_date'] = pd.to_datetime(df['departuredate'])
        elif 'departure_date' in df.columns:
            df['departure_date'] = pd.to_datetime(df['departure_date'])
            
        if 'reservationdate' in df.columns:
            df['reservation_date'] = pd.to_datetime(df['reservationdate'])
        elif 'reservation_date' in df.columns:
            df['reservation_date'] = pd.to_datetime(df['reservation_date'])
            
        # Estado de la estancia como texto
        if 'state' in df.columns:
            df['state_text'] = df['state'].map(self.stay_state_map)
        
        # Calcular duración de la estancia en días
        try:
            if 'arrival_date' in df.columns and 'departure_date' in df.columns:
                df['stay_duration_days'] = (df['departure_date'] - df['arrival_date']).dt.days
                df.loc[df['stay_duration_days'] < 0, 'stay_duration_days'] = 0
                
                # Calcular ingreso por día si hay precio final
                if 'final_price' in df.columns:
                    df['revenue_per_day'] = df.apply(
                        lambda x: x['final_price'] / x['stay_duration_days'] if x['stay_duration_days'] > 0 else x['final_price'],
                        axis=1
                    )
        except Exception as e:
            logger.error(f"Error calculating stay metrics: {e}")
            
        # Indicador de estancia corporativa
        df['is_company_stay'] = df['company_id'].notna().astype(int)
        
        # Tiempo de anticipación de la reserva
        try:
            if 'reservation_date' in df.columns and 'arrival_date' in df.columns:
                mask = df['reservation_date'].notna()
                df.loc[mask, 'reservation_lead_time'] = (
                    df.loc[mask, 'arrival_date'] - df.loc[mask, 'reservation_date']
                ).dt.days
                df['reservation_lead_time'] = df['reservation_lead_time'].fillna(0).astype(int)
        except Exception as e:
            logger.error(f"Error calculating reservation lead time: {e}")
            
        return df
    
    def transform_service_ticket(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform ServiceTicket data"""
        # No necesita transformaciones adicionales a las comunes
        return df
    
    def transform_group_guests(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform GroupGuests data"""
        # Determinar si el huésped es el titular
        if 'guest_id' in df.columns and 'holder_id' in df.columns:
            df['is_holder'] = (df['guest_id'] == df['holder_id']).astype(int)
            
        return df
    
    def transform_group_rooms(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform GroupRooms data"""
        # Calcular días de ocupación por habitación
        if 'check_in' in df.columns and 'check_out' in df.columns:
            try:
                df['check_in'] = pd.to_datetime(df['check_in'])
                df['check_out'] = pd.to_datetime(df['check_out'])
                
                # Calcular solo donde check_out no es nulo
                mask = df['check_out'].notna()
                df.loc[mask, 'occupation_days'] = (
                    df.loc[mask, 'check_out'] - df.loc[mask, 'check_in']
                ).dt.days
                
                # Si hay valores negativos, los corregimos a 0
                df.loc[df['occupation_days'] < 0, 'occupation_days'] = 0
                
                # Asegurarnos que sea un entero
                df['occupation_days'] = df['occupation_days'].fillna(0).astype(int)
            except Exception as e:
                logger.error(f"Error calculating occupation days: {e}")
                
        return df
