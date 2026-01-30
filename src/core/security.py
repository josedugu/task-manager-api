"""
Security utilities.
Contiene funciones para hashing de passwords y manejo de JWT tokens.
"""

from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from src.core.config import settings

# === PASSWORD HASHING ===


def hash_password(password: str) -> str:
    """
    Hash de password usando bcrypt.

    Args:
        password: Password en texto plano

    Returns:
        Password hasheado
    """
    # Bcrypt requiere bytes
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)

    # Retornar como string para almacenar en DB
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si un password coincide con su hash.

    Args:
        plain_password: Password en texto plano
        hashed_password: Password hasheado

    Returns:
        True si coinciden, False si no
    """
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")

    return bcrypt.checkpw(password_bytes, hashed_bytes)


# === JWT TOKEN MANAGEMENT ===


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Crea un JWT access token.

    Args:
        data: Datos a encodear en el token (ej: {"sub": "user_id"})
        expires_delta: Tiempo de expiración
            (default: settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    Returns:
        JWT token string
    """
    to_encode = data.copy()

    # Configurar tiempo de expiración
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})

    # Encodear JWT
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict | None:
    """
    Decodea y valida un JWT token.

    Args:
        token: JWT token string

    Returns:
        Payload del token si es válido, None si es inválido o expirado
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
