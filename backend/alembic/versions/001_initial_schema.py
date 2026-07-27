"""Initial schema migration."""

from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(200), nullable=True),
        sa.Column("role", sa.String(20), default="operator"),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("last_login", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "accounts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("phone_number", sa.String(20), unique=True, nullable=False),
        sa.Column("session_string", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), default="warming"),
        sa.Column("proxy_config", sa.JSON(), default=dict),
        sa.Column("api_id", sa.Integer(), nullable=True),
        sa.Column("api_hash", sa.String(64), nullable=True),
        sa.Column("last_activity", sa.DateTime(), nullable=True),
        sa.Column("flood_wait_until", sa.DateTime(), nullable=True),
        sa.Column("ban_reason", sa.Text(), nullable=True),
        sa.Column("trust_score", sa.Float(), default=0.0),
        sa.Column("daily_message_count", sa.Integer(), default=0),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "personas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("personality_traits", sa.JSON(), default=dict),
        sa.Column("writing_style", sa.JSON(), default=dict),
        sa.Column("response_time_min", sa.Integer(), default=30),
        sa.Column("response_time_max", sa.Integer(), default=300),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("niche_tags", sa.JSON(), default=list),
        sa.Column("tone", sa.String(50), default="casual"),
        sa.Column("energy_level", sa.Float(), default=0.5),
        sa.Column("humor_level", sa.Float(), default=0.3),
        sa.Column("formality_level", sa.Float(), default=0.4),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "groups",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("chat_id", sa.Integer(), unique=True, nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("group_type", sa.String(20), default="group"),
        sa.Column("member_count", sa.Integer(), default=0),
        sa.Column("niche_tags", sa.JSON(), default=list),
        sa.Column("language", sa.String(10), nullable=True),
        sa.Column("last_activity", sa.DateTime(), nullable=True),
        sa.Column("safety_score", sa.Float(), default=100.0),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "campaigns",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("campaign_type", sa.String(20), default="engagement"),
        sa.Column("status", sa.String(20), default="draft"),
        sa.Column("config", sa.JSON(), default=dict),
        sa.Column("target_groups", sa.JSON(), default=list),
        sa.Column("allowed_hours", sa.JSON(), default=list),
        sa.Column("timezone", sa.String(50), default="UTC"),
        sa.Column("persona_ids", sa.JSON(), default=list),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "campaign_accounts",
        sa.Column("campaign_id", sa.Integer(), primary_key=True),
        sa.Column("account_id", sa.Integer(), primary_key=True),
        sa.Column("assigned_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "campaign_targets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("campaign_id", sa.Integer(), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.Column("added_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "conversations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("campaign_id", sa.Integer(), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=True),
        sa.Column("message_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(20), default="pending"),
        sa.Column("thread_parent_id", sa.Integer(), nullable=True),
        sa.Column("persona_id", sa.Integer(), nullable=True),
        sa.Column("account_id", sa.Integer(), nullable=True),
        sa.Column("response_text", sa.Text(), nullable=True),
        sa.Column("ai_model_used", sa.String(50), nullable=True),
        sa.Column("quality_score", sa.Float(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "analytics",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("campaign_id", sa.Integer(), nullable=True),
        sa.Column("metric_name", sa.String(100), nullable=False),
        sa.Column("metric_value", sa.Float(), nullable=False),
        sa.Column("timestamp", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("period", sa.String(20), default="hourly"),
    )

    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("campaign_id", sa.Integer(), nullable=True),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("event_data", sa.JSON(), default=dict),
        sa.Column("account_id", sa.Integer(), nullable=True),
        sa.Column("group_id", sa.Integer(), nullable=True),
        sa.Column("processed", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # Indexes
    op.create_index("ix_accounts_phone", "accounts", ["phone_number"])
    op.create_index("ix_accounts_status", "accounts", ["status"])
    op.create_index("ix_campaigns_status", "campaigns", ["status"])
    op.create_index("ix_campaigns_created_at", "campaigns", ["created_at"])
    op.create_index("ix_conversations_campaign", "conversations", ["campaign_id"])
    op.create_index("ix_analytics_campaign", "analytics", ["campaign_id"])
    op.create_index("ix_analytics_timestamp", "analytics", ["timestamp"])
    op.create_index("ix_groups_chat_id", "groups", ["chat_id"])


def downgrade() -> None:
    op.drop_table("events")
    op.drop_table("analytics")
    op.drop_table("conversations")
    op.drop_table("campaign_targets")
    op.drop_table("campaign_accounts")
    op.drop_table("campaigns")
    op.drop_table("groups")
    op.drop_table("personas")
    op.drop_table("accounts")
    op.drop_table("users")
