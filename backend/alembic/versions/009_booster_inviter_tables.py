"""Add warmup_jobs, invite_jobs, invite_logs tables

Revision ID: 009
Revises: 008
Create Date: 2026-08-22
"""

from alembic import op
import sqlalchemy as sa

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    # ── warmup_jobs ───────────────────────────────────────────────────────
    if "warmup_jobs" not in existing_tables:
        op.create_table(
            "warmup_jobs",
            sa.Column("id", sa.String(64), primary_key=True),
            sa.Column("account_id", sa.String(64), nullable=False),
            sa.Column("status", sa.String(20), nullable=False, server_default="running"),
            sa.Column("duration_days", sa.Integer(), nullable=False, server_default="7"),
            sa.Column("interval_min", sa.Integer(), nullable=False, server_default="30"),
            sa.Column("interval_max", sa.Integer(), nullable=False, server_default="120"),
            sa.Column("actions", sa.JSON(), nullable=True),
            sa.Column("partner_accounts", sa.JSON(), nullable=True),
            sa.Column("actions_completed", sa.Integer(), server_default="0"),
            sa.Column("logs", sa.JSON(), nullable=True, server_default="[]"),
            sa.Column("failure_reason", sa.Text(), nullable=True),
            sa.Column("started_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("last_action_at", sa.DateTime(), nullable=True),
            sa.Column("ends_at", sa.DateTime(), nullable=True),
            sa.Column("stopped_at", sa.DateTime(), nullable=True),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_warmup_jobs_account", "warmup_jobs", ["account_id"])
        op.create_index("ix_warmup_jobs_status", "warmup_jobs", ["status"])

    # ── invite_jobs ───────────────────────────────────────────────────────
    if "invite_jobs" not in existing_tables:
        op.create_table(
            "invite_jobs",
            sa.Column("id", sa.String(64), primary_key=True),
            sa.Column("target_group", sa.String(255), nullable=False),
            sa.Column("total_targets", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("method", sa.String(32), nullable=False, server_default="standard"),
            sa.Column("status", sa.String(20), nullable=False, server_default="running"),
            sa.Column("invited", sa.Integer(), server_default="0"),
            sa.Column("failed", sa.Integer(), server_default="0"),
            sa.Column("started_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_invite_jobs_status", "invite_jobs", ["status"])

    # ── invite_logs ───────────────────────────────────────────────────────
    if "invite_logs" not in existing_tables:
        op.create_table(
            "invite_logs",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("job_id", sa.String(64), nullable=False),
            sa.Column("user_id", sa.BigInteger(), nullable=True),
            sa.Column("account_id", sa.String(64), nullable=True),
            sa.Column("status", sa.String(64), nullable=False),
            sa.Column("attempted_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
        )
        op.create_index("ix_invite_logs_job", "invite_logs", ["job_id"])


def downgrade() -> None:
    pass
