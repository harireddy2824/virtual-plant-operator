"""
Centralized Configuration Manager
Parses, validates, and manages environment variables and system constants.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    ENV: str = os.getenv("FLASK_ENV", "production")
    DEBUG: bool = os.getenv("FLASK_DEBUG", "false").lower() in {"1", "true", "yes", "on"}
    PORT: int = int(os.getenv("PORT", "5000"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()

    # MongoDB Config
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    MONGO_DB: str = os.getenv("MONGO_DB", "virtual_plant_db")
    MONGO_CONNECT_TIMEOUT_MS: int = int(os.getenv("MONGO_CONNECT_TIMEOUT_MS", "2000"))

    # Grok AI Config
    XAI_API_KEY: str = os.getenv("XAI_API_KEY", os.getenv("GROK_API_KEY", ""))
    XAI_MODEL: str = os.getenv("XAI_MODEL", os.getenv("GROK_MODEL", "grok-2-latest"))
    XAI_BASE_URL: str = os.getenv("XAI_BASE_URL", "https://api.x.ai/v1")
    XAI_TIMEOUT: int = int(os.getenv("XAI_TIMEOUT", "45"))

    # Security & JWT Config
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", os.getenv("FRONTEND_URL", "*"))
    JWT_SECRET: str = os.getenv("JWT_SECRET", "vpo-super-secret-key-change-in-production-2026")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_SECONDS: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_SECONDS", "900"))
    REFRESH_TOKEN_EXPIRE_SECONDS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_SECONDS", "604800"))

    # Rate Limiting & Safety
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() in {"1", "true", "yes", "on"}


settings = Settings()

