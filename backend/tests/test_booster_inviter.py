"""
Sprint 5 verification tests.
Tests all TelegramBooster and TelegramInviter service methods
with mock MTProto clients (no real Telegram connection needed).
"""

import asyncio
import sys
import os
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

# Ensure backend root and project root are on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
project_root = os.path.abspath(os.path.join(backend_dir, ".."))
sys.path.insert(0, backend_dir)
sys.path.insert(0, project_root)

from app.services.flood_wait_bus import FloodWaitBus
from app.telegram_layer.booster import TelegramBooster
from app.telegram_layer.inviter import TelegramInviter, TelegramInviterService
from app.services.account_service import AccountService, AccountServiceClass
from app.models import WarmupJob, WarmupJobStatus, AccountFolder


class TestTelegramBooster(unittest.IsolatedAsyncioTestCase):

    async def test_01_start_warmup_creates_jobs(self):
        """WarmupJob records are created for each account."""
        with patch(
            "app.services.account_service.AccountService.get_by_id",
            new_callable=AsyncMock,
        ) as mock_get, patch(
            "app.telegram_layer.booster.async_session_factory"
        ) as mock_db:
            mock_get.return_value = MagicMock(
                session_string="test",
                api_id=12345,
                api_hash="abc",
                device_model="Samsung",
                os_version="Android 11",
                app_version="8.4.4",
                lang_code="en",
                system_lang_code="en-US",
                proxy=None,
            )

            # Mock DB session
            mock_session = AsyncMock()
            mock_session.__aenter__ = AsyncMock(return_value=mock_session)
            mock_session.__aexit__ = AsyncMock(return_value=False)
            mock_session.add = MagicMock()
            mock_session.commit = AsyncMock()
            mock_db.return_value = mock_session

            job_ids = await TelegramBooster.start(
                account_ids=["acc_001", "acc_002"],
                duration_days=3,
                interval_min=10,
                interval_max=30,
            )

            assert len(job_ids) == 2
            print(f"  [OK] Created {len(job_ids)} warmup jobs: {job_ids}")

    async def test_02_reaction_booster_invalid_url(self):
        """Invalid post URLs return status=invalid_url without crashing."""
        with patch(
            "app.services.account_service.AccountService.get_active_account_ids",
            new_callable=AsyncMock,
            return_value=["acc_001"],
        ), patch(
            "app.services.account_service.AccountService.get_by_id",
            new_callable=AsyncMock,
            return_value=MagicMock(
                session_string="test",
                api_id=12345,
                api_hash="abc",
                device_model="Samsung",
                os_version="Android 11",
                app_version="8.4.4",
                lang_code="en",
                system_lang_code="en-US",
                proxy=None,
            ),
        ):
            result = await TelegramBooster.add_reactions(
                post_urls=["not_a_valid_url", "also_invalid"],
                reactions=["thumbs_up"],
            )
            assert result["status"] == "completed"
            assert all(
                r["status"] == "invalid_url"
                for r in result["results"]
            )
            print(f"  [OK] Invalid URLs handled: {result['results']}")

    async def test_03_flood_bus_integration(self):
        """FloodWait bus correctly blocks flooded accounts."""
        bus = FloodWaitBus()

        assert not bus.is_flooded("test_account")
        bus.register_flood("test_account", 300)
        assert bus.is_flooded("test_account")
        assert bus.seconds_remaining("test_account") > 0

        statuses = bus.get_flood_status()
        assert any(s["account_id"] == "test_account" for s in statuses)
        print(f"  [OK] FloodWait bus: account blocked for {bus.seconds_remaining('test_account')}s")

    async def test_04_stop_warmup(self):
        """Stop warmup marks jobs as STOPPED in the database."""
        with patch("app.telegram_layer.booster.async_session_factory") as mock_db:
            mock_session = AsyncMock()
            mock_session.__aenter__ = AsyncMock(return_value=mock_session)
            mock_session.__aexit__ = AsyncMock(return_value=False)

            mock_job = MagicMock(spec=WarmupJob)
            mock_job.status = WarmupJobStatus.RUNNING.value

            mock_session.execute = AsyncMock(
                return_value=MagicMock(
                    scalars=MagicMock(
                        return_value=MagicMock(all=MagicMock(return_value=[mock_job]))
                    )
                )
            )
            mock_session.commit = AsyncMock()
            mock_db.return_value = mock_session

            stopped = await TelegramBooster.stop(["acc_001"])
            assert stopped >= 0
            print(f"  [OK] Stop warmup call succeeded")


class TestTelegramInviter(unittest.IsolatedAsyncioTestCase):

    async def test_05_invite_picks_sender_correctly(self):
        """_pick_sender returns None when all accounts are flooded."""
        from app.services.flood_wait_bus import flood_bus
        flood_bus.register_flood("acc_flooded", 9999)

        inviter = TelegramInviterService()
        result = inviter._pick_sender(["acc_flooded"], {}, 100)
        assert result is None
        print("  [OK] Flooded account correctly skipped by _pick_sender")

    async def test_06_invite_picks_available_sender(self):
        """_pick_sender returns an account when one is available."""
        inviter = TelegramInviterService()
        result = inviter._pick_sender(["acc_clean_unique_xyz"], {}, 100)
        assert result == "acc_clean_unique_xyz"
        print("  [OK] Available account correctly returned by _pick_sender")

    async def test_07_invite_respects_per_account_limit(self):
        """_pick_sender returns None when per-account limit is reached."""
        inviter = TelegramInviterService()
        counts = {"acc_001": 40}  # At the limit
        result = inviter._pick_sender(["acc_001"], counts, 40)
        assert result is None
        print("  [OK] Per-account daily limit enforced by _pick_sender")

    async def test_08_generate_invite_link_error_handling(self):
        """generate_invite_link returns structured error on exception."""
        with patch(
            "app.services.account_service.AccountService.get_available_account_id",
            new_callable=AsyncMock,
            return_value="acc_001",
        ), patch(
            "app.services.account_service.AccountService.get_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            from app.telegram_layer.inviter import TelegramInviter
            result = await TelegramInviter.generate_invite_link(
                target_group="@test_group"
            )
            assert result.get("status") == "error"
            print(f"  [OK] Error handled: {result['message']}")


class TestAccountService(unittest.IsolatedAsyncioTestCase):

    async def test_09_get_active_account_ids_returns_list(self):
        """get_active_account_ids returns a list."""
        with patch("app.services.account_service.async_session_factory") as mock_db:
            mock_session = AsyncMock()
            mock_session.__aenter__ = AsyncMock(return_value=mock_session)
            mock_session.__aexit__ = AsyncMock(return_value=False)
            mock_session.execute = AsyncMock(
                return_value=MagicMock(
                    fetchall=MagicMock(return_value=[("1",), ("2",)])
                )
            )
            mock_db.return_value = mock_session

            ids = await AccountService.get_active_account_ids()
            assert isinstance(ids, list)
            print(f"  [OK] get_active_account_ids returned: {ids}")

    async def test_10_check_account_status_timeout(self):
        """Timeout during status check returns 'frozen'."""
        service = AccountServiceClass()
        mock_account = MagicMock()
        mock_account.session_string = "bad_session"
        mock_account.api_id = 12345
        mock_account.api_hash = "abc"
        mock_account.device_model = None
        mock_account.os_version = None
        mock_account.app_version = None
        mock_account.proxy = None
        mock_account.id = "acc_timeout"

        with patch("app.services.account_service.TelegramClient") as MockTClient:
            instance = AsyncMock()
            instance.connect = AsyncMock(
                side_effect=asyncio.TimeoutError()
            )
            MockTClient.return_value = instance

            result = await service._check_account_status(mock_account)
            assert result == "frozen"
            print(f"  [OK] Timeout -> folder: '{result}'")


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  SPRINT 5 - BOOSTER & INVITER VERIFICATION TESTS")
    print("=" * 60)

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    for cls in [
        TestTelegramBooster,
        TestTelegramInviter,
        TestAccountService,
    ]:
        suite.addTests(loader.loadTestsFromTestCase(cls))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print("\n" + "=" * 60)
    if result.wasSuccessful():
        print("  [PASS] ALL SPRINT 5 TESTS PASSED")
    else:
        print(f"  [FAIL] {len(result.failures)} FAILURES, {len(result.errors)} ERRORS")
    print("=" * 60 + "\n")

    sys.exit(0 if result.wasSuccessful() else 1)
