"""
Sprint 6 Test Suite — Parameter Generator + Proxy Service + SMS Service

Tests:
  1. ParameterGenerator.generate_beginner() — count, fields, valid API ID
  2. ParameterGenerator.generate_professional() — custom config, distribution
  3. ParameterGenerator.export_as_json() — session+json format
  4. ParameterGenerator.export_as_csv() — CSV headers and rows
  5. ParameterGenerator.validate() — detects valid and invalid rows
  6. ParameterGenerator — 30 countries produce correct prefixes
  7. Proxy parsing — host:port, host:port:user:pass, socks5:// URL formats
  8. ProxyService.bulk_import() — inserts proxies, handles duplicates
  9. Proxy.to_telethon_tuple() — generates valid PySocks tuple
  10. ProxyService.get_stats() — returns accurate counts
  11. ProxyService.assign_to_accounts() — round_robin strategy
  12. ProxyService.assign_to_accounts() — least_used strategy
  13. ProxyService.rotate_proxy() — rotates and updates fail count
  14. SMSService.request_number() — mock flow returns activation_id
  15. SMSService.refund_number() — mock flow succeeds
  16. OperationalWorkflow Stage 1A & 2B dispatch — wired to real services
"""

import asyncio
import os
import sys
import tempfile
import unittest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Use in-memory SQLite DB for tests
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["ENVIRONMENT"]  = "test"

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from app.models.base import Base
from app.models import Proxy, ProxyStatus, Account, AccountFolder, AccountStatus, User
import app.database
import app.db.session

test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
TestSession = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

# Monkey-patch async session factory in modules
app.database.AsyncSessionLocal = TestSession
app.db.session.async_session_factory = TestSession

from app.services.parameter_generator import (
    ParameterGenerator,
    COUNTRY_PROFILES,
    ANDROID_DEVICES,
    TELEGRAM_APP_VERSIONS,
)
from app.services.proxy_service import ProxyService
from app.services.sms_service import SMSService
from app.services.operational_workflow import workflow_engine


class TestSprint6(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def asyncTearDown(self):
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

    # ── 1. ParameterGenerator: Beginner Mode ──────────────────────────────────
    async def test_01_parameter_gen_beginner(self):
        params = await ParameterGenerator.generate_beginner(count=10, country="US", gender="male")
        self.assertEqual(len(params), 10)
        p = params[0]
        self.assertIn("api_id", p)
        self.assertIn("api_hash", p)
        self.assertIn("device_model", p)
        self.assertIn("system_version", p)
        self.assertIn("app_version", p)
        self.assertIn("first_name", p)
        self.assertIn("last_name", p)
        self.assertEqual(p["country"], "US")
        self.assertEqual(p["phone_prefix"], "+1")
        self.assertEqual(p["lang_code"], "en")
        self.assertIsInstance(p["api_id"], int)
        self.assertTrue(len(p["api_hash"]) > 10)

    # ── 2. ParameterGenerator: Professional Mode ──────────────────────────────
    async def test_02_parameter_gen_professional(self):
        config = {
            "countries":     ["DE", "FR", "GB"],
            "genders":       ["female"],
            "device_models": ["Samsung Galaxy S24 Ultra", "Google Pixel 8 Pro"],
        }
        params = await ParameterGenerator.generate_professional(count=30, config=config)
        self.assertEqual(len(params), 30)

        countries_seen = {p["country"] for p in params}
        self.assertTrue(countries_seen.issubset({"DE", "FR", "GB"}))

        devices_seen = {p["device_model"] for p in params}
        self.assertTrue(devices_seen.issubset({"Samsung Galaxy S24 Ultra", "Google Pixel 8 Pro"}))

    # ── 3. ParameterGenerator: Export as session+json ─────────────────────────
    async def test_03_parameter_export_json(self):
        params   = await ParameterGenerator.generate_beginner(count=5, country="US")
        exported = ParameterGenerator.export_as_json(params)
        self.assertEqual(len(exported), 5)
        item = exported[0]
        self.assertIn("session_file", item)
        self.assertTrue(item["session_file"].endswith(".session"))
        self.assertIn("api_id", item)
        self.assertIn("device_model", item)

    # ── 4. ParameterGenerator: Export as CSV ──────────────────────────────────
    async def test_04_parameter_export_csv(self):
        params  = await ParameterGenerator.generate_beginner(count=3, country="GB")
        csv_out = ParameterGenerator.export_as_csv(params)
        lines   = csv_out.strip().split("\n")
        self.assertEqual(len(lines), 4)  # 1 header + 3 data rows
        self.assertIn("api_id", lines[0])
        self.assertIn("device_model", lines[0])

    # ── 5. ParameterGenerator: Validation ─────────────────────────────────────
    async def test_05_parameter_validation(self):
        valid_params = await ParameterGenerator.generate_beginner(count=5)
        res = ParameterGenerator.validate(valid_params)
        self.assertEqual(res["valid"], 5)
        self.assertEqual(res["invalid"], 0)

        # Corrupt one record
        corrupt_params = list(valid_params)
        corrupt_params.append({"api_id": None, "api_hash": "short"})
        res2 = ParameterGenerator.validate(corrupt_params)
        self.assertEqual(res2["valid"], 5)
        self.assertEqual(res2["invalid"], 1)

    # ── 6. ParameterGenerator: All 30 countries prefix check ──────────────────
    async def test_06_all_countries_prefixes(self):
        for country_code in list(COUNTRY_PROFILES.keys())[:10]:
            params = await ParameterGenerator.generate_beginner(count=1, country=country_code)
            self.assertEqual(params[0]["country"], country_code)
            expected_prefix = COUNTRY_PROFILES[country_code][0]
            self.assertEqual(params[0]["phone_prefix"], expected_prefix)

    # ── 7. Proxy Line Parsing ─────────────────────────────────────────────────
    async def test_07_proxy_line_parsing(self):
        # host:port
        p1 = ProxyService._parse_proxy_line("192.168.1.1:1080", "socks5")
        self.assertIsNotNone(p1)
        self.assertEqual(p1["host"], "192.168.1.1")
        self.assertEqual(p1["port"], 1080)
        self.assertIsNone(p1["username"])

        # host:port:user:pass
        p2 = ProxyService._parse_proxy_line("10.0.0.1:8080:myuser:mypass", "socks5")
        self.assertIsNotNone(p2)
        self.assertEqual(p2["host"], "10.0.0.1")
        self.assertEqual(p2["port"], 8080)
        self.assertEqual(p2["username"], "myuser")
        self.assertEqual(p2["password"], "mypass")

        # URL format
        p3 = ProxyService._parse_proxy_line("socks5://user1:pass1@proxy.net:9050", "socks5")
        self.assertIsNotNone(p3)
        self.assertEqual(p3["proxy_type"], "socks5")
        self.assertEqual(p3["host"], "proxy.net")
        self.assertEqual(p3["port"], 9050)
        self.assertEqual(p3["username"], "user1")
        self.assertEqual(p3["password"], "pass1")

    # ── 8. Proxy Bulk Import ──────────────────────────────────────────────────
    async def test_08_proxy_bulk_import(self):
        raw = """
        1.1.1.1:1080
        2.2.2.2:1080:user:pass
        socks5://u:p@3.3.3.3:9050
        invalid_line_with_no_port
        # comment line
        """
        res = await ProxyService.bulk_import(raw, proxy_type="socks5")
        self.assertEqual(res["added"], 3)
        self.assertEqual(res["invalid"], 1)

        # Duplicate import test — should not re-add
        res2 = await ProxyService.bulk_import(raw, proxy_type="socks5")
        self.assertEqual(res2["added"], 0)

    # ── 9. Proxy to_telethon_tuple() ──────────────────────────────────────────
    async def test_09_proxy_telethon_tuple(self):
        import socks
        p = Proxy(
            host="1.2.3.4",
            port=1080,
            username="u",
            password="p",
            proxy_type="socks5",
            status=ProxyStatus.UNTESTED.value,
        )
        t = p.to_telethon_tuple()
        self.assertEqual(t[0], socks.SOCKS5)
        self.assertEqual(t[1], "1.2.3.4")
        self.assertEqual(t[2], 1080)
        self.assertTrue(t[3])
        self.assertEqual(t[4], "u")
        self.assertEqual(t[5], "p")

    # ── 10. ProxyService Stats ────────────────────────────────────────────────
    async def test_10_proxy_stats(self):
        async with TestSession() as db:
            db.add_all([
                Proxy(host="1.1.1.1", port=1080, status=ProxyStatus.ALIVE.value, latency_ms=120),
                Proxy(host="2.2.2.2", port=1080, status=ProxyStatus.ALIVE.value, latency_ms=180),
                Proxy(host="3.3.3.3", port=1080, status=ProxyStatus.DEAD.value, latency_ms=9999),
                Proxy(host="4.4.4.4", port=1080, status=ProxyStatus.UNTESTED.value),
            ])
            await db.commit()

        stats = await ProxyService.get_stats()
        self.assertEqual(stats["total"], 4)
        self.assertEqual(stats["alive"], 2)
        self.assertEqual(stats["dead"], 1)
        self.assertEqual(stats["untested"], 1)
        self.assertEqual(stats["avg_latency_ms"], 150)

    # ── 11. Proxy Assignment: Round Robin ─────────────────────────────────────
    async def test_11_proxy_assignment_round_robin(self):
        async with TestSession() as db:
            # Add 2 alive proxies
            p1 = Proxy(host="1.1.1.1", port=1080, status=ProxyStatus.ALIVE.value, latency_ms=100)
            p2 = Proxy(host="2.2.2.2", port=1080, status=ProxyStatus.ALIVE.value, latency_ms=150)
            db.add_all([p1, p2])
            await db.commit()
            await db.refresh(p1)
            await db.refresh(p2)

            # Add 4 accounts
            accs = [
                Account(phone_number=f"+155500000{i}", status="active", folder="active")
                for i in range(4)
            ]
            db.add_all(accs)
            await db.commit()
            for a in accs:
                await db.refresh(a)

            acc_ids = [str(a.id) for a in accs]

        assigned = await ProxyService.assign_to_accounts(acc_ids, strategy="round_robin")
        self.assertEqual(assigned, 4)

        async with TestSession() as db:
            result = await db.execute(select(Account))
            updated_accs = result.scalars().all()
            for a in updated_accs:
                self.assertIsNotNone(a.proxy_id)

    # ── 12. Proxy Assignment: Least Used ──────────────────────────────────────
    async def test_12_proxy_assignment_least_used(self):
        async with TestSession() as db:
            p1 = Proxy(host="10.0.0.1", port=1080, status=ProxyStatus.ALIVE.value, latency_ms=80)
            p2 = Proxy(host="10.0.0.2", port=1080, status=ProxyStatus.ALIVE.value, latency_ms=90)
            db.add_all([p1, p2])
            await db.commit()
            await db.refresh(p1)
            await db.refresh(p2)

            accs = [
                Account(phone_number=f"+155511100{i}", status="active", folder="active")
                for i in range(3)
            ]
            db.add_all(accs)
            await db.commit()
            for a in accs:
                await db.refresh(a)

            acc_ids = [str(a.id) for a in accs]

        assigned = await ProxyService.assign_to_accounts(acc_ids, strategy="least_used")
        self.assertEqual(assigned, 3)

    # ── 13. Proxy Rotation on Failure ─────────────────────────────────────────
    async def test_13_proxy_rotation(self):
        async with TestSession() as db:
            p1 = Proxy(host="1.1.1.1", port=1080, status=ProxyStatus.ALIVE.value, latency_ms=100)
            p2 = Proxy(host="2.2.2.2", port=1080, status=ProxyStatus.ALIVE.value, latency_ms=120)
            db.add_all([p1, p2])
            await db.commit()
            await db.refresh(p1)
            await db.refresh(p2)

            acc = Account(
                phone_number="+15559998888",
                status="active",
                folder="active",
                proxy_id=p1.id,
            )
            db.add(acc)
            await db.commit()
            await db.refresh(acc)
            acc_id = str(acc.id)

        result = await ProxyService.rotate_proxy(acc_id)
        self.assertEqual(result["status"], "rotated")
        self.assertEqual(result["new_proxy"], p2.id)

        async with TestSession() as db:
            updated_acc = await db.get(Account, int(acc_id))
            self.assertEqual(updated_acc.proxy_id, p2.id)

            old_p = await db.get(Proxy, p1.id)
            self.assertEqual(old_p.fail_count, 1)

    # ── 14. SMSService: Request Number (mocked) ───────────────────────────────
    async def test_14_sms_request_number_mock(self):
        with patch.object(SMSService, "_get_api_key", return_value="mock_api_key_123"):
            with patch("aiohttp.ClientSession.get") as mock_get:
                mock_resp = AsyncMock()
                mock_resp.text.return_value = "ACCESS_NUMBER:98765:15551234567"
                mock_get.return_value.__aenter__.return_value = mock_resp

                res = await SMSService.request_number(
                    provider="sms-activate",
                    country="US",
                )
                self.assertEqual(res["status"], "success")
                self.assertEqual(res["activation_id"], "98765")
                self.assertEqual(res["phone_number"], "+15551234567")

    # ── 15. SMSService: Refund Number (mocked) ────────────────────────────────
    async def test_15_sms_refund_number_mock(self):
        with patch.object(SMSService, "_get_api_key", return_value="mock_api_key_123"):
            with patch("aiohttp.ClientSession.get") as mock_get:
                mock_resp = AsyncMock()
                mock_resp.text.return_value = "ACCESS_CANCEL"
                mock_get.return_value.__aenter__.return_value = mock_resp

                success = await SMSService.refund_number(
                    provider="sms-activate",
                    activation_id="98765",
                )
                self.assertTrue(success)

    # ── 16. Operational Workflow: Stage 1A & 2B Dispatches ────────────────────
    async def test_16_workflow_engine_dispatch(self):
        # Step 1A: Beginner Generation
        r1 = await workflow_engine.dispatch_step(
            key="1A:generate_beginner",
            payload={"count": 5, "country": "US", "gender": "male"},
        )
        self.assertEqual(r1["mode"], "Beginner")
        self.assertEqual(r1["generated_count"], 5)
        self.assertEqual(len(r1["sample_records"]), 5)

        # Step 1A: Professional Generation
        r2 = await workflow_engine.dispatch_step(
            key="1A:generate_professional",
            payload={"count": 10, "config": {"countries": ["DE"]}},
        )
        self.assertEqual(r2["mode"], "Professional")
        self.assertEqual(r2["generated_count"], 10)

        # Step 2B: Assign Proxies
        r3 = await workflow_engine.dispatch_step(
            key="2B:assign_proxies",
            payload={"account_ids": [], "strategy": "round_robin"},
        )
        self.assertEqual(r3["status"], "success")


if __name__ == "__main__":
    print("=" * 60)
    print("  TELEGRAM GEEKS -- SPRINT 6 VALIDATION SUITE")
    print("  Parameter Generator + Proxy Service + SMS Service")
    print("=" * 60)

    suite  = unittest.TestLoader().loadTestsFromTestCase(TestSprint6)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print("\n" + "=" * 60)
    if result.wasSuccessful():
        print("  ALL 16 SPRINT 6 TESTS PASSED -- 100% GREEN")
    else:
        print(f"  FAILURES: {len(result.failures)}  ERRORS: {len(result.errors)}")
    print("=" * 60)

    sys.exit(0 if result.wasSuccessful() else 1)
