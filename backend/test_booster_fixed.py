"""Test booster with correct parameter names."""
import sys
sys.path.insert(0, "/app")

from app.services.infrastructure import Infrastructure
from app.services.module_dispatcher import ModuleDispatcher
import asyncio

infra = Infrastructure()
dispatcher = ModuleDispatcher(infrastructure=infra)

async def test_booster():
    # Test start_warmup with correct param names
    print("Testing start_warmup...")
    result = await dispatcher.execute("booster", "start_warmup", {
        "phone": "+1234567890",
        "target_groups": [{"chat_id": 123456, "title": "Test Group"}],
        "duration_days": 30
    })
    print(f"Result: {result}")
    
    # Test get_progress
    print("\nTesting get_progress...")
    result = await dispatcher.execute("booster", "get_progress", {
        "phone": "+1234567890"
    })
    print(f"Result: {result}")
    
    # Test run_cycle
    print("\nTesting run_cycle...")
    result = await dispatcher.execute("booster", "run_warmup_cycle", {
        "phone": "+1234567890"
    })
    print(f"Result: {result}")

asyncio.run(test_booster())
