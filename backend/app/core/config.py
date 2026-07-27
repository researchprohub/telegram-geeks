"""Core configuration for the Telegram Engagement Platform."""

import os

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/tep"
    sql_alchemy_echo: bool = False

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Telegram
    telegram_api_id: int = 12345678
    telegram_api_hash: str = "your_api_hash"
    session_storage_path: str = "./sessions"

    # JWT / Auth
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 15  # 15 minutes for access tokens

    # AI Providers
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    ollama_base_url: str = "http://localhost:11434"
    huggingface_api_key: Optional[str] = None
    github_token: Optional[str] = None

    # AI Defaults
    default_ai_provider: str = "openai"
    default_ai_model: str = "gpt-4o-mini"
    ai_fallback_chain: str = "openai,anthropic,groq,ollama"

    # Rate Limiting
    rate_limit_requests_per_minute: int = 60
    rate_limit_burst: int = 10

    # Proxy
    default_proxy_pool_size: int = 20
    proxy_rotation_enabled: bool = True

    # Safety
    max_daily_messages_per_account: int = 50
    flood_wait_auto_resume: bool = True
    ban_detection_enabled: bool = True

    # Frontend
    frontend_url: str = "http://localhost:3000"

    # Logging
    log_level: str = "INFO"
    log_format: str = "json"

    # Metrics
    metrics_enabled: bool = True
    metrics_port: int = 9090

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:8000", "http://localhost:80"]

    # Environment
    environment: str = "production"
    enable_docs: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Enforce secure JWT secret
        if not self.jwt_secret or len(self.jwt_secret) < 32:
            # Generate a random secret if not set
            self.jwt_secret = os.urandom(32).hex()

settings = Settings()
