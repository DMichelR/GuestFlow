import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Config(BaseSettings):
    # PostgreSQL configuration
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "guestflow")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres_password")
    
    # ClickHouse configuration
    CLICKHOUSE_HOST: str = os.getenv("CLICKHOUSE_HOST", "localhost")
    CLICKHOUSE_PORT: int = int(os.getenv("CLICKHOUSE_PORT", "9000"))
    CLICKHOUSE_DB: str = os.getenv("CLICKHOUSE_DB", "default")
    CLICKHOUSE_USER: str = os.getenv("CLICKHOUSE_USER", "default")
    CLICKHOUSE_PASSWORD: str = os.getenv("CLICKHOUSE_PASSWORD", "clickhouse_password")
    
    # ETL configuration
    INITIAL_LOAD: bool = os.getenv("INITIAL_LOAD", "False").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Connection strings
    @property
    def postgres_connection_string(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    @property
    def clickhouse_connection_dict(self) -> dict:
        return {
            "host": self.CLICKHOUSE_HOST,
            "port": self.CLICKHOUSE_PORT,
            "database": self.CLICKHOUSE_DB,
            "user": self.CLICKHOUSE_USER,
            "password": self.CLICKHOUSE_PASSWORD
        }

config = Config()
