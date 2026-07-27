"""Debug booster service loading."""
import sys
sys.path.insert(0, "/app")

from app.services.infrastructure import Infrastructure
from app.services.module_dispatcher import ModuleDispatcher

infra = Infrastructure()
dispatcher = ModuleDispatcher(infrastructure=infra)

# Test booster specifically
print("Loading booster service...")
svc = dispatcher._load_service("booster")
print(f"Service: {svc}")
print(f"Type: {type(svc)}")
print(f"Has start_warmup: {hasattr(svc, 'start_warmup') if svc else 'N/A'}")
print(f"Has get_progress: {hasattr(svc, 'get_progress') if svc else 'N/A'}")
print(f"Has run_cycle: {hasattr(svc, 'run_warmup_cycle') if svc else 'N/A'}")

# Test the execute method
import asyncio

async def test():
    result = await dispatcher.execute("booster", "start_warmup", {
        "phone": "+1234567890",
        "target_groups": [{"chat_id": 123456, "title": "Test"}],
        "duration_days": 30
    })
    print(f"\nExecute result: {result}")

asyncio.run(test())
