"""
Task Pydantic schemas.
Define la estructura de datos para Task requests/responses.
"""

from datetime import datetime

from pydantic import BaseModel, Field


# Base schema con campos comunes
class TaskBase(BaseModel):
    """Campos base compartidos entre schemas."""

    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=1000)
    status: str = Field("todo", pattern="^(todo|in_progress|done)$")
    due_date: datetime | None = None
    assigned_to_id: int | None = None


# Schema para crear tarea (request)
class TaskCreate(TaskBase):
    """Schema para POST /tasks."""

    pass  # Hereda todos los campos de TaskBase


# Schema para actualizar tarea (request)
class TaskUpdate(BaseModel):
    """Schema para PATCH /tasks/{task_id}."""

    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=1000)
    status: str | None = Field(None, pattern="^(todo|in_progress|done)$")
    due_date: datetime | None = None
    assigned_to_id: int | None = None


# Schema para respuesta (response)
class TaskResponse(TaskBase):
    """Schema para responses que devuelven una Task."""

    id: int
    owner_id: int
    assigned_to_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}  # Permite crear desde ORM models
