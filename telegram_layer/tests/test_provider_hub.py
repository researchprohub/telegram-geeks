"""Tests for ProxyProviderHub."""

import pytest
from telegram_layer.src.proxy.provider_hub import ProxyProviderHub, ProxyProviderConfig


@pytest.fixture
def hub():
    h = ProxyProviderHub()
    h.load_defaults()
    return h


class TestProviderCount:
    def test_load_defaults_registers_all_62_providers(self, hub):
        all_providers = hub.list_providers()
        assert len(all_providers) == 62


class TestLookup:
    def test_lookup_by_name_returns_config(self, hub):
        cfg = hub.get("brightdata")
        assert cfg is not None
        assert cfg.name == "brightdata"

    def test_lookup_by_name_returns_none_for_unknown(self, hub):
        assert hub.get("nonexistent") is None


class TestFiltering:
    def test_filter_free(self, hub):
        free = hub.free_providers()
        assert len(free) == 15
        assert all(p["free"] for p in free)

    def test_filter_paid(self, hub):
        paid = hub.paid_providers()
        assert len(paid) == 47
        assert all(not p["free"] for p in paid)

    def test_filter_by_country(self, hub):
        result = hub.get_by_country("US")
        assert isinstance(result, list)


class TestRegistration:
    def test_register_replaces_existing(self, hub):
        original = hub.get("brightdata")
        assert original is not None
        assert original.proxy_type == "socks5"

        replacement = ProxyProviderConfig(name="brightdata", proxy_type="http")
        hub.register(replacement)
        updated = hub.get("brightdata")
        assert updated.proxy_type == "http"

    def test_empty_hub(self):
        h = ProxyProviderHub()
        assert h.list_providers() == []
        assert h.free_providers() == []
        assert h.paid_providers() == []
