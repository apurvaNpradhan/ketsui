"""Application configuration."""

import warnings
from pathlib import Path
from typing import Literal

from pydantic import PostgresDsn, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings shared by the application and database tooling."""

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[3] / ".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    API_V1_STR: str = "/v1"
    FRONTEND_HOST: str = "http://localhost:5173"
    FASTAPI_ENV: Literal["development", "staging", "production"] = "production"
    PROJECT_NAME: str = "Ketsui"
    BACKEND_PORT: int = 8000
    DATABASE_URL: PostgresDsn
    # Used only by Alembic; the application keeps using DATABASE_URL.
    DATABASE_MIGRATION_URL: PostgresDsn | None = None

    @field_validator("DATABASE_URL", "DATABASE_MIGRATION_URL", mode="before")
    @classmethod
    def _use_psycopg_driver(cls, value: str | PostgresDsn | None) -> str | None:
        if value is None:
            return None

        database_url = str(value)
        for scheme in ("postgres://", "postgresql://"):
            if database_url.startswith(scheme):
                return database_url.replace(scheme, "postgresql+psycopg://", 1)
        return database_url

    @model_validator(mode="after")
    def _validate_database_settings(self) -> Settings:
        placeholder_passwords = {
            "password",
            "changethis",
            "change-this-backend-password",
            "change-this-auth-password",
            "replace-with-at-least-32-characters",
            "replace-with-a-local-backend-password",
        }
        for host in self.DATABASE_URL.hosts():
            if host.get("password") in placeholder_passwords:
                message = "Set a real backend database password before deployment."
                if self.FASTAPI_ENV == "development":
                    warnings.warn(message, stacklevel=1)
                else:
                    raise ValueError(message)

        return self


settings = Settings()  # type: ignore[call-arg]  # ty: ignore[missing-argument]
