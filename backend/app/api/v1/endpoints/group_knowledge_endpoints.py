from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.models import User
from telegram_layer.src.actions.persona_knowledge_base import persona_kb

router = APIRouter(prefix="/api/v1/group-knowledge", tags=["Group Knowledge"])


class GroupDocRequest(BaseModel):
    group_id: str
    title: str
    content: str
    source: str = "group_manual"
    tags: Optional[list[str]] = []


@router.post("/documents")
async def add_group_document(body: GroupDocRequest, user: User = Depends(get_current_user)):
    persona_kb.add_group_document(body.group_id, body.title, body.content, body.source, body.tags)
    return {"status": "added", "group_id": body.group_id, "title": body.title}


@router.get("/context/{group_id}")
async def get_group_context(group_id: str, query: str, user: User = Depends(get_current_user)):
    ctx = persona_kb.get_group_context(group_id, query)
    return {"group_id": group_id, "query": query, "context": ctx}


@router.get("/documents/{group_id}")
async def list_group_documents(group_id: str, user: User = Depends(get_current_user)):
    docs = persona_kb.list_documents(f"group:{group_id}")
    return {"group_id": group_id, "documents": docs}


@router.delete("/documents/{group_id}/{doc_id}")
async def remove_group_document(group_id: str, doc_id: str, user: User = Depends(get_current_user)):
    ok = persona_kb.remove_document(f"group:{group_id}", doc_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"group_id": group_id, "doc_id": doc_id, "removed": True}


@router.get("/stats/{group_id}")
async def get_group_stats(group_id: str, user: User = Depends(get_current_user)):
    stats = persona_kb.get_stats(f"group:{group_id}")
    return {"group_id": group_id, **stats}
