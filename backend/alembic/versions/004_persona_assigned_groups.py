"""Add assigned_group_ids to personas."""

from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("personas", sa.Column("assigned_group_ids", sa.JSON(), server_default="[]"))


def downgrade() -> None:
    op.drop_column("personas", "assigned_group_ids")