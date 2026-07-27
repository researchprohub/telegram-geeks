"""Structured logging configuration."""

import sys
from loguru import logger

from app.core.config import settings


def setup_logging() -> None:
    """Configure loguru with the settings-defined level and format."""
    logger.remove()

    if settings.log_format == "json":
        logger.add(
            sys.stderr,
            level=settings.log_level,
            format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level} | {name}:{function}:{line} - {message}",
            serialize=True,
        )
    else:
        logger.add(
            sys.stderr,
            level=settings.log_level,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        )

    logger.add(
        "logs/app_{time:YYYY-MM-DD}.log",
        rotation="1 day",
        retention="30 days",
        level=settings.log_level,
        encoding="utf-8",
    )
