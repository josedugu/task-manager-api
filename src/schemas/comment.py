from datetime import datetime

from pydantic import BaseModel, Field

from src.schemas.user import UserSummary


class CommentBase(BaseModel):
    content: str = Field(..., min_length=1)


class CommentCreate(CommentBase):
    pass


class CommentResponse(CommentBase):
    id: int
    task_id: int
    user_id: int
    user: UserSummary
    created_at: datetime

    model_config = {"from_attributes": True}
