from fastapi import APIRouter

from app.auth import CurrentUser, CurrentUserDep

router = APIRouter(prefix="/users", tags=["auth"])


@router.get("/me")
def get_current_user(user: CurrentUserDep) -> CurrentUser:
    return user
