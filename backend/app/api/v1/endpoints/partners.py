"""Partners page (marketing) endpoints — public read + admin CRUD."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import PartnerCreate, PartnerUpdate, PartnerOut
from app.models import Partner
from app.db.session import get_db
from app.api.v1.endpoints.admin import require_admin

router = APIRouter(tags=["Partners"])


@router.get("/partners", response_model=list[PartnerOut])
async def list_partners(db: AsyncSession = Depends(get_db)):
    """Public list of partners for the marketing page."""
    r = await db.execute(select(Partner).order_by(Partner.sort_order, Partner.id))
    return r.scalars().all()


@router.get("/admin/partners", response_model=list[PartnerOut])
async def admin_list_partners(
    _admin: object = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(select(Partner).order_by(Partner.sort_order, Partner.id))
    return r.scalars().all()


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
