import os
import unittest
from types import SimpleNamespace
from typing import Any
from unittest.mock import Mock, patch

os.environ.setdefault(
    "DATABASE_URL", "postgresql://backend_app:password@localhost:5432/backend_db"
)
os.environ.setdefault("BETTER_AUTH_JWKS_URL", "http://localhost:5173/api/auth/jwks")
os.environ.setdefault("BETTER_AUTH_URL", "http://localhost:5173")

import jwt
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.auth import get_current_user, jwks_client


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


if __name__ == "__main__":
    unittest.main()
