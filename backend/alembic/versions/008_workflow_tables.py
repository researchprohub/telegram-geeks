"""Add workflow tables: pipeline_runs, target_databases, campaigns, campaign_targets, account folder

Revision ID: 008
Revises: 007
Create Date: 2026-08-22
"""

from alembic import op
import sqlalchemy as sa

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use inspector to safely create tables/columns if they don't already exist
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    # ── pipeline_runs ─────────────────────────────────────────────────────
    if "pipeline_runs" not in existing_tables:
        op.create_table(
            "pipeline_runs",
            sa.Column("id", sa.String(64), primary_key=True),
            sa.Column("stages", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("triggered_by", sa.Integer(), nullable=True),
            sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
            sa.Column("progress", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("logs", sa.JSON(), nullable=True, server_default="[]"),
            sa.Column("current_step", sa.String(50), nullable=True),
            sa.Column("result", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
        )

    # ── target_databases ──────────────────────────────────────────────────
    if "target_databases" not in existing_tables:
        op.create_table(
            "target_databases",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("name", sa.String(150), nullable=False),
            sa.Column("source", sa.String(300), nullable=True),
            sa.Column("method", sa.String(50), nullable=True),
            sa.Column("count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("filters", sa.JSON(), nullable=True),
            sa.Column("data", sa.JSON(), nullable=True, server_default="[]"),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("owner_id", sa.Integer(), nullable=True),
        )

    # ── account folder and device columns on accounts ─────────────────────
    if "accounts" in existing_tables:
        acc_columns = [c["name"] for c in inspector.get_columns("accounts")]
        if "folder" not in acc_columns:
            op.add_column("accounts", sa.Column("folder", sa.String(30), nullable=True, server_default="active"))
        if "username" not in acc_columns:
            op.add_column("accounts", sa.Column("username", sa.String(100), nullable=True))
        if "first_name" not in acc_columns:
            op.add_column("accounts", sa.Column("first_name", sa.String(100), nullable=True))
        if "is_premium" not in acc_columns:
            op.add_column("accounts", sa.Column("is_premium", sa.Boolean(), server_default="false"))
        if "device_model" not in acc_columns:
            op.add_column("accounts", sa.Column("device_model", sa.String(100), nullable=True))
        if "os_version" not in acc_columns:
            op.add_column("accounts", sa.Column("os_version", sa.String(100), nullable=True))
        if "app_version" not in acc_columns:
            op.add_column("accounts", sa.Column("app_version", sa.String(50), nullable=True))
        if "lang_code" not in acc_columns:
            op.add_column("accounts", sa.Column("lang_code", sa.String(20), nullable=True))
        if "system_lang_code" not in acc_columns:
            op.add_column("accounts", sa.Column("system_lang_code", sa.String(20), nullable=True))

    # ── campaign columns on campaigns ─────────────────────────────────────
    if "campaigns" in existing_tables:
        camp_columns = [c["name"] for c in inspector.get_columns("campaigns")]
        if "target_db_id" not in camp_columns:
            op.add_column("campaigns", sa.Column("target_db_id", sa.Integer(), nullable=True))
        if "message_template" not in camp_columns:
            op.add_column("campaigns", sa.Column("message_template", sa.Text(), nullable=True))
        if "gpt_spin" not in camp_columns:
            op.add_column("campaigns", sa.Column("gpt_spin", sa.Boolean(), server_default="false"))
        if "delay_min" not in camp_columns:
            op.add_column("campaigns", sa.Column("delay_min", sa.Integer(), server_default="30"))
        if "delay_max" not in camp_columns:
            op.add_column("campaigns", sa.Column("delay_max", sa.Integer(), server_default="120"))
        if "max_per_day" not in camp_columns:
            op.add_column("campaigns", sa.Column("max_per_day", sa.Integer(), server_default="50"))
        if "media_path" not in camp_columns:
            op.add_column("campaigns", sa.Column("media_path", sa.String(512), nullable=True))
        if "tone" not in camp_columns:
            op.add_column("campaigns", sa.Column("tone", sa.String(64), server_default="natural"))
        if "sent" not in camp_columns:
            op.add_column("campaigns", sa.Column("sent", sa.Integer(), server_default="0"))
        if "failed" not in camp_columns:
            op.add_column("campaigns", sa.Column("failed", sa.Integer(), server_default="0"))
        if "completed_at" not in camp_columns:
            op.add_column("campaigns", sa.Column("completed_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    pass
