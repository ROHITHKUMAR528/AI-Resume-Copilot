"""
Application configuration using pydantic-settings.
All settings are loaded from environment variables / .env file.
"""
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Application ───────────────────────────────────────────────────────
    APP_NAME: str = "AI Resume Copilot"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ─── Security ──────────────────────────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ─── Database ──────────────────────────────────────────────────────────
    DATABASE_URL: str

    # ─── Redis ─────────────────────────────────────────────────────────────
    REDIS_URL: str

    # ─── OpenAI ────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # ─── AWS ───────────────────────────────────────────────────────────────
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "resume-copilot-files"

    # ─── CORS ──────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    @validator("CORS_ORIGINS", pre=True)
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # ─── Rate Limiting ─────────────────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60

    # ─── Monitoring ────────────────────────────────────────────────────────
    SENTRY_DSN: str = ""

    # ─── File Upload ───────────────────────────────────────────────────────
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "docx", "doc"]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
