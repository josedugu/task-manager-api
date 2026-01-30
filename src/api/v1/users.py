"""
Users router (API v1).
Endpoints: List users (for dropdowns)
"""

from fastapi import APIRouter
from sqlalchemy import select

from src.api.dependencies import CurrentUser, DatabaseDep
from src.db import User
from src.schemas import UserSummary

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=list[UserSummary])
async def list_users(current_user: CurrentUser, db: DatabaseDep) -> list[UserSummary]:
    """
    List all users (ID, Username).
    Useful for populating 'Assign To' dropdowns.
    """
    # In a real app, we might filter this or paginate.
    result = await db.execute(select(User).where(User.is_active))
    users = result.scalars().all()
    return [UserSummary.model_validate(u) for u in users]
