"""Account Status Folder System — Full implementation matching Telegram Expert Pro.

Features:
- Status-based folder system: Active, Spamblock-Temp, Spamblock-Perm, Frozen, Archived
- Automatic health checking with status transitions
- Bulk folder operations
- Real-time status updates
- Account enrichment (name, username, bio, last_seen)
"""

import asyncio
import re
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from loguru import logger
from enum import Enum


class AccountStatus(Enum):
    """Account status values matching Telegram Expert Pro."""
    ACTIVE = "active"
    SPAMBLOCK_TEMP = "spamblock_temp"    # Temporary spam block (has expiry)
    SPAMBLOCK_PERM = "spamblock_perm"    # Permanent spam block
    FROZEN = "frozen"                    # Login challenge / frozen
    ARCHIVED = "archived"                # Manually archived
    BANNED = "banned"                    # Fully banned
    WARMING = "warming"                  # New account warming up


class AccountFolderService:
    """Manage account folders and organization with Telegram Expert Pro parity."""

    # Built-in folders with color coding
    FOLDER_CONFIG = {
        "All": {"color": "blue", "icon": "list", "count_all": True},
        "Active": {"color": "green", "icon": "circle-dot", "badge_color": "#22C55E"},
        "Spamblock-Temp": {"color": "amber", "icon": "clock", "badge_color": "#F59E0B"},
        "Spamblock-Perm": {"color": "red", "icon": "ban", "badge_color": "#EF4444"},
        "Frozen": {"color": "gray", "icon": "snowflake", "badge_color": "#6B7280"},
        "Archived": {"color": "gray-light", "icon": "folder", "badge_color": "#9CA3AF"},
    }

    def __init__(self, client_manager=None):
        self.client_manager = client_manager
        self._folders: Dict[str, List[Dict]] = {
            "All": [],
            "Active": [],
            "Spamblock-Temp": [],
            "Spamblock-Perm": [],
            "Frozen": [],
            "Archived": [],
        }
        self._account_meta: Dict[str, Dict] = {}  # phone -> metadata
        logger.info("AccountFolderService initialized with 6 folders")

    def classify_account(self, account: Dict) -> str:
        """Classify an account into a folder based on its status."""
        status = account.get("status", "active")
        spamblock_until = account.get("spamblock_until")
        ban_reason = account.get("ban_reason", "")

        if status == "archived":
            return "Archived"
        elif status == "spamblock_perm" or "perm" in ban_reason.lower():
            return "Spamblock-Perm"
        elif status == "spamblock_temp" or spamblock_until:
            # Check if temp block has expired
            if spamblock_until:
                try:
                    until = datetime.fromisoformat(spamblock_until.replace("Z", "+00:00"))
                    if datetime.now(timezone.utc) >= until:
                        return "Active"  # Block expired, auto-transition
                    return "Spamblock-Temp"
                except:
                    return "Spamblock-Temp"
            return "Spamblock-Temp"
        elif status == "frozen":
            return "Frozen"
        elif status == "active":
            return "Active"
        else:
            return "Active"  # Default

    def add_account(self, account: Dict) -> Dict:
        """Add an account to the folder system."""
        phone = account.get("phone_number", account.get("phone", str(account.get("id", ""))))
        folder = self.classify_account(account)

        # Remove from all folders first
        for f in self._folders:
            self._folders[f] = [a for a in self._folders[f] if a.get("phone_number") != phone]

        # Add to correct folder
        account_copy = account.copy()
        account_copy["assigned_folder"] = folder
        account_copy["last_checked"] = datetime.now(timezone.utc).isoformat()
        self._folders[folder].append(account_copy)
        self._folders["All"].append(account_copy)

        # Store metadata
        self._account_meta[phone] = {
            "added_at": datetime.now(timezone.utc).isoformat(),
            "folder": folder,
            "transitions": [],
        }

        logger.info(f"Added account {phone} to folder '{folder}'")
        return {"status": "success", "account": account_copy, "folder": folder}

    async def health_check_account(self, phone: str) -> Dict:
        """Run a health check on a single account and update its folder."""
        if not self.client_manager:
            return {"status": "error", "message": "Client manager not configured"}

        try:
            client = await self.client_manager.get_client(phone)
            if not client:
                return {
                    "status": "error",
                    "phone": phone,
                    "message": "Client not connected",
                    "new_folder": "Frozen",
                }

            # Try to get user info (lightweight check)
            me = await client.get_me()
            if me:
                # Account is healthy
                enriched = {
                    "phone": phone,
                    "user_id": me.id,
                    "username": me.username or "",
                    "first_name": me.first_name or "",
                    "last_name": me.last_name or "",
                    "is_premium": getattr(me, 'premium', False),
                    "status": "active",
                    "spamblock_until": None,
                    "ban_reason": None,
                    "trust_score": 100.0,
                    "last_checked": datetime.now(timezone.utc).isoformat(),
                }
                return await self._transition_account(phone, enriched, "Active")
            else:
                return await self._transition_account(phone, {"phone": phone, "status": "frozen"}, "Frozen")

        except Exception as e:
            error_str = str(e).lower()
            if "flood" in error_str or "wait" in error_str:
                # Calculate approximate resume time
                match = re.search(r'flood_wait\s+(\d+)', error_str)
                wait_seconds = int(match.group(1)) if match else 300
                spamblock_until = (datetime.now(timezone.utc) + timedelta(seconds=wait_seconds)).isoformat()
                enriched = {
                    "phone": phone,
                    "status": "spamblock_temp",
                    "spamblock_until": spamblock_until,
                    "ban_reason": f"Flood wait: {wait_seconds}s",
                    "last_checked": datetime.now(timezone.utc).isoformat(),
                }
                return await self._transition_account(phone, enriched, "Spamblock-Temp")
            elif "ban" in error_str or "spam" in error_str:
                enriched = {
                    "phone": phone,
                    "status": "spamblock_perm",
                    "ban_reason": error_str[:200],
                    "last_checked": datetime.now(timezone.utc).isoformat(),
                }
                return await self._transition_account(phone, enriched, "Spamblock-Perm")
            else:
                enriched = {
                    "phone": phone,
                    "status": "frozen",
                    "ban_reason": error_str[:200],
                    "last_checked": datetime.now(timezone.utc).isoformat(),
                }
                return await self._transition_account(phone, enriched, "Frozen")

    async def bulk_health_check(self, account_phones: Optional[List[str]] = None) -> Dict:
        """Run health checks on multiple accounts."""
        if account_phones is None:
            # Check all active accounts
            account_phones = [a.get("phone_number", a.get("phone")) for a in self._folders.get("All", [])]

        results = []
        for phone in account_phones:
            result = await self.health_check_account(phone)
            results.append(result)
            await asyncio.sleep(1)  # Anti-detection delay

        return {
            "status": "success",
            "total": len(results),
            "results": results,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }

    async def _transition_account(self, phone: str, enriched_data: Dict, target_folder: str) -> Dict:
        """Transition an account to a new folder with metadata."""
        # Remove from all folders
        for f in list(self._folders.keys()):
            self._folders[f] = [a for a in self._folders[f] if a.get("phone_number") != phone]

        # Add to target folder
        enriched_data["phone_number"] = phone
        enriched_data["assigned_folder"] = target_folder
        enriched_data["last_checked"] = datetime.now(timezone.utc).isoformat()

        self._folders[target_folder].append(enriched_data)
        self._folders["All"].append(enriched_data)

        # Track transition
        if phone in self._account_meta:
            self._account_meta[phone]["transitions"].append({
                "from": self._account_meta[phone].get("folder", "unknown"),
                "to": target_folder,
                "at": datetime.now(timezone.utc).isoformat(),
            })
            self._account_meta[phone]["folder"] = target_folder

        logger.info(f"Account {phone} transitioned to '{target_folder}'")
        return {
            "status": "success",
            "phone": phone,
            "previous_folder": self._account_meta.get(phone, {}).get("folder", "unknown"),
            "new_folder": target_folder,
            "enriched": enriched_data,
        }

    def move_to_folder(self, phone: str, target_folder: str) -> Dict:
        """Manually move an account to a specific folder."""
        if target_folder not in self._folders:
            return {"status": "error", "message": f"Invalid folder: {target_folder}"}

        # Find and remove from all folders
        account = None
        for f in list(self._folders.keys()):
            for a in self._folders[f]:
                if a.get("phone_number") == phone or a.get("phone") == phone:
                    account = a.copy()
                    break
            if account:
                break

        if not account:
            return {"status": "error", "message": f"Account {phone} not found"}

        # Remove from all folders
        for f in self._folders:
            self._folders[f] = [a for a in self._folders[f]
                               if a.get("phone_number") != phone and a.get("phone") != phone]

        # Add to target
        account["assigned_folder"] = target_folder
        account["last_moved"] = datetime.now(timezone.utc).isoformat()
        self._folders[target_folder].append(account)
        self._folders["All"].append(account)

        return {
            "status": "success",
            "phone": phone,
            "from": account.get("assigned_folder", "unknown"),
            "to": target_folder,
        }

    def get_folder_contents(self, folder: str) -> List[Dict]:
        """Get all accounts in a folder."""
        if folder == "All":
            return self._folders.get("All", [])
        return self._folders.get(folder, [])

    def get_folder_summary(self) -> Dict:
        """Get summary of all folders with counts."""
        summary = {}
        for folder_name, config in self.FOLDER_CONFIG.items():
            accounts = self._folders.get(folder_name, [])
            summary[folder_name] = {
                "count": len(accounts),
                "accounts": accounts[:20],  # First 20 for preview
                "color": config["color"],
                "icon": config["icon"],
                "badge_color": config.get("badge_color"),
            }
        return summary

    def get_all_folders(self) -> Dict[str, List[Dict]]:
        """Get all folders and their contents."""
        return {f: list(accounts) for f, accounts in self._folders.items()}

    def search_accounts(self, query: str) -> List[Dict]:
        """Search accounts across all folders."""
        results = []
        query_lower = query.lower()
        for folder, accounts in self._folders.items():
            for account in accounts:
                phone = account.get("phone_number", account.get("phone", ""))
                username = account.get("username", "")
                name = account.get("first_name", "") + " " + account.get("last_name", "")
                if query_lower in phone.lower() or query_lower in username.lower() or query_lower in name.lower():
                    results.append({**account, "folder": folder})
        return results

    def get_account_metadata(self, phone: str) -> Optional[Dict]:
        """Get metadata for a specific account."""
        return self._account_meta.get(phone)

    def auto_sort_all_accounts(self) -> Dict:
        """Re-classify all accounts into correct folders based on current status."""
        reclassified = 0
        for account in self._folders.get("All", []):
            phone = account.get("phone_number", account.get("phone", ""))
            current_folder = account.get("assigned_folder", "Active")
            new_folder = self.classify_account(account)

            if new_folder != current_folder:
                self.move_to_folder(phone, new_folder)
                reclassified += 1

        return {
            "status": "success",
            "reclassified": reclassified,
            "total_accounts": len(self._folders.get("All", [])),
        }


    # Operation aliases for API compatibility
    health_check = health_check_account
    auto_sort = auto_sort_all_accounts

# Singleton instance
folder_service = AccountFolderService()
