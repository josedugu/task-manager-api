"""
User model.
Define la estructura de la tabla users en la base de datos.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base
from src.db.user_roles import UserRole

if TYPE_CHECKING:
    from src.db.tasks import Task


class User(Base):
    """
    User model.
    Representa un usuario en el sistema.
    """

    __tablename__ = "users"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Authentication
    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )

    email: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )

    hashed_password: Mapped[str] = mapped_column(String(128), nullable=False)

    # User metadata
    role: Mapped[str] = mapped_column(
        String(20), default=UserRole.MEMBER.value, nullable=False
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="owner",
        foreign_keys="Task.owner_id",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    assigned_tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="assigned_to",
        foreign_keys="Task.assigned_to_id",
        lazy="selectin",
    )

    # Helper methods
    def is_owner(self) -> bool:
        """Verifica si el usuario tiene rol de owner."""
        return self.role == UserRole.OWNER.value

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"
