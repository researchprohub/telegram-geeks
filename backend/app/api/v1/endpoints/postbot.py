from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime
from typing import Optional

from app.dependencies import get_current_user
from app.models import User

router = APIRouter(prefix="/api/v1/postbot", tags=["PostBot"])

def _get_svc(request: Request):
    infra = getattr(request.app.state, "infrastructure", None)
    if not infra:
        raise HTTPException(status_code=503, detail="Infrastructure not initialized")
    svc = infra._resolve_service("postbot")
    if not svc:
        raise HTTPException(status_code=503, detail="PostBot service unavailable")
    return svc

@router.post("/create")
async def create_posts(
    account_phones: list[str], text: str = "",
    media_path: Optional[str] = None, media_type: str = "none",
    buttons: Optional[list[dict]] = None, buttons_per_row: int = 1,
    link_preview: bool = True, delay_range: list[int] = None,
    posts_per_account: list[int] = None, thread_count: int = 10,
    groups: Optional[list[str]] = None, persona: Optional[str] = None,
    svc=Depends(_get_svc), _: User = Depends(get_current_user),
):
    delay_range = delay_range or [5, 15]
    posts_per_account = posts_per_account or [1, 5]
    return await svc.create_posts(
        account_phones, text, media_path, media_type, buttons,
        buttons_per_row, link_preview, tuple(delay_range),
        tuple(posts_per_account), thread_count, groups, persona,
    )

@router.get("/templates")
async def list_templates(svc=Depends(_get_svc), _: User = Depends(get_current_user)):
    return svc.list_templates()

@router.post("/templates/render")
async def render_template(
    template_name: str, topic: str = "", reason: str = "",
    link: str = "", option_a: str = "", option_b: str = "",
    svc=Depends(_get_svc), _: User = Depends(get_current_user),
):
    kwargs = {k: v for k, v in {"topic": topic, "reason": reason, "link": link, "option_a": option_a, "option_b": option_b}.items() if v}
    text = svc.render_template(template_name, **kwargs)
    if not text:
        raise HTTPException(status_code=404, detail=f"Unknown template: {template_name}")
    return {"template": template_name, "text": text}

@router.post("/schedule")
async def schedule_post(
    account_phones: list[str], text: str,
    publish_at: str, groups: Optional[list[str]] = None,
    media_path: Optional[str] = None, persona: Optional[str] = None,
    svc=Depends(_get_svc), _: User = Depends(get_current_user),
):
    try:
        publish_dt = datetime.fromisoformat(publish_at.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format. Use ISO 8601 (e.g. 2025-01-01T00:00:00Z)")
    return await svc.schedule_post(account_phones, text, publish_dt, groups, media_path, persona=persona)

@router.get("/created")
async def get_created(limit: int = 100, svc=Depends(_get_svc), _: User = Depends(get_current_user)):
    return {"posts": svc.get_created_posts(limit)}

@router.get("/scheduled")
async def get_scheduled(status: Optional[str] = None, svc=Depends(_get_svc), _: User = Depends(get_current_user)):
    return {"posts": svc.get_scheduled_posts(status)}

@router.post("/scheduled/{post_id}/cancel")
async def cancel_scheduled(post_id: str, svc=Depends(_get_svc), _: User = Depends(get_current_user)):
    if not svc.cancel_scheduled(post_id):
        raise HTTPException(status_code=404, detail=f"Scheduled post not found or already published: {post_id}")
    return {"status": "cancelled", "post_id": post_id}

@router.get("/export-ids")
async def export_ids(svc=Depends(_get_svc), _: User = Depends(get_current_user)):
    return {"post_ids": svc.export_post_ids()}
