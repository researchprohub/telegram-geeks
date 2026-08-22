"""
ParameterGenerator — Generates realistic Telegram device fingerprints
                     for account registration and session creation.

Beginner Mode:  Simplified — picks random valid presets for country + device.
Professional Mode: Full control over every parameter field.
                   Outputs a database of up to 1M parameter rows.

Output format:
  {
    "api_id":           12345,
    "api_hash":         "abc123...",
    "device_model":     "Samsung Galaxy S23",
    "system_version":   "Android 13",
    "app_version":      "10.3.2",
    "lang_code":        "en",
    "system_lang_code": "en-US",
    "first_name":       "Michael",
    "last_name":        "Reed",
    "phone_prefix":     "+1",
    "generated_at":     "2026-08-22T...",
  }
"""

import random
import uuid
from datetime import datetime, timezone
from typing import Literal, Optional, List, Dict, Any


# ─── Device Fingerprint Library ───────────────────────────────────────────────

ANDROID_DEVICES = [
    # (model_name, android_version, screen_res)
    ("Samsung Galaxy S24 Ultra", "14",   "3088x1440"),
    ("Samsung Galaxy S23",       "13",   "2340x1080"),
    ("Samsung Galaxy S22",       "12",   "2340x1080"),
    ("Samsung Galaxy A54",       "13",   "2340x1080"),
    ("Samsung Galaxy A34",       "13",   "2340x1080"),
    ("Xiaomi 13 Pro",            "13",   "3200x1440"),
    ("Xiaomi 12",                "12",   "2400x1080"),
    ("Xiaomi Redmi Note 12",     "13",   "2400x1080"),
    ("Xiaomi Redmi 12",          "13",   "1612x720"),
    ("OnePlus 11",               "13",   "3216x1440"),
    ("OnePlus 9 Pro",            "12",   "3216x1440"),
    ("OPPO Find X6",             "13",   "2772x1240"),
    ("OPPO Reno 8",              "12",   "2400x1080"),
    ("Realme GT 5",              "13",   "2772x1240"),
    ("Realme 11 Pro",            "13",   "2400x1080"),
    ("Vivo X90 Pro",             "13",   "2800x1260"),
    ("Huawei P60 Pro",           "13",   "2700x1220"),
    ("Google Pixel 8 Pro",       "14",   "2992x1344"),
    ("Google Pixel 8",           "14",   "2400x1080"),
    ("Google Pixel 7a",          "13",   "2400x1080"),
    ("Motorola Edge 40",         "13",   "2400x1080"),
    ("Nokia G60",                "12",   "2408x1080"),
    ("Sony Xperia 1 V",          "13",   "3840x1644"),
    ("Sony Xperia 5 V",          "13",   "2520x1080"),
    ("LG V60 ThinQ",             "12",   "2460x1080"),
    ("Asus ROG Phone 7",         "13",   "2448x1080"),
    ("ZTE Blade V40 Pro",        "12",   "2400x1080"),
    ("Infinix Note 30",          "13",   "2400x1080"),
    ("Tecno Spark 20",           "13",   "1612x720"),
    ("Blackview BL8800 Pro",     "12",   "2408x1080"),
]

# Official Telegram Android App versions (historical — realistic spread)
TELEGRAM_APP_VERSIONS = [
    "10.3.2", "10.2.9", "10.1.8", "10.0.7",
    "9.7.5",  "9.6.3",  "9.5.2",  "9.4.4",
    "9.3.3",  "9.2.1",  "9.1.7",  "9.0.6",
    "8.9.5",  "8.8.4",  "8.7.3",  "8.6.2",
    "8.5.4",  "8.4.4",
]

# Official Telegram API credentials pool
TELEGRAM_API_CREDENTIALS = [
    {"api_id": 2496,    "api_hash": "8da85b0d5bfe62527e5b244c209159c3"},
    {"api_id": 4096,    "api_hash": "014b35b6184100b085b0d0572f9b5103"},
    {"api_id": 6,       "api_hash": "eb06d4abfb49dc3eeb1aeb98ae0f581e"},
    {"api_id": 17349,   "api_hash": "344583e45741c457fe1862106095a5eb"},
    {"api_id": 21724,   "api_hash": "3e0cb5efcd52300aec5994fdfc5bdc16"},
]

# Country → (phone_prefix, lang_code, system_lang_code)
COUNTRY_PROFILES = {
    "US": ("+1",    "en",    "en-US"),
    "GB": ("+44",   "en",    "en-GB"),
    "AU": ("+61",   "en",    "en-AU"),
    "CA": ("+1",    "en",    "en-CA"),
    "DE": ("+49",   "de",    "de-DE"),
    "FR": ("+33",   "fr",    "fr-FR"),
    "ES": ("+34",   "es",    "es-ES"),
    "IT": ("+39",   "it",    "it-IT"),
    "PL": ("+48",   "pl",    "pl-PL"),
    "RU": ("+7",    "ru",    "ru-RU"),
    "UA": ("+380",  "uk",    "uk-UA"),
    "TR": ("+90",   "tr",    "tr-TR"),
    "IN": ("+91",   "en",    "en-IN"),
    "BR": ("+55",   "pt",    "pt-BR"),
    "MX": ("+52",   "es",    "es-MX"),
    "AR": ("+54",   "es",    "es-AR"),
    "NG": ("+234",  "en",    "en-NG"),
    "EG": ("+20",   "ar",    "ar-EG"),
    "SA": ("+966",  "ar",    "ar-SA"),
    "AE": ("+971",  "ar",    "ar-AE"),
    "JP": ("+81",   "ja",    "ja-JP"),
    "KR": ("+82",   "ko",    "ko-KR"),
    "CN": ("+86",   "zh",    "zh-CN"),
    "ID": ("+62",   "id",    "id-ID"),
    "PK": ("+92",   "ur",    "ur-PK"),
    "BD": ("+880",  "bn",    "bn-BD"),
    "VN": ("+84",   "vi",    "vi-VN"),
    "TH": ("+66",   "th",    "th-TH"),
    "PH": ("+63",   "en",    "en-PH"),
    "GH": ("+233",  "en",    "en-GH"),
}

# First name pools by gender
MALE_NAMES = [
    "James", "Oliver", "Noah", "William", "Ethan", "Liam", "Mason",
    "Jacob", "Logan", "Lucas", "Benjamin", "Alexander", "Henry",
    "Sebastian", "Jackson", "Aiden", "Matthew", "Samuel", "David",
    "Joseph", "Carter", "Owen", "Wyatt", "John", "Jack", "Luke",
    "Jayden", "Dylan", "Grayson", "Levi", "Isaac", "Gabriel",
    "Julian", "Mateo", "Anthony", "Jaxon", "Lincoln", "Joshua",
    "Christopher", "Andrew", "Theodore", "Caleb", "Ryan", "Asher",
    "Nathan", "Thomas", "Leo", "Isaiah", "Charles", "Josiah",
]

FEMALE_NAMES = [
    "Emma", "Olivia", "Ava", "Isabella", "Sophia", "Mia", "Charlotte",
    "Amelia", "Harper", "Evelyn", "Abigail", "Emily", "Elizabeth",
    "Mila", "Ella", "Avery", "Sofia", "Camila", "Aria", "Scarlett",
    "Victoria", "Madison", "Luna", "Grace", "Chloe", "Penelope",
    "Layla", "Riley", "Zoey", "Nora", "Lily", "Eleanor", "Hannah",
    "Lillian", "Addison", "Aubrey", "Ellie", "Stella", "Natalie",
    "Zoe", "Leah", "Hazel", "Violet", "Aurora", "Savannah", "Audrey",
    "Brooklyn", "Bella", "Claire", "Skylar",
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
    "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez",
    "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore",
    "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
    "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
    "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres",
    "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker",
    "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
]


class ParameterGeneratorClass:

    # ─────────────────────────────────────────────────────────────────────────
    # BEGINNER MODE
    # ─────────────────────────────────────────────────────────────────────────
    async def generate_beginner(
        self,
        count: int = 10,
        country: str = "US",
        gender: Literal["male", "female", "mixed"] = "mixed",
    ) -> list[dict]:
        """
        Simplified parameter generation.
        User only specifies: count, country, and gender.
        Everything else is automatically randomized from realistic pools.
        """
        return [
            self._generate_one(country=country, gender=gender, index=i)
            for i in range(count)
        ]

    # ─────────────────────────────────────────────────────────────────────────
    # PROFESSIONAL MODE
    # ─────────────────────────────────────────────────────────────────────────
    async def generate_professional(
        self,
        count: int = 100,
        config: dict = None,
    ) -> list[dict]:
        """
        Full control parameter generation.
        Config keys (all optional — defaults to randomized):
          countries:       list of country codes to distribute across
          genders:         ["male", "female"] — distribution
          device_models:   list of specific device models to use
          app_versions:    list of app versions to rotate
          api_credentials: list of {api_id, api_hash} to rotate
          custom_names:    list of {first_name, last_name} overrides
        """
        config = config or {}
        countries      = config.get("countries", list(COUNTRY_PROFILES.keys()))
        genders        = config.get("genders", ["male", "female"])
        device_models  = config.get("device_models", None)
        app_versions   = config.get("app_versions", TELEGRAM_APP_VERSIONS)
        api_creds      = config.get("api_credentials", TELEGRAM_API_CREDENTIALS)
        custom_names   = config.get("custom_names", None)

        params = []
        for i in range(count):
            country = random.choice(countries)
            gender  = random.choice(genders)

            p = self._generate_one(
                country=country,
                gender=gender,
                device_models=device_models,
                app_versions=app_versions,
                api_credentials=api_creds,
                custom_names=custom_names,
                index=i,
            )
            params.append(p)

        return params

    # ─────────────────────────────────────────────────────────────────────────
    # CORE GENERATOR
    # ─────────────────────────────────────────────────────────────────────────
    def _generate_one(
        self,
        country: str = "US",
        gender: str = "mixed",
        device_models: Optional[list] = None,
        app_versions: Optional[list] = None,
        api_credentials: Optional[list] = None,
        custom_names: Optional[list] = None,
        index: int = 0,
    ) -> dict:
        """Generates a single complete parameter set."""

        # ── Country Profile ────────────────────────────────────────────────
        profile = COUNTRY_PROFILES.get(country, COUNTRY_PROFILES["US"])
        phone_prefix, lang_code, system_lang_code = profile

        # ── Device ────────────────────────────────────────────────────────
        if device_models:
            device = random.choice(device_models)
            if isinstance(device, str):
                device_model    = device
                system_version  = f"Android {random.randint(11, 14)}"
            else:
                device_model    = device[0]
                system_version  = f"Android {device[1]}"
        else:
            device         = random.choice(ANDROID_DEVICES)
            device_model   = device[0]
            system_version = f"Android {device[1]}"

        # ── App Version ───────────────────────────────────────────────────
        app_version = random.choice(
            app_versions or TELEGRAM_APP_VERSIONS
        )

        # ── API Credentials ───────────────────────────────────────────────
        cred = random.choice(
            api_credentials or TELEGRAM_API_CREDENTIALS
        )

        # ── Name ──────────────────────────────────────────────────────────
        if custom_names and index < len(custom_names):
            first_name = custom_names[index].get("first_name", "")
            last_name  = custom_names[index].get("last_name", "")
        else:
            effective_gender = (
                random.choice(["male", "female"])
                if gender == "mixed"
                else gender
            )
            first_name = random.choice(
                MALE_NAMES if effective_gender == "male" else FEMALE_NAMES
            )
            last_name  = random.choice(LAST_NAMES)

        return {
            "id":               str(uuid.uuid4()),
            "api_id":           cred["api_id"],
            "api_hash":         cred["api_hash"],
            "device_model":     device_model,
            "system_version":   system_version,
            "app_version":      app_version,
            "lang_code":        lang_code,
            "system_lang_code": system_lang_code,
            "first_name":       first_name,
            "last_name":        last_name,
            "phone_prefix":     phone_prefix,
            "country":          country,
            "generated_at":     datetime.now(timezone.utc).isoformat(),
        }

    # ─────────────────────────────────────────────────────────────────────────
    # EXPORT AS session+json TEMPLATE
    # ─────────────────────────────────────────────────────────────────────────
    def export_as_json(self, params: list[dict]) -> list[dict]:
        """
        Transforms parameter rows into session+json format compatible
        with Telethon session initialization and desktop TDATA export.
        """
        return [
            {
                "session_file":     f"{p['first_name'].lower()}_{p['id'][:8]}.session",
                "api_id":           p["api_id"],
                "api_hash":         p["api_hash"],
                "device_model":     p["device_model"],
                "system_version":   p["system_version"],
                "app_version":      p["app_version"],
                "lang_code":        p["lang_code"],
                "system_lang_code": p["system_lang_code"],
                "first_name":       p["first_name"],
                "last_name":        p["last_name"],
                "phone_prefix":     p["phone_prefix"],
                "country":          p["country"],
            }
            for p in params
        ]

    # ─────────────────────────────────────────────────────────────────────────
    # EXPORT AS CSV
    # ─────────────────────────────────────────────────────────────────────────
    def export_as_csv(self, params: list[dict]) -> str:
        """Returns CSV string of all parameter rows."""
        if not params:
            return ""

        headers = list(params[0].keys())
        rows    = [",".join(headers)]

        for p in params:
            rows.append(",".join(str(p.get(h, "")) for h in headers))

        return "\n".join(rows)

    # ─────────────────────────────────────────────────────────────────────────
    # VALIDATE A PARAMETER SET
    # ─────────────────────────────────────────────────────────────────────────
    def validate(self, params: list[dict]) -> dict:
        """
        Validates a parameter set before use.
        Checks: API ID format, device model format, version format.
        Returns: { valid: int, invalid: int, errors: list }
        """
        valid   = 0
        invalid = 0
        errors  = []

        for i, p in enumerate(params):
            row_errors = []

            if not p.get("api_id") or not isinstance(p["api_id"], int):
                row_errors.append("Invalid api_id")
            if not p.get("api_hash") or len(str(p["api_hash"])) < 10:
                row_errors.append("Invalid api_hash")
            if not p.get("device_model"):
                row_errors.append("Missing device_model")
            if not p.get("system_version"):
                row_errors.append("Missing system_version")
            if not p.get("app_version"):
                row_errors.append("Missing app_version")

            if row_errors:
                invalid += 1
                errors.append({"row": i, "errors": row_errors})
            else:
                valid += 1

        return {
            "valid":   valid,
            "invalid": invalid,
            "total":   len(params),
            "errors":  errors[:20],  # Show first 20 errors
        }


ParameterGenerator = ParameterGeneratorClass()
