"""JSON Generator — Generate session+json files for purchased accounts (Telegram Expert clone)."""

import json
import os
from pathlib import Path
from loguru import logger


class JsonGeneratorService:
    """Generate JSON configuration files for Telegram accounts."""

    def generate_json(
        self,
        session_string: str,
        api_id: int,
        api_hash: str,
        proxy_config: dict | None = None,
        output_path: str = ".",
        phone_number: str = "",
        display_name: str = "",
    ) -> str:
        """Generate a session+json file for a purchased account."""
        data = {
            "api_id": api_id,
            "api_hash": api_hash,
            "session_string": session_string,
            "phone_number": phone_number,
            "display_name": display_name,
        }

        if proxy_config:
            data["proxy"] = proxy_config

        # Write JSON file
        filename = phone_number.replace("+", "") or "account"
        filepath = os.path.join(output_path, f"{filename}.json")
        Path(output_path).mkdir(parents=True, exist_ok=True)

        with open(filepath, "w") as f:
            json.dump(data, f, indent=2)

        logger.info(f"Generated JSON: {filepath}")
        return filepath

    def validate_json(self, json_path: str) -> dict:
        """Validate a session+json file."""
        try:
            with open(json_path, "r") as f:
                data = json.load(f)

            required_fields = ["api_id", "api_hash", "session_string"]
            missing = [f for f in required_fields if f not in data]

            result = {
                "valid": len(missing) == 0,
                "missing_fields": missing,
                "fields": list(data.keys()),
            }

            if result["valid"]:
                logger.info(f"JSON valid: {json_path}")
            else:
                logger.warning(f"JSON invalid: {json_path} — missing {missing}")

            return result
        except json.JSONDecodeError as e:
            return {"valid": False, "error": f"Invalid JSON: {e}"}
        except FileNotFoundError:
            return {"valid": False, "error": "File not found"}

    def batch_generate(self, accounts: list[dict], output_dir: str = "./generated_jsons") -> dict:
        """Batch generate JSON files for multiple accounts."""
        results = {"generated": 0, "failed": 0, "files": []}
        Path(output_dir).mkdir(parents=True, exist_ok=True)

        for i, account in enumerate(accounts):
            try:
                filepath = self.generate_json(
                    session_string=account["session_string"],
                    api_id=account["api_id"],
                    api_hash=account["api_hash"],
                    proxy_config=account.get("proxy"),
                    output_path=output_dir,
                    phone_number=account.get("phone_number", f"account_{i}"),
                )
                results["generated"] += 1
                results["files"].append(filepath)
            except Exception as e:
                results["failed"] += 1
                logger.error(f"Batch generate failed for account {i}: {e}")

        logger.info(f"Batch generated: {results['generated']} success, {results['failed']} failed")
        return results
