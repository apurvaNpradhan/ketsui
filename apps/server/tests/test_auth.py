import os
from collections.abc import AsyncGenerator, Generator
from types import SimpleNamespace
from typing import Any
from unittest.mock import Mock, patch

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://backend_app:password@localhost:5432/backend_db",
)
os.environ.setdefault("BETTER_AUTH_JWKS_URL", "http://localhost:5173/api/auth/jwks")
os.environ.setdefault("BETTER_AUTH_URL", "http://localhost:5173")
os.environ.setdefault("FASTAPI_ENV", "development")

import httpx
import jwt
import pytest
import pytest_asyncio
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from src.auth.config import AuthSettings
from src.auth.dependencies import get_current_user, jwks_client
from src.auth.schemas import CurrentUser
from src.config import Settings
from src.main import app


@pytest.fixture
def private_key() -> Ed25519PrivateKey:
    return Ed25519PrivateKey.generate()


def token(private_key: Ed25519PrivateKey, **overrides: Any) -> str:
    claims = {
        "sub": "user-123",
        "email": "user@example.com",
        "name": "Test User",
        "iss": "http://localhost:5173",
        "aud": "http://localhost:5173",
        "exp": 4_000_000_000,
    }
    claims.update(overrides)
    return jwt.encode(claims, private_key, algorithm="EdDSA")


@pytest.mark.parametrize(
    "claim", [{"name": ["not-a-string"]}, {"iss": "https://wrong.example"}]
)
@patch.object(jwks_client, "get_signing_key_from_jwt")
def test_invalid_tokens_are_rejected(
    get_signing_key: Mock,
    private_key: Ed25519PrivateKey,
    claim: dict[str, Any],
) -> None:
    get_signing_key.return_value = SimpleNamespace(key=private_key.public_key())

    with pytest.raises(HTTPException) as raised:
        get_current_user(
            HTTPAuthorizationCredentials(
                scheme="Bearer",
                credentials=token(private_key, **claim),
            )
        )

    assert raised.value.status_code == 401


@patch.object(jwks_client, "get_signing_key_from_jwt")
def test_valid_ed25519_token_returns_user(
    get_signing_key: Mock,
    private_key: Ed25519PrivateKey,
) -> None:
    get_signing_key.return_value = SimpleNamespace(key=private_key.public_key())

    user = get_current_user(
        HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token(private_key),
        )
    )

    assert user.model_dump() == {
        "id": "user-123",
        "email": "user@example.com",
        "name": "Test User",
    }


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[httpx.AsyncClient]:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture(autouse=True)
def clear_dependency_overrides() -> Generator[None]:
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_current_user_requires_authentication_at_http_boundary(
    client: httpx.AsyncClient,
) -> None:
    response = await client.get("/v1/users/me")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_agent_requires_authentication_at_http_boundary(
    client: httpx.AsyncClient,
) -> None:
    response = await client.post("/v1/agent/", json={})

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_current_user_response_is_serialized_at_http_boundary(
    client: httpx.AsyncClient,
) -> None:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id="user-123", email="user@example.com", name="Test User"
    )

    response = await client.get("/v1/users/me")

    assert response.status_code == 200
    assert response.json() == {
        "id": "user-123",
        "email": "user@example.com",
        "name": "Test User",
    }


def settings(**overrides: Any) -> Settings:
    values = {
        "DATABASE_URL": "postgresql://backend_app:secure-password@localhost:5432/backend_db",
        "FASTAPI_ENV": "production",
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)  # type: ignore[call-arg]


def auth_settings(**overrides: Any) -> AuthSettings:
    values = {
        "BETTER_AUTH_JWKS_URL": "https://auth.example.com/api/auth/jwks",
        "BETTER_AUTH_URL": "https://auth.example.com",
        "FASTAPI_ENV": "production",
    }
    values.update(overrides)
    return AuthSettings(_env_file=None, **values)  # type: ignore[call-arg]


def test_production_requires_public_https_auth_url() -> None:
    with pytest.raises(ValueError):
        auth_settings(BETTER_AUTH_URL="http://localhost:5173")
    with pytest.raises(ValueError):
        auth_settings(BETTER_AUTH_URL="http://auth.example.com")


@pytest.mark.parametrize(
    "url", ["https://10.0.0.1", "https://127.0.0.2", "https://[::1]"]
)
def test_production_rejects_non_public_auth_ip_addresses(url: str) -> None:
    with pytest.raises(ValueError):
        auth_settings(BETTER_AUTH_URL=url)


@pytest.mark.parametrize(
    "url",
    [
        "http://localhost:5173/api/auth/jwks",
        "http://127.0.0.2:5173/api/auth/jwks",
        "http://[::1]:5173/api/auth/jwks",
    ],
)
def test_production_rejects_loopback_jwks_urls(url: str) -> None:
    with pytest.raises(ValueError):
        auth_settings(BETTER_AUTH_JWKS_URL=url)


def test_production_allows_private_jwks_url() -> None:
    configured = auth_settings(
        BETTER_AUTH_JWKS_URL="http://frontend:5173/api/auth/jwks"
    )

    assert configured.BETTER_AUTH_JWKS_URL == "http://frontend:5173/api/auth/jwks"


def test_migration_database_url_uses_psycopg_driver() -> None:
    configured = settings(
        DATABASE_MIGRATION_URL=(
            "postgresql://backend_migration_user:secure-password@"
            "localhost:5432/backend_db"
        )
    )

    assert str(configured.DATABASE_MIGRATION_URL).startswith("postgresql+psycopg://")


def test_production_rejects_documented_database_password_placeholders() -> None:
    with pytest.raises(ValueError):
        settings(
            DATABASE_URL=(
                "postgresql://backend_app:change-this-backend-password@"
                "localhost:5432/backend_db"
            )
        )
