"""Authentication endpoints."""

from fastapi import APIRouter

from src.auth.dependencies import CurrentUserDep
from src.auth.schemas import CurrentUser

router = APIRouter(prefix="/users", tags=["auth"])


@router.get("/me")
def get_current_user(user: CurrentUserDep) -> CurrentUser:
    return user
