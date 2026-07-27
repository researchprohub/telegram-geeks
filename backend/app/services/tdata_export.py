"""TData Export Service — Export accounts from DB to downloadable TData ZIP."""

import io
import json
import zipfile
from typing import Sequence
from loguru import logger
from app.models import Account


def build_tdata_zip(accounts: Sequence[Account]) -> io.BytesIO:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for acct in accounts:
            phone = acct.phone_number
            session_str = acct.session_string or ""
            if not session_str:
                continue

            zf.writestr(f"tdata_{phone}/data/sessions/{phone}.session", session_str)
            zf.writestr(f"tdata_{phone}/data/config.json", json.dumps({
                "api_id": acct.api_id or 0,
                "api_hash": acct.api_hash or "",
                "device_model": "TelegramGeeks",
                "app_version": "2.0.0",
                "system_version": "Windows 10",
                "language_pack": "en",
            }, indent=2))
            zf.writestr(f"tdata_{phone}/data/profiles/{phone}.json", json.dumps({
                "phone": phone,
                "first_name": phone,
            }, indent=2))
    buf.seek(0)
    return buf


def build_session_json_zip(accounts: Sequence[Account]) -> io.BytesIO:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for acct in accounts:
            session_str = acct.session_string or ""
            if not session_str:
                continue
            phone = acct.phone_number
            data = {
                "api_id": acct.api_id or 0,
                "api_hash": acct.api_hash or "",
                "session_string": session_str,
                "phone_number": phone,
                "device_model": "TelegramGeeks",
                "app_version": "2.0.0",
                "system_version": "Windows 10",
                "language_pack": "en",
            }
            zf.writestr(f"{phone}.json", json.dumps(data, indent=2))
    buf.seek(0)
    return buf
