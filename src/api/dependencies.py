"""
FastAPI dependencies (ASYNC).
"""

from typing import Annotated, AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import decode_access_token
from src.db import AsyncSessionLocal, User

# Security scheme para JWT
security = HTTPBearer()


# === DATABASE DEPENDENCY ===


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency que provee una sesión async de base de datos.

    Yields:
        AsyncSession: Sesión de SQLAlchemy
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# Type alias para facilitar uso en routers
DatabaseDep = Annotated[AsyncSession, Depends(get_db)]


# === AUTHENTICATION DEPENDENCY ===


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: DatabaseDep,
) -> User:
    """
    Dependency que extrae y valida el JWT token.
    Retorna el usuario actual autenticado.

    Args:
        credentials: Bearer token del header Authorization
        db: Sesión de base de datos

    Returns:
        User: Usuario autenticado

    Raises:
        HTTPException: Si el token es inválido o el usuario no existe
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decodear JWT
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    # Extraer user_id del payload
    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Buscar usuario en DB (ASYNC)
    try:
        user_id_int = int(user_id)
    except ValueError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id_int))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    return user


# Type alias para facilitar uso en routers
CurrentUser = Annotated[User, Depends(get_current_user)]
