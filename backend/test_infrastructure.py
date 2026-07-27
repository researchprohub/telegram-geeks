"""Quick test script for infrastructure and module dispatcher."""
import sys
sys.path.insert(0, "/app")

from app.services.infrastructure import Infrastructure
from app.services.module_dispatcher import ModuleDispatcher

print("=" * 60)
print("Testing Infrastructure...")
print("=" * 60)

infra = Infrastructure(
    telegram_api_id=12345678,
    telegram_api_hash="test_hash",
    session_storage_path="./sessions",
    ai_provider="ollama",
    ai_model="llama3",
)

print(f"Infrastructure ready: {infra.is_ready()}")
print(f"Status: {infra.status()}")

print("\n" + "=" * 60)
print("Testing ModuleDispatcher...")
print("=" * 60)

dispatcher = ModuleDispatcher(infrastructure=infra)

# Test simple services (no client_manager needed)
simple_modules = ["converter", "calculator_reports", "gender_detector", 
                  "link_checker", "json_generator", "number_checker",
                  "contact_book", "database_tools"]

print("\n--- Simple modules (no client_manager) ---")
for mod in simple_modules:
    service = dispatcher._load_service(mod)
    status = "OK" if service else "FAILED"
    print(f"  {mod}: {status}")

# Test services requiring client_manager
complex_modules = ["booster", "mass_messaging", "autoreponder", "autoposting",
                   "audience_collector", "invite_modules", "cloner", "interceptor",
                   "forwarder", "bot_creator", "referrals", "reporter",
                   "admin", "account_management", "registrar", "spambot_remover",
                   "stories", "reactions", "message_editor", "mass_unsubscriber"]

print("\n--- Complex modules (need client_manager) ---")
for mod in complex_modules:
    service = dispatcher._load_service(mod)
    status = "OK" if service else "FAILED"
    print(f"  {mod}: {status}")

# Test converter execution
print("\n" + "=" * 60)
print("Testing converter.execute()...")
print("=" * 60)

import asyncio

async def test_converter():
    result = await dispatcher.execute(
        "converter",
        "convert_to_tdata",
        {
            "session_string": "test_session",
            "api_id": 12345,
            "api_hash": "test_hash",
            "output_dir": "./sessions/test_tdata",
            "phone_number": "+1234567890",
        }
    )
    print(f"Result: {result}")
    return result

result = asyncio.run(test_converter())
print(f"\nConverter test {'PASSED' if result['status'] == 'success' else 'FAILED'}")

print("\n" + "=" * 60)
print("All tests complete!")
print("=" * 60)
