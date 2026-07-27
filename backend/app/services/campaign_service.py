"""Campaign management service."""

from datetime import datetime, timezone
from app.models import Campaign, CampaignType, CampaignStatus
from app.exceptions import CampaignNotFoundError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


class CampaignService:
    """Business logic for campaign management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_campaign(
        self,
        name: str,
        campaign_type: str = "engagement",
        description: str | None = None,
        config: dict | None = None,
        target_groups: list[int] | None = None,
        persona_ids: list[int] | None = None,
        created_by: int | None = None,
    ) -> Campaign:
        campaign = Campaign(
            name=name,
            description=description,
            campaign_type=CampaignType(campaign_type),
            config=config or {},
            target_groups=target_groups or [],
            persona_ids=persona_ids or [],
            created_by=created_by,
        )
        self.db.add(campaign)
        await self.db.flush()
        await self.db.refresh(campaign)
        return campaign

    async def get_campaign(self, campaign_id: int) -> Campaign:
        result = await self.db.execute(select(Campaign).where(Campaign.id == campaign_id))
        campaign = result.scalar_one_or_none()
        if not campaign:
            raise CampaignNotFoundError(campaign_id)
        return campaign

    async def list_campaigns(
        self, skip: int = 0, limit: int = 20, status: str | None = None
    ):
        query = select(Campaign)
        if status:
            query = query.where(Campaign.status == status)
        query = query.offset(skip).limit(limit).order_by(Campaign.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def start_campaign(self, campaign_id: int):
        campaign = await self.get_campaign(campaign_id)
        campaign.status = CampaignStatus.RUNNING
        campaign.started_at = datetime.now(timezone.utc)
        await self.db.flush()

    async def pause_campaign(self, campaign_id: int):
        campaign = await self.get_campaign(campaign_id)
        campaign.status = CampaignStatus.PAUSED
        await self.db.flush()

    async def stop_campaign(self, campaign_id: int):
        campaign = await self.get_campaign(campaign_id)
        campaign.status = CampaignStatus.STOPPED
        await self.db.flush()
