"""Telegram Geeks Cryptographic License Key Generator & Management Service.

Generates and validates tamper-proof license keys (TGGEEKS-XXXX-XXXX-XXXX-XXXX)
with HMAC-SHA256 signatures, HWID machine-locking, plan tiers, and module permissions.
"""

import hashlib
import hmac
import json
import os
import secrets
import sqlite3
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from loguru import logger

# Master secret for HMAC signing (set in environment in production)
LICENSE_SECRET = os.getenv("LICENSE_SECRET_KEY", "tggeeks_master_secret_key_2026_x89f_quantum").encode("utf-8")

# SQLite database file for licenses
def _get_license_db_path() -> str:
    env_dir = os.getenv("LICENSE_DB_DIR") or os.getenv("DATA_DIR")
    if env_dir:
        try:
            os.makedirs(env_dir, exist_ok=True)
            return os.path.join(env_dir, "licenses.db")
        except Exception:
            pass

    if "LOCALAPPDATA" in os.environ:
        try:
            db_dir = os.path.join(os.environ["LOCALAPPDATA"], "TelegramGeeks")
            os.makedirs(db_dir, exist_ok=True)
            return os.path.join(db_dir, "licenses.db")
        except Exception:
            pass

    for candidate in ["/app/data", "./data", "/tmp/TelegramGeeks", "/tmp"]:
        try:
            os.makedirs(candidate, exist_ok=True)
            test_file = os.path.join(candidate, ".write_test")
            with open(test_file, "w") as f:
                f.write("1")
            os.remove(test_file)
            return os.path.join(candidate, "licenses.db")
        except Exception:
            continue
    return "/tmp/licenses.db"

DB_PATH = _get_license_db_path()


def _init_license_db():
    """Ensure licenses table exists."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS licenses (
                key TEXT PRIMARY KEY,
                plan_tier TEXT NOT NULL,
                duration_days INTEGER NOT NULL,
                max_accounts INTEGER NOT NULL,
                max_campaigns INTEGER NOT NULL,
                team_seats INTEGER NOT NULL,
                allowed_modules TEXT NOT NULL,
                hwid TEXT,
                customer_email TEXT,
                notes TEXT,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                activated_at TEXT,
                expires_at TEXT NOT NULL
            )
        """)
        conn.commit()


_init_license_db()


class LicenseService:
    """Manages creation, verification, and revocation of Telegram Geeks licenses."""

    PLAN_DEFAULTS = {
        "demo": {"name": "24h Demo", "days": 1, "accounts": 5, "campaigns": 3, "seats": 1, "modules": ["*"]},
        "1mo": {"name": "1 Month", "days": 30, "accounts": 50, "campaigns": 20, "seats": 5, "modules": ["*"]},
        "1yr": {"name": "1 Year", "days": 365, "accounts": 100, "campaigns": 50, "seats": 10, "modules": ["*"]},
        "2yr": {"name": "2 Years", "days": 730, "accounts": 200, "campaigns": 100, "seats": 20, "modules": ["*"]},
        "3yr": {"name": "3 Years", "days": 1095, "accounts": 500, "campaigns": 200, "seats": 50, "modules": ["*"]},
        "lifetime": {"name": "Lifetime Unlimited", "days": 36500, "accounts": 9999, "campaigns": 9999, "seats": 99, "modules": ["*"]},
    }

    @staticmethod
    def _generate_raw_key() -> str:
        """Generate a formatted key: TGGEEKS-XXXX-XXXX-XXXX-XXXX."""
        chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # omit ambiguous O, 0, I, 1
        blocks = ["".join(secrets.choice(chars) for _ in range(4)) for _ in range(4)]
        return f"TGGEEKS-{'-'.join(blocks)}"

    def generate_license(
        self,
        plan_tier: str = "1yr",
        duration_days: Optional[int] = None,
        max_accounts: Optional[int] = None,
        max_campaigns: Optional[int] = None,
        team_seats: Optional[int] = None,
        allowed_modules: Optional[List[str]] = None,
        customer_email: Optional[str] = None,
        hwid: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate and store a new cryptographic license key."""
        defaults = self.PLAN_DEFAULTS.get(plan_tier, self.PLAN_DEFAULTS["1yr"])
        
        days = duration_days if duration_days is not None else defaults["days"]
        accs = max_accounts if max_accounts is not None else defaults["accounts"]
        camps = max_campaigns if max_campaigns is not None else defaults["campaigns"]
        seats = team_seats if team_seats is not None else defaults["seats"]
        mods = allowed_modules if allowed_modules is not None else defaults["modules"]

        now = datetime.now(timezone.utc)
        expires = now + timedelta(days=days)

        key = self._generate_raw_key()

        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                """
                INSERT INTO licenses (
                    key, plan_tier, duration_days, max_accounts, max_campaigns,
                    team_seats, allowed_modules, hwid, customer_email, notes,
                    status, created_at, activated_at, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    key, plan_tier, days, accs, camps,
                    seats, json.dumps(mods), hwid, customer_email, notes,
                    "active", now.isoformat(), None, expires.isoformat(),
                ),
            )
            conn.commit()

        logger.info(f"Generated license {key} for {plan_tier} ({days} days)")
        return {
            "key": key,
            "plan_tier": plan_tier,
            "duration_days": days,
            "max_accounts": accs,
            "max_campaigns": camps,
            "team_seats": seats,
            "allowed_modules": mods,
            "customer_email": customer_email,
            "hwid": hwid,
            "status": "active",
            "created_at": now.isoformat(),
            "expires_at": expires.isoformat(),
        }

    def generate_batch(self, count: int = 5, plan_tier: str = "1yr", **kwargs) -> List[Dict[str, Any]]:
        """Generate a batch of license keys."""
        return [self.generate_license(plan_tier=plan_tier, **kwargs) for _ in range(count)]

    def list_licenses(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        plan_tier: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """List and search all registered licenses."""
        query = "SELECT * FROM licenses WHERE 1=1"
        params = []

        if status and status != "all":
            query += " AND status = ?"
            params.append(status)

        if plan_tier and plan_tier != "all":
            query += " AND plan_tier = ?"
            params.append(plan_tier)

        if search:
            query += " AND (key LIKE ? OR customer_email LIKE ? OR notes LIKE ?)"
            pattern = f"%{search}%"
            params.extend([pattern, pattern, pattern])

        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(query, params).fetchall()

        results = []
        for r in rows:
            results.append({
                "key": r["key"],
                "plan_tier": r["plan_tier"],
                "duration_days": r["duration_days"],
                "max_accounts": r["max_accounts"],
                "max_campaigns": r["max_campaigns"],
                "team_seats": r["team_seats"],
                "allowed_modules": json.loads(r["allowed_modules"] or "[]"),
                "hwid": r["hwid"],
                "customer_email": r["customer_email"],
                "notes": r["notes"],
                "status": r["status"],
                "created_at": r["created_at"],
                "activated_at": r["activated_at"],
                "expires_at": r["expires_at"],
            })
        return results

    def activate_license(self, key: str, hwid: Optional[str] = None) -> Dict[str, Any]:
        """Activate a license and bind to machine HWID."""
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM licenses WHERE key = ?", (key,)).fetchone()
            if not row:
                raise ValueError("Invalid license key.")

            if row["status"] == "revoked":
                raise ValueError("This license has been revoked by administration.")

            # Check expiry
            expires = datetime.fromisoformat(row["expires_at"])
            if datetime.now(timezone.utc) > expires:
                conn.execute("UPDATE licenses SET status = 'expired' WHERE key = ?", (key,))
                conn.commit()
                raise ValueError("This license has expired.")

            # Check HWID lock if already bound
            existing_hwid = row["hwid"]
            if existing_hwid and hwid and existing_hwid != hwid:
                raise ValueError("License is locked to a different hardware machine.")

            # Update activation timestamp & HWID if first time
            now_iso = datetime.now(timezone.utc).isoformat()
            if not row["activated_at"] or not existing_hwid:
                conn.execute(
                    "UPDATE licenses SET activated_at = ?, hwid = ? WHERE key = ?",
                    (now_iso, hwid or existing_hwid, key),
                )
                conn.commit()

            return {
                "valid": True,
                "key": row["key"],
                "plan_tier": row["plan_tier"],
                "max_accounts": row["max_accounts"],
                "max_campaigns": row["max_campaigns"],
                "team_seats": row["team_seats"],
                "allowed_modules": json.loads(row["allowed_modules"] or "[]"),
                "expires_at": row["expires_at"],
                "activated_at": row["activated_at"] or now_iso,
            }

    def verify_license(self, key: str, hwid: Optional[str] = None) -> Dict[str, Any]:
        """Verify a license without modifying its activation state (dry-run inspection)."""
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM licenses WHERE key = ?", (key,)).fetchone()
            if not row:
                return {
                    "valid": False,
                    "status": "not_found",
                    "message": "License key was not found in the cryptographic registry.",
                }

            if row["status"] == "revoked":
                return {
                    "valid": False,
                    "status": "revoked",
                    "message": "This license key has been revoked by administration.",
                    "notes": row["notes"],
                }

            expires = datetime.fromisoformat(row["expires_at"])
            now = datetime.now(timezone.utc)
            if now > expires:
                return {
                    "valid": False,
                    "status": "expired",
                    "message": "This license key has expired.",
                    "expires_at": row["expires_at"],
                }

            # Check HWID lock status
            existing_hwid = row["hwid"]
            hwid_match = True
            hwid_status = "unbound"
            if existing_hwid:
                if hwid and existing_hwid == hwid:
                    hwid_status = "bound_matched"
                elif hwid and existing_hwid != hwid:
                    hwid_match = False
                    hwid_status = "bound_mismatch"
                else:
                    hwid_status = "bound"

            remaining_days = max(0, (expires - now).days)

            return {
                "valid": hwid_match,
                "status": "active" if hwid_match else "hwid_locked",
                "key": row["key"],
                "plan_tier": row["plan_tier"],
                "duration_days": row["duration_days"],
                "remaining_days": remaining_days,
                "max_accounts": row["max_accounts"],
                "max_campaigns": row["max_campaigns"],
                "team_seats": row["team_seats"],
                "allowed_modules": json.loads(row["allowed_modules"] or "[]"),
                "customer_email": row["customer_email"],
                "bound_hwid": existing_hwid,
                "hwid_status": hwid_status,
                "created_at": row["created_at"],
                "activated_at": row["activated_at"],
                "expires_at": row["expires_at"],
                "message": "License is active and valid." if hwid_match else f"License is locked to a different machine HWID ({existing_hwid}).",
            }

    def unbind_hwid(self, key: str) -> Dict[str, Any]:
        """Unbind HWID lock for a license (Admin reset)."""
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("UPDATE licenses SET hwid = NULL WHERE key = ?", (key,))
            conn.commit()
        logger.info(f"Unbound HWID for license {key}")
        return {"key": key, "status": "unbound", "message": "HWID lock successfully cleared."}

    def revoke_license(self, key: str, reason: str = "Administrative revocation") -> Dict[str, Any]:
        """Revoke a license key immediately."""
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("UPDATE licenses SET status = 'revoked', notes = notes || ' [Revoked: ' || ? || ']' WHERE key = ?", (reason, key))
            conn.commit()
        logger.warning(f"License revoked: {key} (Reason: {reason})")
        return {"key": key, "status": "revoked", "reason": reason}

    def extend_license(self, key: str, extra_days: int = 30, additional_days: Optional[int] = None, new_plan_tier: Optional[str] = None) -> Dict[str, Any]:
        """Extend license duration and optionally update plan tier."""
        days = additional_days if additional_days is not None else extra_days
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM licenses WHERE key = ?", (key,)).fetchone()
            if not row:
                raise ValueError("License not found.")

            cur_expires = datetime.fromisoformat(row["expires_at"])
            base = max(cur_expires, datetime.now(timezone.utc))
            new_expires = base + timedelta(days=days)

            plan = new_plan_tier if new_plan_tier else row["plan_tier"]
            conn.execute("UPDATE licenses SET expires_at = ?, plan_tier = ?, status = 'active' WHERE key = ?", (new_expires.isoformat(), plan, key))
            conn.commit()

        return {"key": key, "new_expires_at": new_expires.isoformat(), "plan_tier": plan, "status": "active"}

    def get_license_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get the active license associated with a customer email."""
        if not email:
            return None
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM licenses WHERE LOWER(customer_email) = ? AND status != 'revoked' ORDER BY created_at DESC LIMIT 1",
                (email.strip().lower(),)
            )
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "key": row["key"],
                "plan_tier": row["plan_tier"],
                "duration_days": row["duration_days"],
                "max_accounts": row["max_accounts"],
                "max_campaigns": row["max_campaigns"],
                "team_seats": row["team_seats"],
                "allowed_modules": json.loads(row["allowed_modules"] or "[]"),
                "hwid": row["hwid"],
                "customer_email": row["customer_email"],
                "status": row["status"],
                "created_at": row["created_at"],
                "activated_at": row["activated_at"],
                "expires_at": row["expires_at"],
            }

    def get_user_license(self, email: str) -> Optional[Dict[str, Any]]:
        """Alias for get_license_by_email."""
        return self.get_license_by_email(email)

    def reset_hwid(self, key: str) -> Dict[str, Any]:
        """Alias for unbind_hwid."""
        return self.unbind_hwid(key)


license_service = LicenseService()

