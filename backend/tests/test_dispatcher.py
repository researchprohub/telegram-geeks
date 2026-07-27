"""Debug dispatcher execute method."""
import sys
sys.path.insert(0, "/app")

import asyncio
from app.services.module_dispatcher import dispatcher
from app.services.infrastructure import Infrastructure

infra = Infrastructure()
dispatcher.infrastructure = infra

async def test_execute():
    print("Testing mass_inspection...")
    result = await dispatcher.execute("mass_inspection", "check_all_accounts", {
        "folder": "Active", "check_type": "all"
    })
    print(f"Result: {result}")
    print(f"Status: {result.get('status', 'NOT FOUND')}")

asyncio.run(test_execute())
