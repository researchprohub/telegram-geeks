"""API Endpoints for Master Operational Workflow v2.0."""

import asyncio
import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.dependencies import get_current_user
from app.models import User
from app.services.operational_workflow import (
    workflow_engine, STAGE_DEFINITIONS, pipeline_run_manager,
)
from app.services.flood_wait_bus import flood_bus

router = APIRouter(prefix="/workflow", tags=["Master Operational Workflow v2.0"])


class RunStepRequest(BaseModel):
    stage_number: int = Field(..., description="Stage number (1 to 9)")
    step_id: str = Field(..., description="Step ID (e.g. 1A, 2A, 3A, 4A, 5A, 6A, 7A, 8A, 9A)")
    operation: Optional[str] = Field(None, description="Operation override for the module")
    params: Dict[str, Any] = Field(default_factory=dict, description="Execution parameters")


class ExecutePipelineRequest(BaseModel):
    name: str = Field("Master 9-Stage Operational Pipeline", description="Human-readable pipeline run name")
    stages: List[int] = Field(default_factory=lambda: [1, 2, 3, 4, 5, 6, 7, 8, 9], description="Ordered list of stages to run")
    config: Dict[str, Any] = Field(default_factory=dict, description="Pipeline configuration")


@router.get("/stages")
async def get_stages(user: User = Depends(get_current_user)):
    """Fetch all 9 operational stages, step catalog, and live system telemetry."""
    overview = await workflow_engine.get_stages_overview()
    return overview


@router.get("/overview")
async def get_workflow_overview(user: User = Depends(get_current_user)):
    """High-level summary of the entire operational workflow."""
    overview = await workflow_engine.get_stages_overview()
    return {
        "version": overview["version"],
        "pipeline_name": overview["pipeline_name"],
        "telemetry": overview["telemetry"],
        "total_stages": len(STAGE_DEFINITIONS),
    }


@router.get("/flood-status")
async def get_flood_status(user: User = Depends(get_current_user)):
    """Return all accounts currently subject to FloodWait with remaining cooldown timers."""
    return {
        "flooded_accounts": flood_bus.get_flood_status(),
        "total_flooded": len(flood_bus.get_flood_status()),
    }


@router.post("/run-step")
async def run_step(body: RunStepRequest, user: User = Depends(get_current_user)):
    """Execute a single step within a stage (e.g. 1A Parameter Gen, 2A Bulk Check, 3A Scraper)."""
    result = await workflow_engine.execute_step(
        stage_number=body.stage_number,
        step_id=body.step_id,
        operation=body.operation,
        params=body.params,
        user=user,
    )
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message", "Step execution failed"))
    return result


@router.post("/execute-pipeline")
async def execute_pipeline(body: ExecutePipelineRequest, user: User = Depends(get_current_user)):
    """Launch a multi-stage automated workflow pipeline."""
    run_record = await workflow_engine.execute_full_pipeline(
        pipeline_config={
            "name": body.name,
            "stages": body.stages,
            "config": body.config,
        },
        user=user,
    )
    return run_record


@router.get("/pipelines")
async def list_pipelines(limit: int = 20, user: User = Depends(get_current_user)):
    """List all pipeline runs from database with current status and progress."""
    runs = await pipeline_run_manager.list_runs(limit=limit)
    return {
        "total": len(runs),
        "runs": runs,
    }


@router.get("/pipelines/{pipeline_id}")
async def get_pipeline(pipeline_id: str, user: User = Depends(get_current_user)):
    """Get real-time details, logs, and artifacts of a specific pipeline execution."""
    run = await pipeline_run_manager.get_run(pipeline_id)
    if not run:
        raise HTTPException(status_code=404, detail="Pipeline run not found")
    return run


@router.get("/pipelines/{pipeline_id}/stream")
async def stream_pipeline_progress(pipeline_id: str, request: Request):
    """Server-Sent Events (SSE) live progress stream for a pipeline run."""
    async def event_generator():
        last_progress = -1
        last_log_count = 0
        while True:
            if await request.is_disconnected():
                break

            run = await pipeline_run_manager.get_run(pipeline_id)
            if not run:
                yield f"data: {json.dumps({'error': 'run_not_found'})}\n\n"
                break

            current_logs = run.get("logs", [])
            if run["progress"] != last_progress or len(current_logs) != last_log_count:
                last_progress = run["progress"]
                last_log_count = len(current_logs)
                yield f"data: {json.dumps(run)}\n\n"

            if run["status"] in ("completed", "failed", "cancelled"):
                yield f"data: {json.dumps({'event': 'done', 'run': run})}\n\n"
                break

            await asyncio.sleep(1.0)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.post("/pipelines/{pipeline_id}/cancel")
async def cancel_pipeline(pipeline_id: str, user: User = Depends(get_current_user)):
    """Cancel an ongoing pipeline execution."""
    await pipeline_run_manager.update_run(
        run_id=pipeline_id,
        progress=0,
        log_entry="Pipeline cancelled by operator.",
        status="cancelled",
    )
    return {"status": "cancelled", "pipeline_id": pipeline_id}


@router.post("/pipelines/{pipeline_id}/pause")
async def pause_pipeline(pipeline_id: str, action: str = "pause", user: User = Depends(get_current_user)):
    """Pause or resume a running pipeline."""
    new_status = "paused" if action == "pause" else "running"
    await pipeline_run_manager.update_run(
        run_id=pipeline_id,
        progress=0,
        log_entry=f"Pipeline {action}d by operator.",
        status=new_status,
    )
    return {"status": new_status, "pipeline_id": pipeline_id}
