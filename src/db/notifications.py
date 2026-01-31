"""
Notification model.
Define la tabla 'notifications' para notificaciones in-app.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base

if TYPE_CHECKING:
    from src.db.tasks import Task
    from src.db.users import User


class Notification(Base):
    """
    Notification model.

    Representa una notificación in-app para un usuario.
    Tipos: 'task_assigned', 'task_comment', 'task_updated', 'due_soon', 'overdue'
    """

    __tablename__ = "notifications"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign keys
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    task_id: Mapped[int | None] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True
    )

    # Notification fields
    type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # task_assigned, task_comment, task_updated, due_soon, overdue

    title: Mapped[str] = mapped_column(String(200), nullable=False)

    message: Mapped[str] = mapped_column(String(500), nullable=False)

    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", lazy="selectin")

    task: Mapped["Task"] = relationship("Task", lazy="selectin")

    def __repr__(self) -> str:
        return (
            f"<Notification(id={self.id}, type='{self.type}', is_read={self.is_read})>"
        )
