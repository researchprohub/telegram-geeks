"""Orchestration API — Multi-account coordination endpoints."""
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Any, List
from loguru import logger

from app.dependencies import get_current_user
from app.models import User

router = APIRouter(tags=["Orchestration"])


def _get_engine(request: Request):
    engine = getattr(request.app.state, 'orchestration_engine', None)
    if not engine:
        raise HTTPException(status_code=503, detail="Orchestration engine not initialized, configure Telegram API in admin settings")
    return engine


def _get_router(request: Request):
    router_svc = getattr(request.app.state, 'conversation_router', None)
    if not router_svc:
        raise HTTPException(status_code=503, detail="Conversation router not initialized, configure Telegram API in admin settings")
    return router_svc


class MessageBatchRequest(BaseModel):
    target_peer: str
    messages: List[str]
    min_delay: int = 10
    max_delay: int = 60


class ThreadRequest(BaseModel):
    thread_id: str
    target_peer: str
    topic: str


class ResponseRequest(BaseModel):
    message: str
    direction: str = "outbound"


class CollectiveActionRequest(BaseModel):
    action_type: str
    target: Any = None
    params: dict = {}


class ExpertiseRequest(BaseModel):
    account: str
    topics: List[str]


class RouteMessageRequest(BaseModel):
    peer_id: str
    incoming_message: str
    account_id: str


@router.post("/distribute", tags=["Distribution"])
async def distribute_messages(
    request: Request,
    body: MessageBatchRequest,
    user: User = Depends(get_current_user),
):
    """Distribute messages across multiple accounts."""
    engine = _get_engine(request)
    result = await engine.distribute_messages(
        body.target_peer, body.messages, body.min_delay, body.max_delay
    )
    return result


@router.post("/thread/create", tags=["Threads"])
async def create_thread(
    request: Request,
    body: ThreadRequest,
    user: User = Depends(get_current_user),
):
    """Create a new conversation thread."""
    engine = _get_engine(request)
    thread = await engine.create_conversation_thread(
        body.thread_id, body.target_peer, body.topic
    )
    return thread.to_dict()


@router.post("/thread/{thread_id}/respond", tags=["Threads"])
async def respond_to_thread(
    request: Request,
    thread_id: str,
    body: ResponseRequest,
    user: User = Depends(get_current_user),
):
    """Send a response in a conversation thread."""
    engine = _get_engine(request)
    result = await engine.send_thread_response(thread_id, body.message, body.direction)
    return result


@router.get("/threads", tags=["Threads"])
async def list_threads(
    request: Request,
    user: User = Depends(get_current_user),
):
    """List all conversation threads."""
    engine = _get_engine(request)
    return {"threads": [t.to_dict() for t in engine.threads.values()], "count": len(engine.threads)}


@router.post("/collective-action", tags=["Actions"])
async def collective_action(
    request: Request,
    body: CollectiveActionRequest,
    user: User = Depends(get_current_user),
):
    """Execute a collective action across all accounts."""
    engine = _get_engine(request)
    result = await engine.collective_action(
        body.action_type, body.target, **body.params
    )
    return result


@router.get("/accounts", tags=["Accounts"])
async def list_available_accounts(
    request: Request,
    user: User = Depends(get_current_user),
):
    """List all available connected accounts."""
    engine = _get_engine(request)
    try:
        accounts = await asyncio.wait_for(engine.get_available_accounts(), timeout=3.0)
    except (asyncio.TimeoutError, Exception) as e:
        logger.warning(f"Error getting accounts: {e}")
        accounts = []
    return {"accounts": accounts, "count": len(accounts)}


@router.post("/router/route", tags=["Routing"])
async def route_message(
    request: Request,
    body: RouteMessageRequest,
    user: User = Depends(get_current_user),
):
    """Route an incoming message to the best available account."""
    router_svc = _get_router(request)
    result = await router_svc.route_message(body.peer_id, body.incoming_message, body.account_id)
    return result


@router.get("/router/stats", tags=["Routing"])
async def get_routing_stats(
    request: Request,
    user: User = Depends(get_current_user),
):
    """Get conversation routing statistics."""
    router_svc = _get_router(request)
    return router_svc.get_routing_stats()


@router.get("/router/conversations", tags=["Routing"])
async def list_conversations(
    request: Request,
    user: User = Depends(get_current_user),
):
    """List all conversation contexts."""
    router_svc = _get_router(request)
    return {"conversations": router_svc.list_conversations()}


@router.post("/router/expertise", tags=["Routing"])
async def set_account_expertise(
    request: Request,
    body: ExpertiseRequest,
    user: User = Depends(get_current_user),
):
    """Set topic expertise for an account."""
    router_svc = _get_router(request)
    await router_svc.set_account_expertise(body.account, body.topics)
    return {"status": "ok", "account": body.account, "topics": body.topics}
