"""Tests for ProxyPool."""

import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from backend.app.models.base import Base
from backend.app.models import Proxy
from telegram_layer.src.proxy.pool import ProxyPool


@pytest.fixture
def sync_engine():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture
def sync_session(sync_engine):
    Session = sessionmaker(bind=sync_engine)
    session = Session()
    yield session
    session.close()


def seed_proxy(sync_session, **kwargs):
    data = {
        "provider": kwargs.get("provider", "test"),
        "proxy_type": kwargs.get("proxy_type", "socks5"),
        "host": kwargs.get("host", "127.0.0.1"),
        "port": kwargs.get("port", 9050),
        "status": kwargs.get("status", "healthy"),
        "country": kwargs.get("country", "US"),
        "success_count": kwargs.get("success_count", 10),
        "fail_count": kwargs.get("fail_count", 0),
        "response_time_ms": kwargs.get("response_time_ms", 100),
        "source": kwargs.get("source", "test"),
    }
    p = Proxy(**data)
    sync_session.add(p)
    sync_session.commit()
    return p.id


class TestGetHealthyProxy:
    async def test_returns_none_when_none_exist(self):
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        factory = async_sessionmaker(engine, class_=AsyncSession)
        pool = ProxyPool(factory)

        result = await pool.get_healthy_proxy(account_id=1)
        assert result is None

        await engine.dispose()

    async def test_returns_healthy_proxy(self):
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with AsyncSession(engine) as session:
            session.add(Proxy(
                provider="test", host="127.0.0.1", port=9050,
                status="healthy", country="US",
                success_count=10, fail_count=0, response_time_ms=100,
                source="test",
            ))
            await session.commit()

        factory = async_sessionmaker(engine, class_=AsyncSession)
        pool = ProxyPool(factory)

        result = await pool.get_healthy_proxy(account_id=1)
        assert result is not None
        assert result["host"] == "127.0.0.1"
        assert result["port"] == 9050
        assert result["allocated_to_account_id"] == 1
        assert result["allocated_at"] is not None

        await engine.dispose()

    async def test_filters_by_country(self):
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with AsyncSession(engine) as session:
            session.add_all([
                Proxy(provider="test", host="1.1.1.1", port=9050, status="healthy", country="US",
                      success_count=10, fail_count=0, response_time_ms=100, source="test"),
                Proxy(provider="test", host="2.2.2.2", port=9050, status="healthy", country="DE",
                      success_count=10, fail_count=0, response_time_ms=100, source="test"),
            ])
            await session.commit()

        factory = async_sessionmaker(engine, class_=AsyncSession)
        pool = ProxyPool(factory)

        result = await pool.get_healthy_proxy(account_id=1, country="DE")
        assert result is not None
        assert result["host"] == "2.2.2.2"

        await engine.dispose()

    async def test_skips_expired_proxies(self):
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with AsyncSession(engine) as session:
            session.add(
                Proxy(provider="test", host="1.1.1.1", port=9050, status="healthy", country="US",
                      expires_at=datetime.now(timezone.utc) - timedelta(days=1),
                      success_count=10, fail_count=0, response_time_ms=100, source="test"),
            )
            await session.commit()

        factory = async_sessionmaker(engine, class_=AsyncSession)
        pool = ProxyPool(factory)

        result = await pool.get_healthy_proxy(account_id=1)
        assert result is None

        await engine.dispose()


class TestReleaseProxy:
    async def test_frees_proxy(self):
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with AsyncSession(engine) as session:
            p = Proxy(provider="test", host="1.1.1.1", port=9050, status="healthy",
                      allocated_to_account_id=5,
                      allocated_at=datetime.now(timezone.utc),
                      success_count=10, fail_count=0, response_time_ms=100, source="test")
            session.add(p)
            await session.commit()
            pid = p.id

        factory = async_sessionmaker(engine, class_=AsyncSession)
        pool = ProxyPool(factory)
        await pool.release_proxy(pid)

        async with AsyncSession(engine) as session:
            result = await session.get(Proxy, pid)
            assert result.allocated_to_account_id is None
            assert result.allocated_at is None

        await engine.dispose()

    async def test_noop_for_missing_proxy(self):
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        factory = async_sessionmaker(engine, class_=AsyncSession)
        pool = ProxyPool(factory)
        await pool.release_proxy(999)
        await engine.dispose()


class TestStats:
    async def test_stats_calculation(self):
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with AsyncSession(engine) as session:
            session.add_all([
                Proxy(provider="brightdata", host="1.1.1.1", port=9050, status="healthy", country="US",
                      success_count=10, fail_count=0, response_time_ms=100, source="test"),
                Proxy(provider="brightdata", host="2.2.2.2", port=9050, status="slow", country="US",
                      success_count=10, fail_count=0, response_time_ms=6000, source="test"),
                Proxy(provider="oxylabs", host="3.3.3.3", port=9050, status="dead", country="DE",
                      fail_count=10, success_count=0, response_time_ms=1000, source="test"),
                Proxy(provider="oxylabs", host="4.4.4.4", port=9050, status="healthy", country="DE",
                      success_count=10, fail_count=0, response_time_ms=50, source="test"),
                Proxy(provider="manual", host="5.5.5.5", port=9050, status="failing", country="GB",
                      fail_count=6, success_count=4, response_time_ms=200, source="test"),
            ])
            await session.commit()

        factory = async_sessionmaker(engine, class_=AsyncSession)
        pool = ProxyPool(factory)
        stats = await pool.get_stats()

        assert stats["total"] == 5
        assert stats["by_status"]["healthy"] == 2
        assert stats["by_status"]["slow"] == 1
        assert stats["by_status"]["dead"] == 1
        assert stats["by_status"]["failing"] == 1
        assert stats["by_provider"]["brightdata"] == 2
        assert stats["by_provider"]["oxylabs"] == 2
        assert stats["by_country"]["US"] == 2
        assert stats["by_country"]["DE"] == 2
        assert stats["by_country"]["GB"] == 1

        await engine.dispose()
