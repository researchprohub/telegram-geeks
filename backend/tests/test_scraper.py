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

from app.telegram_layer.scraper import TelegramScraper
from app.main import init_database


@pytest.mark.asyncio
async def test_scraper_members():
    await init_database()

    res = await TelegramScraper.scrape_members(
        source="https://t.me/CryptoAlphaGems",
        limit=10,
        filters={"exclude_bots": True, "detect_gender": True},
    )
    assert res["status"] == "success"
    assert res["count"] > 0
    assert "db_id" in res
    assert len(res["preview"]) > 0
    print(f"Scraper members test passed: {res['count']} members collected.")


@pytest.mark.asyncio
async def test_scraper_commenters():
    res = await TelegramScraper.scrape_commenters(
        post_url="https://t.me/CryptoAlphaGems/42",
        limit=10,
    )
    assert res["status"] == "success"
    assert res["count"] > 0
    assert "db_id" in res
    print(f"Scraper commenters test passed: {res['count']} commenters collected.")


@pytest.mark.asyncio
async def test_scraper_validate_links():
    links = [
        "https://t.me/CryptoAlphaGems",
        "https://t.me/joinchat/AAAAAFExample",
        "invalid_link_format",
    ]
    res = await TelegramScraper.validate_links(links)
    assert len(res["valid"]) == 2
    assert len(res["invalid"]) == 1
    print("Validate links test passed.")


if __name__ == "__main__":
    asyncio.run(test_scraper_members())
    asyncio.run(test_scraper_commenters())
    asyncio.run(test_scraper_validate_links())
