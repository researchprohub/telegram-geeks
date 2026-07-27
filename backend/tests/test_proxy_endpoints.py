"""Tests for proxy management API endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api.v1.endpoints.proxies import _hub, _pool, _engine, init_proxy_system


@pytest.fixture(autouse=True)
def _reset_proxy_system():
    init_proxy_system()
    yield


@pytest.fixture
def client():
    return TestClient(app)


def test_list_providers(client):
    resp = client.get("/api/v1/proxies/providers")
    assert resp.status_code == 200
    data = resp.json()
    assert "providers" in data
    assert len(data["providers"]) > 0


def test_free_providers(client):
    resp = client.get("/api/v1/proxies/providers/free")
    assert resp.status_code == 200
    data = resp.json()
    assert "providers" in data
    for p in data["providers"]:
        assert p["free"] is True


def test_paid_providers(client):
    resp = client.get("/api/v1/proxies/providers/paid")
    assert resp.status_code == 200
    data = resp.json()
    assert "providers" in data
    for p in data["providers"]:
        assert p["free"] is False


def test_get_provider(client):
    resp = client.get("/api/v1/proxies/providers/brightdata")
    assert resp.status_code == 200
    assert resp.json()["name"] == "brightdata"


def test_get_provider_not_found(client):
    resp = client.get("/api/v1/proxies/providers/nonexistent")
    assert resp.status_code == 404


def test_providers_by_country(client):
    resp = client.get("/api/v1/proxies/providers/country/US")
    assert resp.status_code == 200
    data = resp.json()
    assert data["country"] == "US"
    assert "providers" in data


def test_pool_stats(client):
    resp = client.get("/api/v1/proxies/pool/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "by_status" in data


def test_assignment_stats(client):
    resp = client.get("/api/v1/proxies/assignments/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_assignments" in data
    assert "active_assignments" in data
