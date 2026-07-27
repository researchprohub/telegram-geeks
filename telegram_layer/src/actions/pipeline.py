"""Pipeline — stage-based execution engine for multi-step workflows."""

from datetime import datetime, timezone
from loguru import logger


class PipelineService:
    def __init__(self):
        self.pipelines: dict[str, dict] = {}

    def create_pipeline(self, name: str, stages: list[dict]) -> dict:
        pid = f"pipe_{len(self.pipelines) + 1}_{int(datetime.now(timezone.utc).timestamp())}"
        self.pipelines[pid] = {
            "id": pid,
            "name": name,
            "stages": [{"name": s["name"], "module_id": s.get("module_id", ""), "operation": s.get("operation", ""), "params": s.get("params", {}), "status": "pending"} for s in stages],
            "current_stage": 0,
            "status": "created",
            "results": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        return self.pipelines[pid]

    def get_pipeline(self, pipeline_id: str) -> dict | None:
        return self.pipelines.get(pipeline_id)

    def list_pipelines(self) -> list:
        return list(self.pipelines.values())

    def advance_stage(self, pipeline_id: str, result: dict = {}) -> dict:
        p = self.pipelines.get(pipeline_id)
        if not p:
            return {"error": "not found"}
        if p["status"] == "completed":
            return {"error": "already completed"}
        stage = p["stages"][p["current_stage"]]
        stage["status"] = "completed"
        p["results"].append({"stage": stage["name"], "result": result})
        p["current_stage"] += 1
        if p["current_stage"] >= len(p["stages"]):
            p["status"] = "completed"
        return {"pipeline_id": pipeline_id, "current_stage": p["current_stage"], "total_stages": len(p["stages"]), "status": p["status"]}
