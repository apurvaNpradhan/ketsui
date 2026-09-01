import warnings
from pathlib import Path
from typing import Literal

from pydantic import AnyHttpUrl, PostgresDsn, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[3] / ".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    API_V1_STR: str = "/v1"
    FRONTEND_HOST: str = "http://localhost:5173"
    FASTAPI_ENV: Literal["development", "production"] = "production"
    PROJECT_NAME: str = "Ketsui"
    BACKEND_PORT: int = 8000
    BACKEND_DATABASE_URL: PostgresDsn
    BETTER_AUTH_JWKS_URL: str
    BETTER_AUTH_URL: str = "http://localhost:5173"

    @field_validator("BETTER_AUTH_JWKS_URL", "BETTER_AUTH_URL")
    @classmethod
    def _validate_http_url(cls, value: str) -> str:
        AnyHttpUrl(value)
        return value

    @field_validator("BACKEND_DATABASE_URL", mode="before")
    @classmethod
    def _use_psycopg_driver(cls, value: str | PostgresDsn) -> str:
        database_url = str(value)
        for scheme in ("postgres://", "postgresql://"):
            if database_url.startswith(scheme):
                return database_url.replace(scheme, "postgresql+psycopg://", 1)
        return database_url

    @model_validator(mode="after")
    def _validate_deployment_settings(self) -> Settings:
        placeholder_passwords = {
            "changethis",
            "change-this-backend-password",
            "change-this-auth-password",
            "replace-with-at-least-32-characters",
        }
        for host in self.BACKEND_DATABASE_URL.hosts():
            password = host.get("password")
            if password in placeholder_passwords:
                message = "Set a real backend database password before deployment."
                if self.FASTAPI_ENV == "development":
                    warnings.warn(message, stacklevel=1)
                else:
                    raise ValueError(message)

        if self.FASTAPI_ENV == "production":
            if self.BETTER_AUTH_URL == "http://localhost:5173":
                raise ValueError("BETTER_AUTH_URL must be set in production.")
            if AnyHttpUrl(self.BETTER_AUTH_JWKS_URL).scheme != "https":
                raise ValueError("BETTER_AUTH_JWKS_URL must use HTTPS in production.")

        return self


settings = Settings()  # type: ignore[call-arg]  # ty: ignore[missing-argument]
