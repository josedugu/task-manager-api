"""
User roles enum.
Define los roles disponibles en el sistema.
"""

from enum import Enum as PyEnum


class UserRole(str, PyEnum):
    """
    Roles de usuario en el sistema.

    - OWNER: Acceso completo a todas las tareas
    - MEMBER: Solo acceso a sus propias tareas
    """

    OWNER = "owner"
    MEMBER = "member"
