"""
Notification schemas for request/response validation.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class NotificationBase(BaseModel):
    """Base notification schema."""

    type: str = Field(..., description="Notification type")
    title: str = Field(..., max_length=200)
    message: str = Field(..., max_length=500)


class NotificationCreate(NotificationBase):
    """Schema for creating a notification."""

    user_id: int
    task_id: int | None = None


class NotificationResponse(NotificationBase):
    """Schema for notification response."""

    id: int
    user_id: int
    task_id: int | None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationMarkRead(BaseModel):
    """Schema for marking notification as read."""

    is_read: bool = True
