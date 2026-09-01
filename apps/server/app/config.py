import warnings
from pathlib import Path
from typing import Literal

from pydantic import AliasChoices, Field, PostgresDsn, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[3] / ".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    API_V1_STR: str = "/v1"
    FRONTEND_HOST: str = "http://localhost:5173"
    FASTAPI_ENV: Literal["development"] | None = None
    PROJECT_NAME: str = "Ketsui"
    BACKEND_PORT: int = 8000
    DATABASE_URL: PostgresDsn = Field(
        validation_alias=AliasChoices("BACKEND_DATABASE_URL", "DATABASE_URL")
    )
    BETTER_AUTH_JWKS_URL: str
    BETTER_AUTH_URL: str = "http://localhost:5173"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _use_psycopg_driver(cls, value: str | PostgresDsn) -> str:
        database_url = str(value)
        for scheme in ("postgres://", "postgresql://"):
            if database_url.startswith(scheme):
                return database_url.replace(scheme, "postgresql+psycopg://", 1)
        return database_url

    @model_validator(mode="after")
    def _enforce_non_default_database_secret(self) -> Settings:
        for host in self.DATABASE_URL.hosts():
            password = host.get("password")
            if password == "changethis":
                message = (
                    'The value of DATABASE_URL password is "changethis", '
                    "for security, please change it, at least for deployments."
                )
                if self.FASTAPI_ENV == "development":
                    warnings.warn(message, stacklevel=1)
                else:
                    raise ValueError(message)
        return self


settings = Settings()  # type: ignore[call-arg]  # ty: ignore[missing-argument]
