"""Authentication configuration."""

from pathlib import Path
from typing import Literal

from pydantic import AnyHttpUrl, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AuthSettings(BaseSettings):
    """Settings used to validate Better Auth tokens."""

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[4] / ".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    FASTAPI_ENV: Literal["development", "staging", "production"] = "production"
    BETTER_AUTH_JWKS_URL: str
    BETTER_AUTH_URL: str = "http://localhost:5173"

    @field_validator("BETTER_AUTH_JWKS_URL", "BETTER_AUTH_URL")
    @classmethod
    def _validate_http_url(cls, value: str) -> str:
        AnyHttpUrl(value)
        return value

    @model_validator(mode="after")
    def _validate_production_urls(self) -> AuthSettings:
        if self.FASTAPI_ENV == "production":
            if self.BETTER_AUTH_URL == "http://localhost:5173":
                raise ValueError("BETTER_AUTH_URL must be set in production.")
            if AnyHttpUrl(self.BETTER_AUTH_JWKS_URL).scheme != "https":
                raise ValueError("BETTER_AUTH_JWKS_URL must use HTTPS in production.")

        return self


auth_settings = AuthSettings()  # type: ignore[call-arg]  # ty: ignore[missing-argument]
