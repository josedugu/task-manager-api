"""
Task model.
Define la tabla 'tasks' y sus relaciones.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base

if TYPE_CHECKING:
    from src.db.users import User


class Task(Base):
    """
    Task model.

    Representa una tarea asignada a un usuario.
    Estados posibles: 'todo', 'in_progress', 'done'
    """

    __tablename__ = "tasks"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Task fields
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="todo"
    )  # "todo", "in_progress", "done"

    # Foreign keys
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    assigned_to_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Timestamps & Metadata
    due_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    owner: Mapped["User"] = relationship(
        "User", back_populates="tasks", lazy="selectin", foreign_keys=[owner_id]
    )

    assigned_to: Mapped["User"] = relationship(
        "User", lazy="selectin", foreign_keys=[assigned_to_id]
    )

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title='{self.title}', status='{self.status}')>"
