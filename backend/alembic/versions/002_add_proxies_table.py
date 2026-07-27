"""Add proxies table."""

from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "proxies",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("provider", sa.String(50), nullable=False, server_default="manual"),
        sa.Column("proxy_type", sa.String(10), nullable=False, server_default="socks5"),
        sa.Column("host", sa.String(100), nullable=False),
        sa.Column("port", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(100), nullable=True),
        sa.Column("password", sa.String(200), nullable=True),
        sa.Column("country", sa.String(4), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="untested"),
        sa.Column("last_checked", sa.DateTime(timezone=True), nullable=True),
        sa.Column("response_time_ms", sa.Float(), nullable=True),
        sa.Column("success_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fail_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("allocated_to_account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=True),
        sa.Column("allocated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("source", sa.String(30), nullable=False, server_default="user_added"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cost", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("proxies")
