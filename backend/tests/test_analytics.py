"""
Sprint 7 Test Suite — Real-Time Analytics Dashboard & Aggregation Engine

Tests:
  1. AnalyticsService.get_overview_stats() — computes account, campaign, invite, proxy metrics
  2. AnalyticsService.get_accounts_folder_distribution() — 7-folder breakdown
  3. AnalyticsService.get_campaign_timeseries() — 14-day timeseries generation
  4. AnalyticsService.get_invite_breakdown() — success, failed, privacy, floodwaits
  5. AnalyticsService.get_floodwait_summary() — integrates with live flood_bus
  6. AnalyticsService.get_warming_summary() — active/completed warming jobs
  7. AnalyticsService.get_proxy_health() — speed buckets (fast, moderate, slow)
  8. AnalyticsService.get_revenue_stats() — completed orders and revenue
  9. AnalyticsService.get_top_campaigns() — order by sent volume
"""

import asyncio
import os
import sys
import unittest
from datetime import datetime, timezone

# Add backend directory and project root to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_dir)
sys.path.insert(0, os.path.join(backend_dir, "app"))
sys.path.insert(0, os.path.abspath(os.path.join(backend_dir, "..")))

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["ENVIRONMENT"]  = "test"

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from app.models.base import Base
from app.models import (
    Account, Campaign, TargetDatabase, Proxy, Order,
    WarmupJob, WarmupJobStatus, InviteJob, InviteJobStatus, InviteLog,
    CampaignStatus, ProxyStatus, AccountFolder, AccountStatus, User,
)
import app.database
import app.db.session

test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
TestSession = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

app.database.AsyncSessionLocal = TestSession
app.db.session.async_session_factory = TestSession

from app.services.analytics_service import AnalyticsService
from app.services.flood_wait_bus import flood_bus


class TestSprint7Analytics(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Seed sample data for analytics
        async with TestSession() as db:
            # Users
            u = User(email="test@example.com", hashed_password="fakehash123456", full_name="Tester", is_active=True)
            db.add(u)
            await db.commit()
            await db.refresh(u)

            # Accounts
            db.add_all([
                Account(phone_number="+15551110001", status="active", folder="active"),
                Account(phone_number="+15551110002", status="active", folder="active"),
                Account(phone_number="+15551110003", status="warming", folder="active"),
                Account(phone_number="+15551110004", status="spamblock_perm", folder="perm_ban"),
                Account(phone_number="+15551110005", status="frozen", folder="frozen"),
            ])
            # Campaigns
            db.add_all([
                Campaign(name="Alpha Outreach", status="running", campaign_type="messaging", sent=150, failed=5),
                Campaign(name="Beta Engagement", status="completed", campaign_type="engagement", sent=500, failed=12),
            ])
            # TargetDatabase
            db.add(TargetDatabase(name="Crypto Leads", count=1200))
            # Proxies
            db.add_all([
                Proxy(host="1.1.1.1", port=1080, status="alive", latency_ms=120),
                Proxy(host="2.2.2.2", port=1080, status="alive", latency_ms=350),
                Proxy(host="3.3.3.3", port=1080, status="dead", latency_ms=9999),
            ])
            # Invites
            db.add_all([
                InviteLog(job_id="job_1", account_id="1", user_id=101, status="success"),
                InviteLog(job_id="job_1", account_id="1", user_id=102, status="success"),
                InviteLog(job_id="job_1", account_id="2", user_id=103, status="failed", error_message="User has privacy settings enabled"),
            ])
            # Warmup jobs
            db.add_all([
                WarmupJob(id="warmup_1", account_id="1", duration_days=3, status="running"),
                WarmupJob(id="warmup_2", account_id="2", duration_days=7, status="completed"),
            ])
            # Orders
            db.add_all([
                Order(user_id=u.id, order_id="ord_1", amount=79.0, status="completed", crypto_currency="USDT"),
                Order(user_id=u.id, order_id="ord_2", amount=199.0, status="completed", crypto_currency="BTC"),
                Order(user_id=u.id, order_id="ord_3", amount=29.0, status="pending", crypto_currency="TON"),
            ])
            await db.commit()

    async def asyncTearDown(self):
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

    async def test_01_overview_stats(self):
        stats = await AnalyticsService.get_overview_stats()
        self.assertEqual(stats["accounts"]["total"], 5)
        self.assertEqual(stats["accounts"]["active"], 2)
        self.assertEqual(stats["accounts"]["warming"], 1)
        self.assertEqual(stats["accounts"]["banned"], 1)
        self.assertEqual(stats["campaigns"]["total"], 2)
        self.assertEqual(stats["campaigns"]["messages_sent"], 650)
        self.assertEqual(stats["campaigns"]["total_targets_parsed"], 1200)
        self.assertEqual(stats["invites"]["total"], 3)
        self.assertEqual(stats["invites"]["successful"], 2)
        self.assertEqual(stats["proxies"]["total"], 3)
        self.assertEqual(stats["proxies"]["alive"], 2)

    async def test_02_accounts_folder_distribution(self):
        dist = await AnalyticsService.get_accounts_folder_distribution()
        self.assertEqual(dist["total"], 5)
        folders = {d["folder"]: d["count"] for d in dist["distribution"]}
        self.assertEqual(folders["active"], 3)
        self.assertEqual(folders["perm_ban"], 1)
        self.assertEqual(folders["frozen"], 1)

    async def test_03_campaign_timeseries(self):
        ts = await AnalyticsService.get_campaign_timeseries(days=7)
        self.assertEqual(len(ts), 7)
        self.assertEqual(ts[-1]["sent"], 650)
        self.assertEqual(ts[-1]["failed"], 17)

    async def test_04_invite_breakdown(self):
        inv = await AnalyticsService.get_invite_breakdown()
        self.assertEqual(inv["total"], 3)
        self.assertEqual(inv["success"], 2)
        self.assertEqual(inv["failed"], 1)
        self.assertEqual(inv["privacy_restricted"], 1)

    async def test_05_floodwait_summary(self):
        flood_bus.register_flood("999", 60)
        summary = await AnalyticsService.get_floodwait_summary()
        self.assertTrue(summary["total_flooded"] >= 1)
        acc_ids = [a["account_id"] for a in summary["accounts"]]
        self.assertIn("999", acc_ids)

    async def test_06_warming_summary(self):
        warming = await AnalyticsService.get_warming_summary()
        self.assertEqual(warming["active_warming_jobs"], 1)
        self.assertEqual(warming["completed_warming_jobs"], 1)
        self.assertEqual(warming["accounts_in_warmup"], 1)

    async def test_07_proxy_health(self):
        health = await AnalyticsService.get_proxy_health()
        self.assertEqual(health["total"], 3)
        self.assertEqual(health["alive"], 2)
        self.assertEqual(health["speed_buckets"]["fast_under_200ms"], 1)
        self.assertEqual(health["speed_buckets"]["moderate_200_600ms"], 1)
        self.assertEqual(health["speed_buckets"]["slow_over_600ms"], 0)

    async def test_08_revenue_stats(self):
        rev = await AnalyticsService.get_revenue_stats()
        self.assertEqual(rev["total_orders"], 3)
        self.assertEqual(rev["completed_orders"], 2)
        self.assertEqual(rev["total_revenue_usd"], 278.0)

    async def test_09_top_campaigns(self):
        top = await AnalyticsService.get_top_campaigns(limit=2)
        self.assertEqual(len(top), 2)
        self.assertEqual(top[0]["name"], "Beta Engagement")
        self.assertEqual(top[0]["sent"], 500)


if __name__ == "__main__":
    print("=" * 60)
    print("  TELEGRAM GEEKS -- SPRINT 7 ANALYTICS SUITE")
    print("  Unified Metrics + Timeseries + Telemetry Aggregation")
    print("=" * 60)

    suite = unittest.TestLoader().loadTestsFromTestCase(TestSprint7Analytics)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print("\n" + "=" * 60)
    if result.wasSuccessful():
        print("  ALL 9 SPRINT 7 ANALYTICS TESTS PASSED -- 100% GREEN")
    else:
        print(f"  FAILURES: {len(result.failures)}  ERRORS: {len(result.errors)}")
    print("=" * 60)

    sys.exit(0 if result.wasSuccessful() else 1)
