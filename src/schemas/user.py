"""
User Pydantic schemas.
Define la estructura de datos para User requests/responses.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# Base schema con campos comunes
class UserBase(BaseModel):
    """Campos base compartidos entre schemas."""

    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


# Schema para crear usuario (request)
class UserCreate(UserBase):
    """Schema para POST /auth/register."""

    password: str = Field(..., min_length=8, max_length=100)


# Schema para respuesta (response)
class UserResponse(UserBase):
    """Schema para responses que devuelven un User."""

    id: int
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}  # Permite crear desde ORM models


# Schema para login (solo username/email + password)
class UserLogin(BaseModel):
    """Schema para POST /auth/login."""

    username: str  # Puede ser username o email
    password: str
