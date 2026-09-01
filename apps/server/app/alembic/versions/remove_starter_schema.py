"""Remove the starter application's tables."""

from collections.abc import Sequence

from alembic import op


revision: str = "remove_starter_schema"
down_revision: str | None = "fe56fa70289e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_table("item")
    op.drop_table("user")


def downgrade() -> None:
    raise RuntimeError("The starter schema removal migration cannot be downgraded")
