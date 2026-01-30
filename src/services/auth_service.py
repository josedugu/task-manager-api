"""
Authentication service.
Contiene lógica de negocio para autenticación (login, register).
"""

import logging

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import create_access_token, hash_password, verify_password
from src.db import User, UserRole
from src.schemas import Token, UserCreate, UserResponse

logger = logging.getLogger(__name__)


class AuthService:
    """Service para operaciones de autenticación."""

    @staticmethod
    async def register(user_data: UserCreate, db: AsyncSession) -> UserResponse:
        """
        Registra un nuevo usuario.

        Args:
            user_data: Datos del usuario a crear
            db: Sesión de base de datos

        Returns:
            UserResponse: Usuario creado

        Raises:
            HTTPException: Si el username o email ya existen
        """
        logger.info(f"Registration attempt for username: {user_data.username}")

        # Verificar si username ya existe
        result = await db.execute(
            select(User).where(User.username == user_data.username)
        )
        if result.scalar_one_or_none():
            logger.warning(
                f"Registration failed: Username already exists: {user_data.username}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered",
            )

        # Verificar si email ya existe
        result = await db.execute(select(User).where(User.email == user_data.email))
        if result.scalar_one_or_none():
            logger.warning(
                f"Registration failed: Email already exists: {user_data.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Crear nuevo usuario
        hashed_pwd = hash_password(user_data.password)
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_pwd,
            role=UserRole.MEMBER.value,  # Default role
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        logger.info(
            f"✅ User registered successfully: {new_user.username} (ID: {new_user.id})"
        )

        return UserResponse.model_validate(new_user)

    @staticmethod
    async def login(username: str, password: str, db: AsyncSession) -> Token:
        """
        Autentica un usuario y retorna JWT token.

        Args:
            username: Username o email
            password: Password en texto plano
            db: Sesión de base de datos

        Returns:
            Token: JWT access token

        Raises:
            HTTPException: Si las credenciales son inválidas
        """
        logger.info(f"Login attempt for: {username}")

        # Buscar usuario por username o email
        result = await db.execute(
            select(User).where((User.username == username) | (User.email == username))
        )
        user = result.scalar_one_or_none()

        # Validar credenciales
        if not user or not verify_password(password, user.hashed_password):
            logger.warning(f"❌ Login failed: Invalid credentials for {username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            logger.warning(f"❌ Login failed: Inactive user {username}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user",
            )

        # Crear JWT token
        access_token = create_access_token(data={"sub": str(user.id)})

        logger.info(f"✅ Login successful: {user.username} (ID: {user.id})")

        return Token(access_token=access_token, token_type="bearer")
