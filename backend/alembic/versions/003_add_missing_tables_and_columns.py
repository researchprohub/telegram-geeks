"""Add missing tables, sprint-01 columns, and fix metadata→meta rename."""

from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── Add sprint-01 columns to accounts ─────────────────
    op.add_column("accounts", sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True))
    op.add_column("accounts", sa.Column("spamblock_until", sa.DateTime(), nullable=True))
    op.add_column("accounts", sa.Column("health_check_at", sa.DateTime(), nullable=True))
    op.add_column("accounts", sa.Column("health_score", sa.Integer(), nullable=True))
    op.add_column("accounts", sa.Column("dc_id", sa.Integer(), nullable=True))
    op.add_column("accounts", sa.Column("ping_ms", sa.Integer(), nullable=True))
    op.add_column("accounts", sa.Column("last_known_ip", sa.String(45), nullable=True))
    op.add_column("accounts", sa.Column("last_proxy", sa.String(200), nullable=True))
    op.add_column("accounts", sa.Column("ip_country", sa.String(100), nullable=True))

    # ─── Add sprint-01 columns to personas ─────────────────
    op.add_column("personas", sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True))
    op.add_column("personas", sa.Column("soul_prompt", sa.Text(), nullable=True))
    op.add_column("personas", sa.Column("soul_prompt_data", sa.JSON(), server_default="{}"))
    op.add_column("personas", sa.Column("group_prompts", sa.JSON(), server_default="{}"))
    op.add_column("personas", sa.Column("version", sa.Integer(), server_default="1"))
    op.add_column("personas", sa.Column("template_source", sa.String(100), nullable=True))

    # ─── Rename metadata → meta in conversations ───────────
    op.alter_column("conversations", "metadata", new_column_name="meta")

    # ─── Rename metadata → meta in analytics ───────────────
    op.alter_column("analytics", "metadata", new_column_name="meta")

    # ─── Create spintax_templates ──────────────────────────
    op.create_table(
        "spintax_templates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("template_text", sa.Text(), nullable=False),
        sa.Column("tone", sa.String(50), server_default="casual"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # ─── Create system_settings ────────────────────────────
    op.create_table(
        "system_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(100), unique=True, nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # ─── Create subscriptions ─────────────────────────────
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("plan_tier", sa.String(20), server_default="starter"),
        sa.Column("status", sa.String(20), server_default="active"),
        sa.Column("started_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("billing_cycle", sa.String(10), server_default="monthly"),
        sa.Column("auto_renew", sa.Boolean(), server_default="false"),
        sa.Column("max_accounts", sa.Integer(), server_default="5"),
        sa.Column("max_campaigns", sa.Integer(), server_default="3"),
        sa.Column("team_seats", sa.Integer(), server_default="1"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # ─── Create orders ─────────────────────────────────────
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("order_id", sa.String(100), unique=True, nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(10), server_default="USD"),
        sa.Column("crypto_currency", sa.String(10), nullable=True),
        sa.Column("crypto_amount", sa.Float(), nullable=True),
        sa.Column("gateway", sa.String(20), server_default="nowpayments"),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("plan_tier", sa.String(20), nullable=True),
        sa.Column("billing_cycle", sa.String(10), nullable=True),
        sa.Column("gateway_order_id", sa.String(100), nullable=True),
        sa.Column("tx_hash", sa.String(128), nullable=True),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.Column("confirmed_at", sa.DateTime(), nullable=True),
        sa.Column("idempotency_key", sa.String(128), unique=True, nullable=True),
        sa.Column("processed", sa.Boolean(), server_default="false"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # ─── Create campaign_logs ──────────────────────────────
    op.create_table(
        "campaign_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("campaigns.id"), nullable=False),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=True),
        sa.Column("group_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(30), nullable=False),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("meta", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # ─── Create audit_logs ─────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("resource", sa.String(100), nullable=False),
        sa.Column("resource_id", sa.String(100), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # ─── Create alerts ─────────────────────────────────────
    op.create_table(
        "alerts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("alert_type", sa.String(50), nullable=False),
        sa.Column("severity", sa.String(10), server_default="info"),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("data", sa.JSON(), nullable=True),
        sa.Column("acknowledged", sa.Boolean(), server_default="false"),
        sa.Column("acknowledged_at", sa.DateTime(), nullable=True),
        sa.Column("acknowledged_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # ─── Create deposits ───────────────────────────────────
    op.create_table(
        "deposits",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("address", sa.String(128), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False),
        sa.Column("network", sa.String(20), nullable=True),
        sa.Column("expected_amount", sa.Float(), nullable=False),
        sa.Column("received_amount", sa.Float(), nullable=True),
        sa.Column("tx_hash", sa.String(128), nullable=True),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("confirmations", sa.Integer(), server_default="0"),
        sa.Column("confirmed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # ─── Indexes ───────────────────────────────────────────
    op.create_index("ix_spintax_user", "spintax_templates", ["user_id"])
    op.create_index("ix_subscriptions_user", "subscriptions", ["user_id"])
    op.create_index("ix_subscriptions_status", "subscriptions", ["status"])
    op.create_index("ix_orders_user", "orders", ["user_id"])
    op.create_index("ix_orders_status", "orders", ["status"])
    op.create_index("ix_campaign_logs_campaign", "campaign_logs", ["campaign_id"])
    op.create_index("ix_campaign_logs_account", "campaign_logs", ["account_id"])
    op.create_index("ix_audit_logs_user", "audit_logs", ["user_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_alerts_type", "alerts", ["alert_type"])
    op.create_index("ix_alerts_acknowledged", "alerts", ["acknowledged"])
    op.create_index("ix_deposits_user", "deposits", ["user_id"])
    op.create_index("ix_deposits_status", "deposits", ["status"])


def downgrade() -> None:
    op.drop_table("deposits")
    op.drop_table("alerts")
    op.drop_table("audit_logs")
    op.drop_table("campaign_logs")
    op.drop_table("orders")
    op.drop_table("subscriptions")
    op.drop_table("system_settings")
    op.drop_table("spintax_templates")

    op.alter_column("analytics", "meta", new_column_name="metadata")
    op.alter_column("conversations", "meta", new_column_name="metadata")

    for col in ("ip_country", "last_proxy", "last_known_ip", "ping_ms", "dc_id", "health_score", "health_check_at", "spamblock_until", "user_id"):
        op.drop_column("accounts", col)

    for col in ("template_source", "version", "group_prompts", "soul_prompt_data", "soul_prompt", "user_id"):
        op.drop_column("personas", col)
