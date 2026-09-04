"""Authentication configuration."""

import ipaddress
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
            auth_url = AnyHttpUrl(self.BETTER_AUTH_URL)
            auth_ip = _parse_ip_host(auth_url.host)
            if (
                auth_url.scheme != "https"
                or auth_url.host == "localhost"
                or (auth_ip is not None and not auth_ip.is_global)
            ):
                raise ValueError(
                    "BETTER_AUTH_URL must be a public HTTPS URL in production."
                )

            # The JWKS endpoint may use the private Compose network while the issuer stays public.
            jwks_url = AnyHttpUrl(self.BETTER_AUTH_JWKS_URL)
            jwks_ip = _parse_ip_host(jwks_url.host)
            if jwks_url.host == "localhost" or (
                jwks_ip is not None and jwks_ip.is_loopback
            ):
                raise ValueError(
                    "BETTER_AUTH_JWKS_URL must not point to localhost in production."
                )

        return self


def _parse_ip_host(
    host: str | None,
) -> ipaddress.IPv4Address | ipaddress.IPv6Address | None:
    if host is None:
        return None
    try:
        return ipaddress.ip_address(host.strip("[]"))
    except ValueError:
        return None


auth_settings = AuthSettings()  # type: ignore[call-arg]  # ty: ignore[missing-argument]
