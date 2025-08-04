import logging
import os
import coloredlogs
from logging.handlers import RotatingFileHandler
from config import config

LOG_DIRECTORY = "/app/logs"
LOG_FILENAME = "etl.log"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"


def setup_logging():
    """Set up logging configuration for the ETL process"""
    # Create logs directory if it doesn't exist
    os.makedirs(LOG_DIRECTORY, exist_ok=True)
    log_file_path = os.path.join(LOG_DIRECTORY, LOG_FILENAME)
    
    # Configure root logger
    logger = logging.getLogger()
    logger.setLevel(config.LOG_LEVEL)
    
    # Configure file handler
    file_handler = RotatingFileHandler(
        log_file_path, 
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_formatter = logging.Formatter(LOG_FORMAT)
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)
    
    # Configure console handler with colored logs
    coloredlogs.install(
        level=config.LOG_LEVEL,
        logger=logger,
        fmt=LOG_FORMAT
    )
    
    logger.info("Logging setup completed")
    return logger
