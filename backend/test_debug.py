"""Debug infrastructure and module loading."""
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

# Test new modules
new_modules = [
    "mass_inspection", "parameter_generator", "proxy_checker",
    "account_folders", "views_boost", "mass_subscriptions",
    "channel_comments", "postbot", "anti_detection",
    "open_dialogs", "global_search", "admin_chat_search",
    "create_chats"
]

print("\n--- New modules (need client_manager) ---")
for mod in new_modules:
    service = dispatcher._load_service(mod)
    status = "OK" if service else "FAILED"
    print(f"  {mod}: {status}")

# Test mass_inspection execution
import asyncio

async def test_mass_inspection():
    print("\n" + "=" * 60)
    print("Testing mass_inspection.check_all_accounts...")
    print("=" * 60)
    
    result = await dispatcher.execute("mass_inspection", "check_all_accounts", {
        "folder": "Active", "check_type": "all", "thread_count": 5
    })
    print(f"Result: {result}")
    return result

result = asyncio.run(test_mass_inspection())
