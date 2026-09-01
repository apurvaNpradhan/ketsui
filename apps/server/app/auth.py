from threading import Lock
from time import monotonic
from typing import Annotated, Any

import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient, PyJWKClientError
from pydantic import BaseModel, ValidationError

from app.config import settings

bearer_scheme = HTTPBearer(auto_error=False)
jwks_client = PyJWKClient(
    str(settings.BETTER_AUTH_JWKS_URL),
    headers={"User-Agent": "Ketsui-Backend/1.0"},
    timeout=5,
)
_jwks_refresh_lock = Lock()
_last_failed_jwks_refresh = 0.0
# ponytail: global cooldown bounds JWKS abuse; use a bounded per-kid cache if rotation latency matters.
_JWKS_REFRESH_COOLDOWN_SECONDS = 5.0


class CurrentUser(BaseModel):
    id: str
    email: str
    name: str


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Security(bearer_scheme)
    ],
) -> CurrentUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise credentials_exception

    token = credentials.credentials

    try:
        global _last_failed_jwks_refresh
        with _jwks_refresh_lock:
            if monotonic() - _last_failed_jwks_refresh < _JWKS_REFRESH_COOLDOWN_SECONDS:
                raise jwt.InvalidTokenError("JWKS refresh temporarily unavailable")
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            _last_failed_jwks_refresh = 0.0
        claims: dict[str, Any] = jwt.decode(
            token,
            signing_key.key,
            algorithms=["EdDSA"],
            issuer=str(settings.BETTER_AUTH_URL).rstrip("/"),
            audience=str(settings.BETTER_AUTH_URL).rstrip("/"),
            options={"require": ["sub", "email", "name", "iss", "aud", "exp"]},
        )
        return CurrentUser(
            id=claims["sub"],
            email=claims["email"],
            name=claims["name"],
        )
    except PyJWKClientError as exc:
        _last_failed_jwks_refresh = monotonic()
        raise credentials_exception from exc
    except (jwt.PyJWTError, KeyError, TypeError, ValidationError, ValueError) as exc:
        raise credentials_exception from exc


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
