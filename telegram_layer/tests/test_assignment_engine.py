"""Tests for ProxyAssignmentEngine."""

import pytest
from unittest.mock import AsyncMock, MagicMock

from telegram_layer.src.proxy.assignment_engine import (
    ProxyAssignmentEngine,
    ProxyAssignmentPolicy,
    DEFAULT_POLICY,
)


@pytest.fixture
def mock_pool():
    pool = MagicMock()
    pool.get_healthy_proxy = AsyncMock(return_value={"id": 1, "host": "1.1.1.1", "port": 9050, "status": "healthy", "fail_count": 0})
    pool.release_proxy = AsyncMock()
    return pool


@pytest.fixture
def mock_hub():
    return MagicMock()


@pytest.fixture
def engine(mock_pool, mock_hub):
    return ProxyAssignmentEngine(mock_pool, mock_hub)


class TestAssignForAccount:
    async def test_uses_default_policy_when_none_provided(self, engine, mock_pool):
        result = await engine.assign_for_account(account_id=1)

        assert result is not None
        assert result["policy"] == dict(DEFAULT_POLICY)
        mock_pool.get_healthy_proxy.assert_awaited_once_with(1, None)

    async def test_sticky_returns_existing_proxy(self, engine):
        proxy = {"id": 1, "status": "healthy", "fail_count": 0}
        engine._assignments[1] = [proxy]

        result = await engine.assign_for_account(account_id=1, policy={"sticky": True})

        assert result is proxy
        assert len(engine._assignments[1]) == 1

    async def test_sticky_returns_slow_proxy(self, engine):
        proxy = {"id": 1, "status": "slow", "fail_count": 0}
        engine._assignments[1] = [proxy]

        result = await engine.assign_for_account(account_id=1, policy={"sticky": True})

        assert result is proxy

    async def test_non_sticky_forces_new_proxy(self, engine, mock_pool):
        proxy = {"id": 1, "status": "healthy", "fail_count": 0}
        engine._assignments[1] = [proxy]

        result = await engine.assign_for_account(account_id=1, policy={"sticky": False})

        assert result is not proxy
        assert result["id"] == 1
        mock_pool.get_healthy_proxy.assert_awaited_once()

    async def test_returns_none_when_pool_empty(self, engine, mock_pool):
        mock_pool.get_healthy_proxy.return_value = None

        result = await engine.assign_for_account(account_id=1)

        assert result is None

    async def test_enforces_max_proxies_per_account(self, engine, mock_pool):
        engine._assignments[1] = [
            {"id": 1, "status": "dead"},
            {"id": 2, "status": "dead"},
            {"id": 3, "status": "dead"},
            {"id": 4, "status": "dead"},
            {"id": 5, "status": "dead"},
        ]

        result = await engine.assign_for_account(account_id=1, policy={"max_proxies_per_account": 5, "sticky": False})

        assert result is None
        mock_pool.get_healthy_proxy.assert_not_called()

    async def test_passes_country_when_geo_targeting(self, engine, mock_pool):
        await engine.assign_for_account(account_id=1, country="DE", policy={"geo_targeting": True})

        mock_pool.get_healthy_proxy.assert_awaited_once_with(1, "DE")

    async def test_ignores_country_when_geo_targeting_off(self, engine, mock_pool):
        await engine.assign_for_account(account_id=1, country="DE", policy={"geo_targeting": False})

        mock_pool.get_healthy_proxy.assert_awaited_once_with(1, None)


class TestReleaseAccount:
    async def test_releases_all_proxies(self, engine, mock_pool):
        engine._assignments[1] = [
            {"id": 1, "status": "healthy"},
            {"id": 2, "status": "slow"},
        ]

        await engine.release_account(1)

        assert 1 not in engine._assignments
        mock_pool.release_proxy.assert_any_await(1)
        mock_pool.release_proxy.assert_any_await(2)

    async def test_noop_for_unknown_account(self, engine, mock_pool):
        await engine.release_account(999)

        mock_pool.release_proxy.assert_not_called()


class TestGetAccountProxies:
    async def test_returns_empty_list_for_unknown(self, engine):
        assert await engine.get_account_proxies(1) == []

    async def test_returns_tracked_proxies(self, engine):
        proxies = [{"id": 1, "status": "healthy"}, {"id": 2, "status": "slow"}]
        engine._assignments[1] = proxies

        assert await engine.get_account_proxies(1) == proxies


class TestRunPolicyChecks:
    async def test_rotates_expired_proxies(self, engine, mock_pool):
        engine._assignments[1] = [
            {"id": 1, "status": "healthy", "assigned_at": 0, "policy": {"rotation_interval": 10, "fail_over_threshold": 3}},
        ]

        await engine.run_policy_checks()

        assert 1 not in engine._assignments
        mock_pool.release_proxy.assert_awaited_once_with(1)

    async def test_fails_over_high_fail_count(self, engine, mock_pool):
        engine._assignments[1] = [
            {"id": 1, "status": "healthy", "assigned_at": 9999999999, "fail_count": 5, "policy": {"rotation_interval": 9999, "fail_over_threshold": 3}},
        ]

        await engine.run_policy_checks()

        assert 1 not in engine._assignments
        mock_pool.release_proxy.assert_awaited_once_with(1)

    async def test_keeps_healthy_proxies(self, engine, mock_pool):
        now = 9999999999
        engine._assignments[1] = [
            {"id": 1, "status": "healthy", "assigned_at": now, "fail_count": 0, "policy": {"rotation_interval": 9999, "fail_over_threshold": 3}},
        ]

        await engine.run_policy_checks()

        assert len(engine._assignments[1]) == 1
        mock_pool.release_proxy.assert_not_called()

    async def test_cleans_up_empty_accounts(self, engine, mock_pool):
        engine._assignments[1] = [
            {"id": 1, "status": "healthy", "assigned_at": 0, "fail_count": 0, "policy": {"rotation_interval": 10, "fail_over_threshold": 3}},
        ]

        await engine.run_policy_checks()

        assert 1 not in engine._assignments


class TestGetAssignmentStats:
    async def test_returns_zero_when_empty(self, engine):
        stats = await engine.get_assignment_stats()

        assert stats == {"total_assignments": 0, "active_assignments": 0, "accounts_count": 0}

    async def test_counts_assignments(self, engine):
        engine._assignments[1] = [{"id": 1}, {"id": 2}]
        engine._assignments[2] = [{"id": 3}]

        stats = await engine.get_assignment_stats()

        assert stats == {"total_assignments": 3, "active_assignments": 3, "accounts_count": 2}
