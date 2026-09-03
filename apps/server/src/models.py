"""Application model registry for Alembic."""

from src.db.base import Base

# Import feature models here when they are added so Alembic can discover them.
__all__ = ["Base"]
