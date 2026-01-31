"""
Security Middleware Module
==========================

Provides security-related middleware for the FastAPI application:
- Rate Limiting (DDoS protection, brute force prevention)
- Security Headers (HSTS, CSP, X-Frame-Options, etc.)

Usage:
    from src.core.security_middleware import setup_security_middleware
    setup_security_middleware(app)
"""

import logging
from typing import Callable

from fastapi import FastAPI, Request, Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Rate Limiter Configuration
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000/hour"],  # Default limit for all endpoints
    storage_uri="memory://",  # Use Redis in production: "redis://localhost:6379"
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security headers to all responses.

    Headers added:
    - Strict-Transport-Security: Enforces HTTPS
    - X-Content-Type-Options: Prevents MIME sniffing
    - X-Frame-Options: Prevents clickjacking
    - X-XSS-Protection: Legacy XSS protection
    - Content-Security-Policy: Prevents injection attacks
    - Referrer-Policy: Controls referrer information
    - Permissions-Policy: Restricts browser APIs
    - Cache-Control: Prevents caching of sensitive data
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # HSTS - Force HTTPS (1 year)
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Legacy XSS protection (for older browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Content Security Policy - Restrictive default
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "font-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )

        # Control referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Restrict browser APIs
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), payment=()"
        )

        # Prevent caching of API responses (for sensitive data)
        if "/api/" in request.url.path:
            response.headers["Cache-Control"] = (
                "no-store, no-cache, must-revalidate, private"
            )
            response.headers["Pragma"] = "no-cache"

        return response


def setup_security_middleware(app: FastAPI) -> None:
    """
    Configure all security middleware for the application.

    This function should be called during app startup to enable:
    - Rate limiting (with SlowAPI)
    - Security headers
    - Request logging for security events

    Args:
        app: The FastAPI application instance
    """
    # Add rate limiter state
    app.state.limiter = limiter

    # Add rate limit exceeded handler
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Add security headers middleware
    app.add_middleware(SecurityHeadersMiddleware)

    logger.info("Security middleware configured successfully")


# Rate limit decorators for use in routes
# Example usage:
#   @router.post("/login")
#   @limiter.limit("5/minute")
#   async def login(...): ...

# Predefined rate limits for common use cases
RATE_LIMITS = {
    "login": "5/minute",  # 5 login attempts per minute
    "register": "3/hour",  # 3 registrations per hour
    "password_reset": "3/hour",  # 3 password reset requests per hour
    "api_default": "100/minute",  # 100 API calls per minute
    "search": "30/minute",  # 30 search requests per minute
    "create": "50/hour",  # 50 create operations per hour
}
