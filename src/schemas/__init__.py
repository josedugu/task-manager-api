"""
Pydantic schemas package.

Orquesta todos los schemas para request/response validation.
"""

# Auth schemas
# Activity Log schemas
from src.schemas.activity_log import ActivityLogResponse
from src.schemas.auth import LoginRequest, Token, TokenData

# Comment schemas
from src.schemas.comment import CommentCreate, CommentResponse

# Task schemas
from src.schemas.task import TaskCreate, TaskResponse, TaskUpdate

# User schemas
from src.schemas.user import UserCreate, UserLogin, UserResponse, UserSummary

__all__ = [
    # Auth
    "LoginRequest",
    "Token",
    "TokenData",
    # User
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "UserSummary",
    # Task
    "TaskCreate",
    "TaskUpdate",
    "TaskResponse",
    # Comment
    "CommentCreate",
    "CommentResponse",
    # Activity
    "ActivityLogResponse",
]
