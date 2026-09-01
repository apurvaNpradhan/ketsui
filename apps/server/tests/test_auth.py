import os
import unittest
from types import SimpleNamespace
from typing import Any
from unittest.mock import Mock, patch

os.environ.setdefault(
    "BACKEND_DATABASE_URL",
    "postgresql://backend_app:password@localhost:5432/backend_db",
)
os.environ.setdefault("BETTER_AUTH_JWKS_URL", "http://localhost:5173/api/auth/jwks")
os.environ.setdefault("BETTER_AUTH_URL", "http://localhost:5173")
os.environ.setdefault("FASTAPI_ENV", "development")

import jwt
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient

from app.auth import CurrentUser, get_current_user, jwks_client
from app.config import Settings
from app.main import app


class AuthTest(unittest.TestCase):
    def setUp(self) -> None:
        self.private_key = Ed25519PrivateKey.generate()
        self.public_key = self.private_key.public_key()

    def token(self, **overrides: Any) -> str:
        claims = {
            "sub": "user-123",
            "email": "user@example.com",
            "name": "Test User",
            "iss": "http://localhost:5173",
            "aud": "http://localhost:5173",
            "exp": 4_000_000_000,
        }
        claims.update(overrides)
        return jwt.encode(claims, self.private_key, algorithm="EdDSA")

    @patch.object(jwks_client, "get_signing_key_from_jwt")
    def test_valid_ed25519_token_returns_user(self, get_signing_key: Mock) -> None:
        get_signing_key.return_value = SimpleNamespace(key=self.public_key)

        user = get_current_user(
            HTTPAuthorizationCredentials(scheme="Bearer", credentials=self.token())
        )

        self.assertEqual(
            user.model_dump(),
            {
                "id": "user-123",
                "email": "user@example.com",
                "name": "Test User",
            },
        )

    @patch.object(jwks_client, "get_signing_key_from_jwt")
    def test_malformed_claim_types_are_rejected(self, get_signing_key: Mock) -> None:
        get_signing_key.return_value = SimpleNamespace(key=self.public_key)

        with self.assertRaises(HTTPException) as raised:
            get_current_user(
                HTTPAuthorizationCredentials(
                    scheme="Bearer", credentials=self.token(name=["not-a-string"])
                )
            )

        self.assertEqual(raised.exception.status_code, 401)

    @patch.object(jwks_client, "get_signing_key_from_jwt")
    def test_wrong_issuer_is_rejected(self, get_signing_key: Mock) -> None:
        get_signing_key.return_value = SimpleNamespace(key=self.public_key)

        with self.assertRaises(HTTPException) as raised:
            get_current_user(
                HTTPAuthorizationCredentials(
                    scheme="Bearer", credentials=self.token(iss="https://wrong.example")
                )
            )

        self.assertEqual(raised.exception.status_code, 401)


class ApiAuthTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)
        app.dependency_overrides.clear()

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    def test_current_user_requires_authentication_at_http_boundary(self) -> None:
        response = self.client.get("/v1/users/me")
        self.assertEqual(response.status_code, 401)

    def test_current_user_response_is_serialized_at_http_boundary(self) -> None:
        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            id="user-123", email="user@example.com", name="Test User"
        )
        response = self.client.get("/v1/users/me")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"id": "user-123", "email": "user@example.com", "name": "Test User"},
        )


class SettingsTest(unittest.TestCase):
    def settings(self, **overrides: Any) -> Settings:
        values = {
            "BACKEND_DATABASE_URL": "postgresql://backend_app:secure-password@localhost:5432/backend_db",
            "BETTER_AUTH_JWKS_URL": "https://auth.example.com/api/auth/jwks",
            "BETTER_AUTH_URL": "https://auth.example.com",
            "FASTAPI_ENV": "production",
        }
        values.update(overrides)
        return Settings(_env_file=None, **values)  # type: ignore[call-arg]

    def test_production_requires_non_default_auth_urls(self) -> None:
        with self.assertRaises(ValueError):
            self.settings(BETTER_AUTH_URL="http://localhost:5173")
        with self.assertRaises(ValueError):
            self.settings(BETTER_AUTH_JWKS_URL="http://auth.example.com/api/auth/jwks")

    def test_production_rejects_documented_database_password_placeholders(self) -> None:
        with self.assertRaises(ValueError):
            self.settings(
                BACKEND_DATABASE_URL=(
                    "postgresql://backend_app:change-this-backend-password@"
                    "localhost:5432/backend_db"
                )
            )


if __name__ == "__main__":
    unittest.main()
