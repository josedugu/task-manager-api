"""
Authentication router (API v1).
Endpoints: /api/v1/auth/login, /api/v1/auth/register

Rate Limits:
    - login: 5 requests per minute (brute force protection)
    - register: 3 requests per hour (abuse prevention)
"""

from fastapi import APIRouter, Request, status

from src.api.dependencies import DatabaseDep
from src.core.security_middleware import limiter
from src.schemas import LoginRequest, Token, UserCreate, UserResponse
from src.services import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit("3/hour")
async def register(
    request: Request, user_data: UserCreate, db: DatabaseDep
) -> UserResponse:
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
@limiter.limit("5/minute")
async def login(
    request: Request, credentials: LoginRequest, db: DatabaseDep
) -> Token:
    """
    Autentica un usuario y retorna JWT token.

    Args:
        request: HTTP request (required for rate limiting)
        credentials: Username/email y password
        db: Sesión de base de datos

    Returns:
        Token: JWT access token

    Raises:
        401: Credenciales inválidas
        403: Usuario inactivo
        429: Too many requests (rate limit exceeded)
    """
    return await AuthService.login(credentials.username, credentials.password, db)
