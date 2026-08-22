"""Add proxies table and proxy_id FK on accounts

Revision ID: 010_proxy_table
Revises: 009_booster_inviter_tables
Create Date: 2026-08-22
"""

from alembic import op
import sqlalchemy as sa

revision      = "010_proxy_table"
down_revision = "009_booster_inviter_tables"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    # ── proxies ───────────────────────────────────────────────────────────
    # In SQLite / dynamic env, table might already exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "proxies" not in tables:
        op.create_table(
            "proxies",
            sa.Column("id",           sa.Integer(),    primary_key=True, autoincrement=True),
            sa.Column("host",         sa.String(255),  nullable=False),
            sa.Column("port",         sa.Integer(),    nullable=False),
            sa.Column("username",     sa.String(255),  nullable=True),
            sa.Column("password",     sa.String(255),  nullable=True),
            sa.Column("proxy_type",   sa.String(16),   nullable=False, server_default="socks5"),
            sa.Column("status",       sa.String(20),   nullable=False, server_default="untested"),
            sa.Column("latency_ms",   sa.Integer(),    nullable=True),
            sa.Column("fail_count",   sa.Integer(),    server_default="0"),
            sa.Column("country",      sa.String(4),    nullable=True),
            sa.Column("last_checked", sa.DateTime(),   nullable=True),
            sa.Column("added_at",     sa.DateTime(),   nullable=False),
        )
        op.create_index("ix_proxies_status",  "proxies", ["status"])
        op.create_index("ix_proxies_latency", "proxies", ["latency_ms"])

    # ── Add columns to accounts if missing ────────────────────────────────
    if "accounts" in tables:
        columns = [c["name"] for c in inspector.get_columns("accounts")]
        if "proxy_id" not in columns:
            op.add_column(
                "accounts",
                sa.Column("proxy_id", sa.Integer(), nullable=True),
            )
        if "country" not in columns:
            op.add_column(
                "accounts",
                sa.Column("country", sa.String(4), nullable=True),
            )
        if "last_check_at" not in columns:
            op.add_column(
                "accounts",
                sa.Column("last_check_at", sa.DateTime(), nullable=True),
            )


def downgrade() -> None:
    pass
