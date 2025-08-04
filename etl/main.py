import time
import sys
import logging

# Configuración básica de logging para errores iniciales
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    from logger import setup_logging
    from etl import ETL
except ImportError as e:
    logger.error(f"Error importando módulos: {e}")
    logger.error("Verifique que todas las dependencias estén instaladas")
    sys.exit(1)

if __name__ == "__main__":
    # Setup logging
    logger = setup_logging()
    logger.info("Starting ETL service")
    
    # Check ClickHouse connectivity first
    try:
        from db import ClickHouseConnection
        ch_conn = ClickHouseConnection()
        ch_conn.connect()
        logger.info("ClickHouse connection verified")
    except Exception as e:
        logger.error(f"Cannot connect to ClickHouse: {e}")
        logger.error("Waiting 30 seconds before retry...")
        time.sleep(30)
        # We'll let the retry loop below handle this
    
    try:
        # Add retry logic for container startup order
        retry_count = 0
        max_retries = 15  # Increased retries for better resilience
        while retry_count < max_retries:
            try:
                etl = ETL()
                etl.run()
                break
            except Exception as e:
                logger.warning(f"Failed to start ETL (attempt {retry_count+1}/{max_retries}): {e}")
                retry_count += 1
                if retry_count >= max_retries:
                    logger.error("Max retries reached, exiting")
                    sys.exit(1)
                
                # Exponential backoff for retries
                sleep_time = min(30, 2 ** min(retry_count, 4))
                logger.info(f"Retrying in {sleep_time} seconds...")
                time.sleep(sleep_time)
    except Exception as e:
        logger.critical(f"Critical error in ETL service: {e}")
        sys.exit(1)
