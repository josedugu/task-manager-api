"""
Database package.
Centraliza imports de componentes de base de datos.
"""

# Importar configuración base
from src.db.activity_logs import ActivityLog
from src.db.base import AsyncSessionLocal, Base, engine
from src.db.comments import Comment
from src.db.notifications import Notification
from src.db.tasks import Task
from src.db.user_roles import UserRole

# Importar modelos
from src.db.users import User

# Exportar todo
__all__ = [
    # Base
    "Base",
    "engine",
    "AsyncSessionLocal",
    # Models
    "User",
    "Task",
    "Comment",
    "ActivityLog",
    "Notification",
    # Enums
    "UserRole",
]
