from typing import Annotated, Any

import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from pydantic import BaseModel, ValidationError

from app.config import settings

bearer_scheme = HTTPBearer(auto_error=False)
jwks_client = PyJWKClient(settings.BETTER_AUTH_JWKS_URL)


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
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        claims: dict[str, Any] = jwt.decode(
            token,
            signing_key.key,
            algorithms=["EdDSA"],
            issuer=settings.BETTER_AUTH_URL,
            audience=settings.BETTER_AUTH_URL,
            options={"require": ["sub", "email", "name", "iss", "aud", "exp"]},
        )
        return CurrentUser(
            id=claims["sub"],
            email=claims["email"],
            name=claims["name"],
        )
    except (jwt.PyJWTError, KeyError, TypeError, ValidationError, ValueError) as exc:
        raise credentials_exception from exc


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
