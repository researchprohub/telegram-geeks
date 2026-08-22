import asyncio
import os
import sys

# Ensure backend root, app, and project root are on sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)
sys.path.insert(0, os.path.join(backend_dir, "app"))
sys.path.insert(0, os.path.abspath(os.path.join(backend_dir, "..")))

from app.services.operational_workflow import workflow_engine, STAGE_DEFINITIONS, pipeline_run_manager
from app.services.flood_wait_bus import flood_bus
from app.main import init_database

async def run_tests():
    await init_database()
    print("Verifying 9 stages definition...")
    assert len(STAGE_DEFINITIONS) == 9
    print(f"PASS: {len(STAGE_DEFINITIONS)} stages defined.")

    overview = await workflow_engine.get_stages_overview()
    print("Telemetry total accounts:", overview["telemetry"]["total_accounts"])

    # Test step 1A
    res_1a = await workflow_engine.execute_step(1, "1A", "generate_beginner", {"count": 5})
    assert res_1a.get("status") == "success"
    print("PASS: Step 1A execute result:", res_1a.get("result", {}).get("summary"))

    # Test step 2A
    res_2a = await workflow_engine.execute_step(2, "2A", "check_all_accounts")
    assert res_2a.get("status") == "success"
    print("PASS: Step 2A execute result:", res_2a.get("result", {}).get("summary"))

    # Test step 3A (saves to target_databases)
    res_3a = await workflow_engine.execute_step(3, "3A", "collect_from_comments", {"source": "https://t.me/test_alpha", "limit": 15})
    assert res_3a.get("status") == "success"
    print("PASS: Step 3A execute result:", res_3a.get("result", {}).get("summary"))

    # Test FloodWait Bus
    print("Testing FloodWait Bus...")
    flood_bus.register_flood("test_account_99", 5)
    assert flood_bus.is_flooded("test_account_99") is True
    print(f"PASS: FloodWait Bus registered, remaining: {flood_bus.seconds_remaining('test_account_99')}s")

    # Test pipeline run persistence
    print("Testing PipelineRunManager...")
    pipe_res = await workflow_engine.execute_full_pipeline({
        "name": "Hardened Verification Test Pipeline",
        "stages": [1, 2, 3],
    })
    pipe_id = pipe_res.get("id")
    assert pipe_id is not None
    print("PASS: Pipeline persisted in DB with ID:", pipe_id)

    # Let pipeline execute background steps
    await asyncio.sleep(2)
    updated_pipe = await pipeline_run_manager.get_run(pipe_id)
    assert updated_pipe is not None
    print(f"PASS: Pipeline state recovered from DB, progress: {updated_pipe.get('progress')}%")

    print("\nALL BACKEND HARDENING & PERSISTENCE TESTS PASSED!")

if __name__ == "__main__":
    asyncio.run(run_tests())
