"""Two-Way TData Converter — Full TData ↔ Session+JSON conversion.

Supports:
- TData directory parsing (Telegram Desktop format)
- Session string extraction
- JSON sidecar file generation
- Batch conversion with progress tracking
- Error handling for corrupted/invalid files
"""

import os
import json
import zipfile
import shutil
import asyncio
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from loguru import logger


class TDataParser:
    """Parse Telegram Desktop TData directory structure."""

    def __init__(self, tdata_path: str):
        self.tdata_path = Path(tdata_dir := tdata_path)
        self.data_dir = Path(tdata_dir) / "data"
        self.sessions_dir = self.data_dir / "sessions"
        self.keys_dir = self.data_dir / "keys"
        self.profiles_dir = self.data_dir / "profiles"

    def parse(self) -> Dict[str, Any]:
        """Parse TData directory and extract session info."""
        result = {
            "valid": False,
            "error": None,
            "session_string": None,
            "api_id": None,
            "api_hash": None,
            "phone_number": None,
            "user_id": None,
            "dc_id": None,
            "server_salt": None,
            "config": {},
        }

        if not self.data_dir.exists():
            result["error"] = "No data directory found"
            return result

        # Parse config.json
        config_file = self.data_dir / "config.json"
        if config_file.exists():
            try:
                config = json.loads(config_file.read_text())
                result["config"] = config
                result["api_id"] = config.get("api_id")
                result["api_hash"] = config.get("api_hash")
                result["device_model"] = config.get("device_model", "Telegram Desktop")
                result["app_version"] = config.get("app_version", "unknown")
                result["language_pack"] = config.get("language_pack", "en")
            except json.JSONDecodeError as e:
                result["error"] = f"Invalid config.json: {e}"
                return result

        # Parse session files
        session_files = list(self.sessions_dir.glob("*.session")) if self.sessions_dir.exists() else []
        if not session_files:
            # Try .session files in any subdirectory
            session_files = list(self.data_dir.rglob("*.session"))

        if session_files:
            session_file = session_files[0]
            try:
                session_string = session_file.read_text()
                result["session_string"] = session_string
                result["phone_number"] = session_file.stem
                result["valid"] = True
            except Exception as e:
                result["error"] = f"Cannot read session file: {e}"
        else:
            result["error"] = "No session files found"

        return result


class SessionToJsonConverter:
    """Convert session string + API credentials to JSON sidecar file."""

    def __init__(self, output_dir: str = "./converted"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def convert(self, session_string: str, api_id: int, api_hash: str,
                phone_number: str = "", device_model: str = "TelegramGeeks",
                app_version: str = "1.0.0") -> Dict[str, Any]:
        """Convert session+credentials to JSON file."""
        filename = phone_number.replace("+", "").replace(" ", "_") or "account"
        filepath = self.output_dir / f"{filename}.json"

        data = {
            "api_id": api_id,
            "api_hash": api_hash,
            "session_string": session_string,
            "phone_number": phone_number,
            "device_model": device_model,
            "app_version": app_version,
            "system_version": "Windows 10",
            "language_pack": "en",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        with open(filepath, "w") as f:
            json.dump(data, f, indent=2)

        logger.info(f"Generated JSON: {filepath}")
        return {
            "status": "success",
            "filepath": str(filepath),
            "filename": f"{filename}.json",
            "phone_number": phone_number,
        }


class TwoWayConverter:
    """Full two-way converter between TData and Session+JSON formats."""

    def __init__(self, base_output_dir: str = "./converted"):
        self.base_output_dir = Path(base_output_dir)
        self.base_output_dir.mkdir(parents=True, exist_ok=True)
        self.tdata_parser = None
        self.session_converter = SessionToJsonConverter()

    async def convert_tdata_to_session(self, tdata_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
        """Convert TData directory to session+json format."""
        output_dir = output_dir or str(self.base_output_dir / "tdata_to_session")
        Path(output_dir).mkdir(parents=True, exist_ok=True)

        parser = TDataParser(tdata_path)
        parsed = parser.parse()

        if not parsed["valid"]:
            return {
                "status": "error",
                "message": parsed.get("error", "Invalid TData structure"),
                "details": parsed,
            }

        # Generate JSON sidecar
        result = self.session_converter.convert(
            session_string=parsed["session_string"],
            api_id=parsed["api_id"] or 0,
            api_hash=parsed.get("api_hash", ""),
            phone_number=parsed.get("phone_number", ""),
        )

        return {
            "status": "success",
            "direction": "tdata_to_session",
            "source": tdata_path,
            "output": result,
            "parsed_info": {
                "api_id": parsed["api_id"],
                "api_hash": parsed.get("api_hash"),
                "phone_number": parsed.get("phone_number"),
                "device_model": parsed.get("device_model"),
                "app_version": parsed.get("app_version"),
            },
        }

    async def convert_session_to_tdata(self, json_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
        """Convert session+json file to TData directory structure."""
        output_dir = output_dir or str(self.base_output_dir / "session_to_tdata")
        Path(output_dir).mkdir(parents=True, exist_ok=True)

        # Load JSON
        try:
            with open(json_path) as f:
                data = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError) as e:
            return {"status": "error", "message": f"Cannot load JSON: {e}"}

        required_fields = ["session_string", "api_id", "api_hash"]
        missing = [f for f in required_fields if f not in data]
        if missing:
            return {"status": "error", "message": f"Missing fields: {missing}"}

        phone = data.get("phone_number", "main")
        tdata_dir = Path(output_dir) / phone

        # Create TData structure
        data_dir = tdata_dir / "data"
        sessions_dir = data_dir / "sessions"
        keys_dir = data_dir / "keys"
        profiles_dir = data_dir / "profiles"
        for d in [sessions_dir, keys_dir, profiles_dir]:
            d.mkdir(parents=True, exist_ok=True)

        # Save session file
        session_file = sessions_dir / f"{phone}.session"
        session_file.write_text(data["session_string"])

        # Save config
        config = {
            "api_id": data["api_id"],
            "api_hash": data["api_hash"],
            "device_model": data.get("device_model", "TelegramGeeks"),
            "app_version": data.get("app_version", "1.0.0"),
            "system_version": data.get("system_version", "Windows 10"),
            "language_pack": data.get("language_pack", "en"),
        }
        (data_dir / "config.json").write_text(json.dumps(config, indent=2))

        # Save profile
        if phone:
            profile = {
                "first_name": data.get("first_name", phone),
                "phone": phone,
            }
            (profiles_dir / f"{phone}.json").write_text(json.dumps(profile, indent=2))

        return {
            "status": "success",
            "direction": "session_to_tdata",
            "source": json_path,
            "output_dir": str(tdata_dir),
            "phone": phone,
        }

    async def batch_convert(self, files: List[str], direction: str, output_base: str) -> Dict[str, Any]:
        """Batch convert multiple files."""
        output_base = Path(output_base)
        output_base.mkdir(parents=True, exist_ok=True)

        results = {
            "status": "processing",
            "total": len(files),
            "completed": 0,
            "failed": 0,
            "errors": [],
            "outputs": [],
        }

        for i, file_path in enumerate(files):
            try:
                if direction == "tdata_to_session":
                    result = await self.convert_tdata_to_session(file_path, str(output_base / f"tdata_{i}"))
                elif direction == "session_to_tdata":
                    result = await self.convert_session_to_tdata(file_path, str(output_base / f"session_{i}"))
                else:
                    result = {"status": "error", "message": f"Unknown direction: {direction}"}

                if result["status"] == "success":
                    results["completed"] += 1
                    results["outputs"].append(result)
                else:
                    results["failed"] += 1
                    results["errors"].append({"file": file_path, "error": result.get("message", "Unknown error")})

            except Exception as e:
                results["failed"] += 1
                results["errors"].append({"file": file_path, "error": str(e)})

            # Progress update
            results["status"] = f"processing ({results['completed']}/{results['total']})"

        results["status"] = "completed" if results["failed"] == 0 else "completed_with_errors"
        return results


# Singleton instance
converter = TwoWayConverter()
