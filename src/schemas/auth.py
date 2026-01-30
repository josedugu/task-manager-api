"""
Authentication Pydantic schemas.
Define la estructura para login, tokens, y respuestas de auth.
"""

from pydantic import BaseModel


class LoginRequest(BaseModel):
    """Schema para POST /auth/login."""

    username: str  # Puede ser username o email
    password: str


class Token(BaseModel):
    """Schema para response de login exitoso."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema para datos decodificados del JWT."""

    user_id: int | None = None
