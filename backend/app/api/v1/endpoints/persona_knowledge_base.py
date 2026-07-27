"""Dynamic Knowledge Base (RAG) API — per-persona document store."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.models import User
from telegram_layer.src.actions.persona_knowledge_base import persona_kb

router = APIRouter(prefix="/api/v1/persona-knowledge", tags=["Persona Knowledge Base"])


class DocumentRequest(BaseModel):
    persona_id: str
    title: str
    content: str
    source: str = "manual"
    tags: Optional[list[str]] = []


@router.post("/documents")
async def add_document(body: DocumentRequest, user: User = Depends(get_current_user)):
    persona_kb.add_document(body.persona_id, body.title, body.content, body.source, body.tags)
    return {"status": "added", "persona_id": body.persona_id, "title": body.title}


class BulkDocumentRequest(BaseModel):
    persona_id: str
    documents: list[dict]


@router.post("/documents/bulk")
async def add_documents_bulk(body: BulkDocumentRequest, user: User = Depends(get_current_user)):
    persona_kb.add_documents_bulk(body.persona_id, body.documents)
    return {"status": f"added {len(body.documents)} documents", "persona_id": body.persona_id}


@router.get("/search/{persona_id}")
async def search_documents(persona_id: str, query: str, top_k: int = 3, user: User = Depends(get_current_user)):
    results = persona_kb.search(persona_id, query, top_k)
    return {"persona_id": persona_id, "query": query, "results": results}


@router.get("/context/{persona_id}")
async def get_context(persona_id: str, query: str, user: User = Depends(get_current_user)):
    ctx = persona_kb.get_relevant_context(persona_id, query)
    return {"persona_id": persona_id, "query": query, "context": ctx}


@router.get("/documents/{persona_id}")
async def list_documents(persona_id: str, user: User = Depends(get_current_user)):
    return {"persona_id": persona_id, "documents": persona_kb.list_documents(persona_id)}


@router.delete("/documents/{persona_id}/{doc_id}")
async def remove_document(persona_id: str, doc_id: str, user: User = Depends(get_current_user)):
    ok = persona_kb.remove_document(persona_id, doc_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"persona_id": persona_id, "doc_id": doc_id, "removed": True}


@router.get("/stats/{persona_id}")
async def get_stats(persona_id: str, user: User = Depends(get_current_user)):
    return persona_kb.get_stats(persona_id)
