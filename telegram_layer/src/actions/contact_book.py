"""Contact book module — Full contact management (Telegram Expert clone)."""

import csv
import json
from pathlib import Path
from loguru import logger


class ContactBookService:
    """Manage contacts for each account."""

    def __init__(self, base_path: str = "./contacts"):
        self.base_path = base_path
        Path(base_path).mkdir(parents=True, exist_ok=True)

    def _get_file(self, account_id: str) -> Path:
        return Path(self.base_path) / f"{account_id}.json"

    def add_contact(self, account_id: str, user_id: int, username: str = "",
                    first_name: str = "", last_name: str = "", phone: str = "") -> bool:
        """Add a single contact."""
        contacts = self._load_contacts(account_id)
        # Check for duplicate
        if any(c.get("user_id") == user_id for c in contacts):
            logger.warning(f"Contact {user_id} already exists for {account_id}")
            return False

        contacts.append({
            "user_id": user_id,
            "username": username,
            "first_name": first_name,
            "last_name": last_name,
            "phone": phone,
            "added_at": __import__("datetime").datetime.utcnow().isoformat(),
        })
        self._save_contacts(account_id, contacts)
        logger.info(f"Added contact {user_id} to {account_id}")
        return True

    def add_contacts_batch(self, account_id: str, contacts: list[dict]) -> dict:
        """Bulk add contacts."""
        results = {"added": 0, "duplicates": 0, "errors": 0}
        for c in contacts:
            try:
                if self.add_contact(
                    account_id,
                    user_id=c.get("user_id"),
                    username=c.get("username", ""),
                    first_name=c.get("first_name", ""),
                    last_name=c.get("last_name", ""),
                    phone=c.get("phone", ""),
                ):
                    results["added"] += 1
                else:
                    results["duplicates"] += 1
            except Exception:
                results["errors"] += 1
        return results

    def get_contacts(self, account_id: str, limit: int = 100, offset: int = 0) -> list[dict]:
        """List contacts with pagination."""
        contacts = self._load_contacts(account_id)
        return contacts[offset:offset + limit]

    def get_contacts_count(self, account_id: str) -> int:
        """Get total contact count."""
        return len(self._load_contacts(account_id))

    def export_contacts(self, account_id: str, fmt: str = "csv") -> str:
        """Export contacts to file."""
        contacts = self._load_contacts(account_id)
        output_path = Path(self.base_path) / f"{account_id}_export.{fmt}"

        if fmt == "csv":
            with open(output_path, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=["user_id", "username", "first_name", "last_name", "phone"])
                writer.writeheader()
                writer.writerows(contacts)
        elif fmt == "json":
            with open(output_path, 'w') as f:
                json.dump(contacts, f, indent=2)
        elif fmt == "txt":
            with open(output_path, 'w') as f:
                for c in contacts:
                    f.write(f"{c.get('user_id')}|{c.get('username', '')}|{c.get('first_name', '')}|{c.get('last_name', '')}|{c.get('phone', '')}\n")

        logger.info(f"Exported {len(contacts)} contacts for {account_id} as {fmt}")
        return str(output_path)

    def delete_contact(self, account_id: str, user_id: int) -> bool:
        """Delete a single contact."""
        contacts = self._load_contacts(account_id)
        before = len(contacts)
        contacts = [c for c in contacts if c.get("user_id") != user_id]
        if len(contacts) < before:
            self._save_contacts(account_id, contacts)
            logger.info(f"Deleted contact {user_id} from {account_id}")
            return True
        return False

    def delete_contacts_batch(self, account_id: str, user_ids: list[int]) -> dict:
        """Bulk delete contacts."""
        contacts = self._load_contacts(account_id)
        deleted = 0
        for uid in user_ids:
            before = len(contacts)
            contacts = [c for c in contacts if c.get("user_id") != uid]
            if len(contacts) < before:
                deleted += 1
        self._save_contacts(account_id, contacts)
        return {"deleted": deleted}

    def search_contacts(self, account_id: str, query: str) -> list[dict]:
        """Search contacts by name, username, or phone."""
        contacts = self._load_contacts(account_id)
        query_lower = query.lower()
        return [
            c for c in contacts
            if query_lower in str(c.get("username", "")).lower()
            or query_lower in str(c.get("first_name", "")).lower()
            or query_lower in str(c.get("last_name", "")).lower()
            or query_lower in str(c.get("phone", "")).lower()
            or str(query_lower) == str(c.get("user_id", ""))
        ]

    def _load_contacts(self, account_id: str) -> list[dict]:
        file = self._get_file(account_id)
        if file.exists():
            with open(file) as f:
                return json.load(f)
        return []

    def _save_contacts(self, account_id: str, contacts: list[dict]):
        with open(self._get_file(account_id), 'w') as f:
            json.dump(contacts, f, indent=2)
