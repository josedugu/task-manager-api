"""
Logging configuration.
Configuración centralizada de logging para toda la aplicación.
"""

import logging
import sys


def setup_logging(log_level: str = "INFO") -> None:
    """
    Configura el sistema de logging para toda la aplicación.

    Args:
        log_level: Nivel de logging (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    # Formato de logs
    log_format = "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s | %(message)s"

    # Configuración básica
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format=log_format,
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[
            logging.StreamHandler(sys.stdout),  # Console
        ],
    )

    # Silenciar logs ruidosos de librerías externas
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured with level: {log_level}")
