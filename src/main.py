"""
Main FastAPI application (ASYNC).
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.v1 import auth, tasks
from src.core.config import settings
from src.core.logging_config import setup_logging
from src.db import Base, engine

# Setup logging
setup_logging(log_level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager.
    Crea las tablas al iniciar la app y cierra conexiones al terminar.
    """
    # Startup: crear tablas
    logger.info("🚀 Starting Task Manager API")
    logger.info(f"Environment: {settings.PROJECT_NAME}")
    logger.info(f"Database: {settings.DATABASE_URL.split('@')[-1]}")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables created/verified")

    yield

    # Shutdown: cerrar conexiones
    logger.info("👋 Shutting down Task Manager API")
    await engine.dispose()
    logger.info("✅ Database connections closed")


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Task Manager API - Take-home assignment",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")


# Root endpoint
@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Task Manager API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",
    }
