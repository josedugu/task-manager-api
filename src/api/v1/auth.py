"""
Authentication router (API v1).
Endpoints: /api/v1/auth/login, /api/v1/auth/register
"""

from fastapi import APIRouter, status

from src.api.dependencies import DatabaseDep
from src.schemas import LoginRequest, Token, UserCreate, UserResponse
from src.services import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register(user_data: UserCreate, db: DatabaseDep) -> UserResponse:
    """
    Registra un nuevo usuario.

    Args:
        user_data: Datos del usuario (username, email, password)
        db: Sesión de base de datos

    Returns:
        UserResponse: Usuario creado

    Raises:
        400: Username o email ya registrados
    """
    return await AuthService.register(user_data, db)


@router.post("/login", response_model=Token)
async def login(credentials: LoginRequest, db: DatabaseDep) -> Token:
    """
    Autentica un usuario y retorna JWT token.

    Args:
        credentials: Username/email y password
        db: Sesión de base de datos

    Returns:
        Token: JWT access token

    Raises:
        401: Credenciales inválidas
        403: Usuario inactivo
    """
    return await AuthService.login(credentials.username, credentials.password, db)
