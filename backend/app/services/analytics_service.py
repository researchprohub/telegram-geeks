"""Analytics aggregation service."""

from datetime import datetime, timedelta, timezone
from app.models import AnalyticsRecord
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func


class AnalyticsService:
    """Business logic for analytics aggregation."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def record_metric(
        self,
        campaign_id: int | None,
        metric_name: str,
        metric_value: float,
        period: str = "hourly",
        metadata: dict | None = None,
    ):
        record = AnalyticsRecord(
            campaign_id=campaign_id,
            metric_name=metric_name,
            metric_value=metric_value,
            period=period,
            metadata=metadata,
        )
        self.db.add(record)
        await self.db.flush()

    async def get_metrics_history(
        self,
        campaign_id: int,
        metric_name: str,
        hours: int = 24,
    ) -> list[dict]:
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        result = await self.db.execute(
            select(AnalyticsRecord)
            .where(
                AnalyticsRecord.campaign_id == campaign_id,
                AnalyticsRecord.metric_name == metric_name,
                AnalyticsRecord.timestamp >= since,
            )
            .order_by(AnalyticsRecord.timestamp)
        )
        return [
            {
                "timestamp": r.timestamp.isoformat(),
                "value": r.metric_value,
            }
            for r in result.scalars().all()
        ]

    async def get_campaign_summary(self, campaign_id: int) -> dict:
        """Get aggregated summary for a campaign."""
        result = await self.db.execute(
            select(
                func.count(AnalyticsRecord.id),
                func.avg(AnalyticsRecord.metric_value),
                func.sum(AnalyticsRecord.metric_value),
            ).where(AnalyticsRecord.campaign_id == campaign_id)
        )
        row = result.one()
        return {
            "total_records": row[0] or 0,
            "average_value": row[1] or 0.0,
            "total_value": row[2] or 0.0,
        }
