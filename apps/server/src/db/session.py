"""Async PostgreSQL database sessions."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.config import settings

engine = create_async_engine(
    str(settings.DATABASE_URL),
    pool_pre_ping=True,
)
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@asynccontextmanager
async def _managed_session() -> AsyncGenerator[AsyncSession]:
    """Provide one session and roll it back if its caller fails."""

    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def get_db_session() -> AsyncGenerator[AsyncSession]:
    """Provide a database session for FastAPI dependency injection."""

    async with _managed_session() as session:
        yield session


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession]:
    """Provide a database session for non-request application code."""

    async with _managed_session() as session:
        yield session


async def close_db() -> None:
    """Dispose the application database engine."""

    await engine.dispose()
