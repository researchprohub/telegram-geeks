"""Telegram layer configuration."""

from pydantic_settings import BaseSettings
from typing import Optional


class TelegramConfig(BaseSettings):
    api_id: int = 12345678
    api_hash: str = "your_api_hash"
    session_storage_path: str = "./sessions"
    connection_retries: int = 3
    reconnect_delay: int = 5
    sleep_threshold: int = 60
    flood_wait_buffer: int = 10  # extra seconds to add to flood waits

    model_config = {"env_file": ".env", "extra": "ignore"}
