"""GlobalConfig — Centralized proxy, timeout, delay, thread, GPT, and license settings."""
import json
import os
from datetime import datetime
from loguru import logger

CONFIG_PATH = os.environ.get("TEGLOBAL_CONFIG_PATH", os.path.join(os.path.dirname(__file__), "..", "..", "config", "global_config.json"))


class GlobalConfigService:
    def __init__(self):
        self._config = self._load()

    def _load(self) -> dict:
        try:
            if os.path.exists(CONFIG_PATH):
                with open(CONFIG_PATH) as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load config: {e}")
        return self._defaults()

    def _save(self):
        os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
        with open(CONFIG_PATH, "w") as f:
            json.dump(self._config, f, indent=2)

    @staticmethod
    def _defaults() -> dict:
        return {
            "proxy": {"enabled": False, "source": "account", "timeout": 5, "retry_count": 3, "connection_delay": 1, "auto_switch": True},
            "delays": {"min_seconds": 3, "max_seconds": 15},
            "threads": {"stream_control": False, "max_streams": 5},
            "gpt": {"enabled": False, "model": "gpt-4o-mini", "api_key": ""},
            "license": {"key": "", "last_verified": None, "valid": False},
            "antivirus": {"last_warned": None},
            "updated_at": None,
        }

    def get(self, section: str = "", key: str = "") -> any:
        if not section:
            return self._config
        val = self._config.get(section, {})
        if key:
            return val.get(key) if isinstance(val, dict) else None
        return val

    def set(self, section: str, key: str, value: any):
        if section not in self._config:
            self._config[section] = {}
        self._config[section][key] = value
        self._config["updated_at"] = datetime.utcnow().isoformat()
        self._save()

    def update_section(self, section: str, data: dict):
        if section not in self._config:
            self._config[section] = {}
        self._config[section].update(data)
        self._config["updated_at"] = datetime.utcnow().isoformat()
        self._save()

    def get_all(self) -> dict:
        return {**self._config, "config_path": CONFIG_PATH}

    def check_license(self) -> dict:
        key = self._config.get("license", {}).get("key", "")
        # ponytail: basic length check, real validation when licensing infra exists
        valid = len(key) >= 16
        self._config["license"]["valid"] = valid
        self._config["license"]["last_verified"] = datetime.utcnow().isoformat()
        self._save()
        return {"valid": valid, "key_prefix": key[:8] + "..." if key else "", "last_verified": self._config["license"]["last_verified"]}

    def set_license(self, key: str) -> dict:
        self._config["license"]["key"] = key
        return self.check_license()
