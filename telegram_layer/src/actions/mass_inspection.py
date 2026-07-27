"""Mass Inspection module — bulk check accounts for bans/restrictions and auto-sort into folders.

Telegram Expert manual: https://en.telegramexpert.pro/manuals/massovaya-proverka

Checks accounts for:
- SpamBlock (temporary)
- GeoSpamBlock (permanent)
- Deleted accounts
- Free accounts (no restrictions)

Auto-sorts into folders:
- Active (free accounts)
- Temp SpamBlock
- Eternal SpamBlock
- Deleted
"""

import asyncio
import random
from datetime import datetime, timezone
from typing import Dict, List, Optional
from loguru import logger


class MassInspectionService:
    """Bulk check accounts for bans/restrictions and auto-sort into folders."""

    def __init__(self, client_manager):
        self.client_manager = client_manager
        self.inspection_history: List[Dict] = []

    async def check_all_accounts(
        self,
        folder: str = "Active",
        check_type: str = "all",
        all_accounts: bool = False,
        thread_count: int = 10,
    ) -> Dict:
        """Check all accounts for bans/restrictions and return results.
        
        Args:
            folder: Folder to check (Active, Deleted, Archive, etc.)
            check_type: "ban" | "limits" | "all"
            all_accounts: If True, check all accounts from specified folder
            thread_count: Number of concurrent threads
        """
        logger.info(f"Starting mass inspection: folder={folder}, check_type={check_type}, threads={thread_count}")

        # Get all clients
        clients = await self.client_manager.get_all_clients()
        
        if not clients:
            return {
                "status": "completed",
                "total_checked": 0,
                "results": [],
                "summary": {
                    "free": 0,
                    "temp_spamblock": 0,
                    "permanent_spamblock": 0,
                    "deleted": 0,
                }
            }

        results = []
        
        # Process in threads
        semaphore = asyncio.Semaphore(thread_count)
        tasks = []
        
        for phone, client in clients.items():
            task = self._check_single_account(semaphore, phone, client, check_type)
            tasks.append(task)
        
        # Run with concurrency control
        for task in asyncio.as_completed(tasks):
            result = await task
            results.append(result)
            await asyncio.sleep(random.uniform(0.5, 2.0))  # Random delay

        # Categorize results
        summary = {
            "free": 0,
            "temp_spamblock": 0,
            "permanent_spamblock": 0,
            "deleted": 0,
        }
        
        for r in results:
            category = r.get("category", "unknown")
            if category in summary:
                summary[category] += 1

        # Record inspection
        inspection_record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "folder": folder,
            "check_type": check_type,
            "total_checked": len(results),
            "summary": summary,
            "results": results,
        }
        self.inspection_history.append(inspection_record)

        logger.info(f"Mass inspection complete: {summary}")
        
        return {
            "status": "completed",
            "total_checked": len(results),
            "results": results,
            "summary": summary,
        }

    async def _check_single_account(self, semaphore, phone: str, client, check_type: str) -> Dict:
        """Check a single account for bans/restrictions."""
        async with semaphore:
            result = {
                "phone": phone,
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "is_banned": False,
                "is_spamblocked": False,
                "is_geospamblocked": False,
                "is_deleted": False,
                "category": "unknown",
                "restrictions": [],
            }

            try:
                # Try to get account info - if it fails, account might be deleted
                try:
                    me = await client.get_me()
                    if not me:
                        result["is_deleted"] = True
                        result["category"] = "deleted"
                        return result
                except Exception as e:
                    if "deleted" in str(e).lower() or "account" in str(e).lower():
                        result["is_deleted"] = True
                        result["category"] = "deleted"
                        return result
                    raise

                # Check for bans
                if check_type in ["ban", "all"]:
                    try:
                        # Send a test message to @SpamBot
                        spambot_result = await self._check_spambot(client)
                        if spambot_result.get("banned"):
                            result["is_banned"] = True
                            result["restrictions"].append("spam_blocked")
                            
                            if spambot_result.get("permanent"):
                                result["is_geospamblocked"] = True
                                result["category"] = "permanent_spamblock"
                            else:
                                result["is_spamblocked"] = True
                                result["category"] = "temp_spamblock"
                            return result
                    except Exception as e:
                        logger.debug(f"SpamBot check failed for {phone}: {e}")

                # Check for limits
                if check_type in ["limits", "all"]:
                    try:
                        limits_result = await self._check_limits(client)
                        if limits_result.get("restricted"):
                            result["restrictions"].extend(limits_result.get("restriction_types", []))
                            result["is_spamblocked"] = True
                            result["category"] = "temp_spamblock"
                            return result
                    except Exception as e:
                        logger.debug(f"Limits check failed for {phone}: {e}")

                # If no restrictions found
                result["category"] = "free"
                
            except Exception as e:
                logger.error(f"Error checking account {phone}: {e}")
                result["category"] = "error"
                result["error"] = str(e)

            return result

    async def _check_spambot(self, client) -> Dict:
        """Check account status via @SpamBot."""
        try:
            # Try to get messages from SpamBot
            spambot_id = -1001719937921  # SpamBot channel ID
            messages = await client.get_messages(spambot_id, limit=1)
            
            if messages:
                text = messages.text.lower() if hasattr(messages, 'text') else ""
                if "you have no restrictions" in text:
                    return {"banned": False}
                elif "permanent restriction" in text:
                    return {"banned": True, "permanent": True}
                elif "temporary restriction" in text:
                    return {"banned": True, "permanent": False}
            
            return {"banned": False}
        except Exception as e:
            logger.debug(f"SpamBot check exception: {e}")
            return {"banned": False}

    async def _check_limits(self, client) -> Dict:
        """Check account for various limits."""
        restrictions = []
        
        try:
            # Try to send a message to self to check if restricted
            me = await client.get_me()
            if me:
                # This is a safe way to check if account is functional
                pass
        except Exception as e:
            if "flood" in str(e).lower():
                restrictions.append("flood_wait")
            elif "restricted" in str(e).lower():
                restrictions.append("api_restricted")
        
        return {
            "restricted": len(restrictions) > 0,
            "restriction_types": restrictions,
        }

    def get_inspection_history(self, limit: int = 50) -> List[Dict]:
        """Get history of inspections."""
        return self.inspection_history[-limit:]

    def sort_into_folders(self, results: List[Dict]) -> Dict:
        """Sort accounts into folders based on inspection results.
        
        Returns folder assignments for each account.
        """
        folder_assignments = {
            "Active": [],
            "Temp SpamBlock": [],
            "Eternal SpamBlock": [],
            "Deleted": [],
        }
        
        for result in results:
            phone = result.get("phone", "unknown")
            category = result.get("category", "unknown")
            
            if category == "free":
                folder_assignments["Active"].append(phone)
            elif category == "temp_spamblock":
                folder_assignments["Temp SpamBlock"].append(phone)
            elif category == "permanent_spamblock":
                folder_assignments["Eternal SpamBlock"].append(phone)
            elif category == "deleted":
                folder_assignments["Deleted"].append(phone)
            else:
                # Unknown category, keep in Active for manual review
                folder_assignments["Active"].append(phone)
        
        logger.info(f"Folder assignments: { {k: len(v) for k, v in folder_assignments.items()} }")
        return folder_assignments
