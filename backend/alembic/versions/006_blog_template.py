"""Add template column for Elementor-style single-post layouts."""

from alembic import op
import sqlalchemy as sa

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("blog_posts", sa.Column("template", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("blog_posts", "template")