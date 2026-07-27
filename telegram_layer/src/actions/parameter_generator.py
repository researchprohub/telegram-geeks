"""Parameter Generator module — generates registration parameters for Telegram accounts.

Telegram Expert manual: https://en.telegramexpert.pro/manuals/generator-parametrov

Supports two modes:
- Beginner Mode: Simplified form with dropdown selections
- Professional Mode: Full parameter control with device emulation
"""

import random
import csv
import os
from datetime import datetime, timezone
from typing import Dict, List, Optional
from loguru import logger


# Device database (sample from GitHub device list)
DEVICE_DATABASE = [
    # Huawei devices
    {"device": "huawei_hwpe", "model": "HUAWEI PE-TL10", "sdk": 30},  # Android 11
    {"device": "huawei_hwy618t", "model": "HUAWEY Y6 2018", "sdk": 27},  # Android 8.1
    {"device": "huawei_hwldnq", "model": "HUAWEI LDN-AL00", "sdk": 29},  # Android 10
    {"device": "huawei_hwagr2", "model": "HUAWEI GR2", "sdk": 23},  # Android 6.0
    {"device": "huawei_hwmed", "model": "HUAWEI MED-L29", "sdk": 29},  # Android 10
    
    # Samsung devices
    {"device": "samsung_sm_g973f", "model": "Samsung SM-G973F", "sdk": 29},  # Android 10
    {"device": "samsung_sm_g991b", "model": "Samsung SM-G991B", "sdk": 31},  # Android 12
    {"device": "samsung_sm_a515f", "model": "Samsung SM-A515F", "sdk": 30},  # Android 11
    {"device": "samsung_sm_m315f", "model": "Samsung SM-M315F", "sdk": 29},  # Android 10
    {"device": "samsung_sm_g998b", "model": "Samsung SM-G998B", "sdk": 32},  # Android 12L
    
    # Xiaomi devices
    {"device": "xiaomi_redmi_note_9", "model": "Redmi Note 9", "sdk": 29},  # Android 10
    {"device": "xiaomi_mi_11", "model": "Xiaomi Mi 11", "sdk": 31},  # Android 12
    {"device": "xiaomi_redmi_note_10", "model": "Redmi Note 10", "sdk": 30},  # Android 11
    {"device": "xiaomi_poco_x3", "model": "POCO X3", "sdk": 29},  # Android 10
    
    # Other manufacturers
    {"device": "oneplus_ne1111", "model": "OnePlus NE1111", "sdk": 31},  # Android 12
    {"device": "motorola_edg200", "model": "Motorola Edge 200", "sdk": 31},  # Android 12
    {"device": "oppo_cph2217", "model": "OPPO CPH2217", "sdk": 30},  # Android 11
]

# Timezone mappings
TIMEZONE_MAP = {
    "Russia": {"offset_seconds": 0, "offset_hours": 0, "tz": "Europe/Moscow"},
    "USA_Eastern": {"offset_seconds": -18000, "offset_hours": -5, "tz": "America/New_York"},
    "USA_Pacific": {"offset_seconds": -28800, "offset_hours": -8, "tz": "America/Los_Angeles"},
    "Canada": {"offset_seconds": -25200, "offset_hours": -7, "tz": "America/Vancouver"},
    "Malaysia": {"offset_seconds": 18000, "offset_hours": 5, "tz": "Asia/Kuala_Lumpur"},
    "Germany": {"offset_seconds": 3600, "offset_hours": 1, "tz": "Europe/Berlin"},
    "UK": {"offset_seconds": 0, "offset_hours": 0, "tz": "Europe/London"},
    "India": {"offset_seconds": 19800, "offset_hours": 5.5, "tz": "Asia/Kolkata"},
    "Japan": {"offset_seconds": 32400, "offset_hours": 9, "tz": "Asia/Tokyo"},
    "Australia_East": {"offset_seconds": 36000, "offset_hours": 10, "tz": "Australia/Sydney"},
}

# Telegram API ID:HASH combinations
API_CONFIGS = {
    "android": {"api_id": 4, "api_hash": "014b35b6184100b085b0d0572f9b5103"},
    "android_x": {"api_id": 21724, "api_hash": "3e0cb5efcd52300aec5994fdfc5bdc16"},
    "desktop": {"api_id": 2040, "api_hash": "b18441a1ff607e10a989891a5462e627"},
}

# App versions for Telegram Android
APP_VERSIONS_ANDROID = [
    "11.3.2 (53932)",
    "11.2.3 (53352)",
    "11.2.2 (53292)",
    "11.1.1 (52891)",
    "11.0.1 (52444)",
]

# SDK to Android version mapping
SDK_ANDROID_MAP = {
    23: "6.0",
    24: "7.0",
    25: "7.1",
    26: "8.0",
    27: "8.1",
    28: "9",
    29: "10",
    30: "11",
    31: "12",
    32: "12L",
    33: "13",
}


class ParameterGeneratorService:
    """Generate registration parameters for Telegram accounts."""

    def __init__(self):
        self.generation_history: List[Dict] = []

    def generate_beginner(
        self,
        app_type: str = "android",
        timezone_name: str = "Russia",
        manufacturer: str = "Samsung",
        app_version: str = "latest",
        language: str = "ru",
        count: int = 100,
    ) -> Dict:
        """Generate parameters in beginner mode with simplified options.
        
        Args:
            app_type: "android", "android_x", or "desktop"
            timezone_name: Country name for timezone
            manufacturer: Phone manufacturer
            app_version: "latest" or specific version
            language: App language code
            count: Number of parameter sets to generate
        """
        logger.info(f"Generating beginner parameters: type={app_type}, tz={timezone_name}, count={count}")
        
        api_config = API_CONFIGS.get(app_type, API_CONFIGS["android"])
        tz_config = TIMEZONE_MAP.get(timezone_name, TIMEZONE_MAP["Russia"])
        
        params_list = []
        for i in range(count):
            # Select random device from manufacturer
            devices = [d for d in DEVICE_DATABASE if manufacturer.lower() in d["model"].lower()]
            if not devices:
                devices = DEVICE_DATABASE  # Fallback to any device
            
            device = random.choice(devices)
            
            # Select app version
            if app_version == "latest":
                selected_version = random.choice(APP_VERSIONS_ANDROID)
            else:
                selected_version = app_version
            
            param_set = {
                "row_id": i + 1,
                "api_id": api_config["api_id"],
                "api_hash": api_config["api_hash"],
                "device": device["device"],
                "model": device["model"],
                "sdk": device["sdk"],
                "android_version": SDK_ANDROID_MAP.get(device["sdk"], "11"),
                "app_version": selected_version,
                "timezone_offset": tz_config["offset_seconds"],
                "timezone_hours": tz_config["offset_hours"],
                "language": language,
                "system_language": f"{language}-{language.upper()}",
                "device_class": 3 if device["sdk"] >= 30 else 2,
                "device_code": "android" if app_type == "android" else "desktop",
            }
            params_list.append(param_set)
        
        result = {
            "status": "success",
            "mode": "beginner",
            "count": len(params_list),
            "parameters": params_list,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        self.generation_history.append(result)
        return result

    def generate_professional(
        self,
        api_id: int = 4,
        api_hash: str = "014b35b6184100b085b0d0572f9b5103",
        device_list: Optional[List[str]] = None,
        sdk_versions: Optional[List[int]] = None,
        app_versions: Optional[List[str]] = None,
        app_language: str = "ru",
        system_language: str = "ru-RU",
        device_code: str = "android",
        device_class: int = 3,
        timezone_offset: int = 0,
        spintax_devices: Optional[str] = None,
        spintax_sdk: Optional[str] = None,
        spintax_versions: Optional[str] = None,
        count: int = 1000,
        output_path: Optional[str] = None,
        append_to_database: Optional[str] = None,
    ) -> Dict:
        """Generate parameters in professional mode with full control.
        
        Args:
            api_id: Telegram API ID
            api_hash: Telegram API Hash
            device_list: List of device identifiers
            sdk_versions: List of SDK versions
            app_versions: List of app versions
            app_language: Application language
            system_language: System language with country code
            device_code: "android" or "desktop"
            device_class: 2 (older) or 3 (newer)
            timezone_offset: Timezone offset in seconds
            spintax_devices: Spintax for device randomization
            spintax_sdk: Spintax for SDK randomization
            spintax_versions: Spintax for app version randomization
            count: Number of parameter sets to generate
            output_path: Path to save CSV database
            append_to_database: Path to existing database to append to
        """
        logger.info(f"Generating professional parameters: count={count}")
        
        # Resolve spintax
        devices = self._resolve_spintax(spintax_devices, device_list or DEVICE_DATABASE)
        sdks = self._resolve_spintax(spintax_sdk, sdk_versions or [29, 30, 31, 32, 33])
        versions = self._resolve_spintax(spintax_versions, app_versions or APP_VERSIONS_ANDROID)
        
        params_list = []
        for i in range(count):
            # Random selection from spintax options
            device = random.choice(devices) if devices else random.choice(DEVICE_DATABASE)
            sdk = random.choice(sdks) if sdks else 30
            app_ver = random.choice(versions) if versions else random.choice(APP_VERSIONS_ANDROID)
            
            param_set = {
                "row_id": i + 1,
                "api_id": api_id,
                "api_hash": api_hash,
                "device": device if isinstance(device, str) else device.get("device", ""),
                "model": device if isinstance(device, str) else device.get("model", ""),
                "sdk": sdk,
                "android_version": SDK_ANDROID_MAP.get(sdk, "11"),
                "app_version": app_ver,
                "timezone_offset": timezone_offset,
                "language": app_language,
                "system_language": system_language,
                "device_class": device_class,
                "device_code": device_code,
            }
            params_list.append(param_set)
        
        result = {
            "status": "success",
            "mode": "professional",
            "count": len(params_list),
            "parameters": params_list[:100],  # Return first 100 for preview
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        # Save to CSV if output_path provided
        if output_path:
            self._save_to_csv(params_list, output_path, append_to_database)
            result["csv_path"] = output_path
        
        self.generation_history.append(result)
        return result

    def _resolve_spintax(self, spintax: Optional[str], default_list: List) -> List:
        """Resolve spintax syntax like {opt1|opt2|opt3}."""
        if not spintax:
            return default_list
        
        import re
        pattern = r'\{([^}]+)\}'
        matches = re.findall(pattern, spintax)
        
        if matches:
            # Expand all spintax combinations
            options = [m.split('|') for m in matches]
            from itertools import product
            combinations = list(product(*options))
            return [','.join(c) for c in combinations]
        
        return default_list

    def _save_to_csv(self, params_list: List[Dict], output_path: str, append_to: Optional[str] = None):
        """Save parameters to CSV database file."""
        if not params_list:
            return
        
        fieldnames = list(params_list[0].keys())
        
        # Append to existing database if specified
        mode = 'a' if append_to and os.path.exists(append_to) else 'w'
        
        with open(output_path, mode, newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            if mode == 'w':
                writer.writeheader()
            elif append_to:
                # Append without header
                pass
            
            writer.writerows(params_list)
        
        logger.info(f"Saved {len(params_list)} parameters to {output_path}")

    def get_generation_history(self, limit: int = 50) -> List[Dict]:
        """Get history of parameter generations."""
        return self.generation_history[-limit:]
