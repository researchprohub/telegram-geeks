import pytest
import pytest_asyncio
import asyncio
import os
import sys

# Ensure backend root and project root are on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
project_root = os.path.abspath(os.path.join(backend_dir, ".."))
sys.path.insert(0, backend_dir)
sys.path.insert(0, project_root)

from app.telegram_layer.messenger import TelegramMessenger
from app.main import init_database


@pytest.mark.asyncio
async def test_spintax_resolution():
    template = "{Hi|Hey|Hello} {there|friend}!"
    results = {TelegramMessenger._resolve_spintax(template) for _ in range(20)}
    assert len(results) > 1
    print(f"Spintax resolution generated {len(results)} variations: {results}")


@pytest.mark.asyncio
async def test_campaign_create_and_launch():
    await init_database()

    camp_id = await TelegramMessenger.create_campaign(
        name="Automated Messenger Unit Test",
        target_db_id=1,
        message_template="{Hello|Hi} {first_name}, check this out!",
        gpt_spin=True,
    )
    assert camp_id is not None

    launch_res = await TelegramMessenger.launch(camp_id)
    assert launch_res["status"] == "completed"
    assert launch_res["sent"] > 0
    print(f"Campaign create and launch test passed: sent={launch_res['sent']}")


@pytest.mark.asyncio
async def test_neural_commenting():
    res = await TelegramMessenger.neural_comment(
        post_urls=["https://t.me/CryptoAlphaGems/10", "https://t.me/CryptoAlphaGems/11"],
        tone="professional",
    )
    assert res["status"] == "completed"
    assert len(res["results"]) == 2
    print(f"Neural commenting test passed: {len(res['results'])} comments generated.")


if __name__ == "__main__":
    asyncio.run(test_spintax_resolution())
    asyncio.run(test_campaign_create_and_launch())
    asyncio.run(test_neural_commenting())
