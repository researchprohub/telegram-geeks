"""Partners page (marketing) endpoints — public read + admin CRUD."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import PartnerCreate, PartnerUpdate, PartnerOut
from app.models import Partner
from app.db.session import get_db
from app.api.v1.endpoints.admin import require_admin

from app.data.default_partners import DEFAULT_PARTNERS

router = APIRouter(tags=["Partners"])


async def _ensure_seeded(db: AsyncSession):
    r = await db.execute(select(Partner))
    existing = r.scalars().all()
    if not existing:
        for item in DEFAULT_PARTNERS:
            p = Partner(
                name=item["name"],
                img=item["img"],
                href=item.get("href", ""),
                category=item.get("category", "proxies"),
                sort_order=item.get("sort_order", 0),
            )
            db.add(p)
        await db.commit()


@router.get("/partners", response_model=list[PartnerOut])
async def list_partners(db: AsyncSession = Depends(get_db)):
    """Public list of partners for the marketing page."""
    await _ensure_seeded(db)
    r = await db.execute(select(Partner).order_by(Partner.sort_order, Partner.id))
    return r.scalars().all()


@router.get("/admin/partners", response_model=list[PartnerOut])
async def admin_list_partners(
    _admin: object = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_seeded(db)
    r = await db.execute(select(Partner).order_by(Partner.sort_order, Partner.id))
    return r.scalars().all()


@router.post("/admin/partners/seed", response_model=list[PartnerOut])
async def seed_default_partners(
    _admin: object = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Seed or restore the 124 default verified partners."""
    r = await db.execute(select(Partner))
    existing = r.scalars().all()
    for p in existing:
        await db.delete(p)
    await db.flush()

    for item in DEFAULT_PARTNERS:
        p = Partner(
            name=item["name"],
            img=item["img"],
            href=item.get("href", ""),
            category=item.get("category", "proxies"),
            sort_order=item.get("sort_order", 0),
        )
        db.add(p)
    await db.commit()

    res = await db.execute(select(Partner).order_by(Partner.sort_order, Partner.id))
    return res.scalars().all()


@router.post("/admin/partners", response_model=PartnerOut, status_code=201)
async def create_partner(
    body: PartnerCreate,
    _admin: object = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    p = Partner(
        name=body.name, img=body.img, href=body.href,
        category=body.category, sort_order=body.sort_order,
    )
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p


@router.put("/admin/partners/{partner_id}", response_model=PartnerOut)
async def update_partner(
    partner_id: int,
    body: PartnerUpdate,
    _admin: object = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(select(Partner).where(Partner.id == partner_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Partner not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(p, field, value)
    await db.commit()
    await db.refresh(p)
    return p


@router.delete("/admin/partners/{partner_id}")
async def delete_partner(
    partner_id: int,
    _admin: object = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(select(Partner).where(Partner.id == partner_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Partner not found")
    await db.delete(p)
    await db.commit()
    return {"message": "Partner deleted"}
