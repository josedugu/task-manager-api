"""
Database base configuration.
Contiene: Engine, Session, Base, class
"""

import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from src.core.config import settings

# Engine - SQL echo disabled in production for security
# Set SQL_ECHO=true in .env for development debugging
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    future=True,
    pool_pre_ping=True,
)

# Session
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# Base class para todos los models
class Base(DeclarativeBase):
    """
    Base class para todos los modelos SQLAlchemy.
    Todos los modelos deben heredar de esta clase.
    """

    pass
