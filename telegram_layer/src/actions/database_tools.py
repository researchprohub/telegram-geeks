"""Database tools — Union, exclude, clean databases (Telegram Expert clone)."""

import csv
import json
from pathlib import Path
from loguru import logger
from typing import Optional


class DatabaseToolsService:
    """Manage and manipulate user databases."""

    def __init__(self, base_path: str = "./databases"):
        self.base_path = base_path
        Path(base_path).mkdir(parents=True, exist_ok=True)

    def union_databases(self, files: list[str], output_file: str) -> dict:
        """Merge multiple database files into one."""
        all_users: dict[int, dict] = {}  # user_id -> user data

        for file_path in files:
            try:
                path = Path(file_path)
                if not path.exists():
                    logger.warning(f"File not found: {file_path}")
                    continue

                users = self._load_file(path)
                for user in users:
                    uid = user.get("user_id") or user.get("id") or user.get("phone")
                    if uid:
                        all_users[str(uid)] = user

                logger.info(f"Loaded {len(users)} users from {file_path}")
            except Exception as e:
                logger.error(f"Error loading {file_path}: {e}")

        # Save merged result
        output_path = Path(output_file) if output_file.endswith(('.json', '.csv', '.txt')) else Path(self.base_path) / output_file
        self._save_file(output_path, list(all_users.values()))

        stats = {
            "total_merged": len(all_users),
            "files_processed": len(files),
            "unique_users": len(all_users),
            "duplicates_removed": sum(len(self._load_file(Path(f))) for f in files) - len(all_users),
        }
        logger.info(f"Union complete: {stats['unique_users']} unique users")
        return stats

    def exclude_database(self, source_file: str, exclude_file: str, output_file: str) -> dict:
        """Subtract one database from another."""
        source = self._load_file(Path(source_file))
        exclude = self._load_file(Path(exclude_file))

        exclude_ids = set()
        for user in exclude:
            uid = user.get("user_id") or user.get("id") or user.get("phone")
            if uid:
                exclude_ids.add(str(uid))

        result = [u for u in source if str(u.get("user_id") or u.get("id") or u.get("phone", "")) not in exclude_ids]

        output_path = Path(output_file)
        self._save_file(output_path, result)

        return {
            "source_count": len(source),
            "excluded_count": len(exclude_ids),
            "result_count": len(result),
        }

    def clean_database(self, input_file: str, output_file: str) -> dict:
        """Remove duplicates and invalid entries."""
        users = self._load_file(Path(input_file))
        cleaned = []
        seen = set()
        invalid = 0

        for user in users:
            uid = user.get("user_id") or user.get("id") or user.get("phone")
            if not uid:
                invalid += 1
                continue
            uid_str = str(uid)
            if uid_str in seen:
                continue
            seen.add(uid_str)
            cleaned.append(user)

        output_path = Path(output_file)
        self._save_file(output_path, cleaned)

        return {
            "original_count": len(users),
            "cleaned_count": len(cleaned),
            "duplicates_removed": len(users) - len(cleaned),
            "invalid_removed": invalid,
        }

    def validate_database(self, file_path: str) -> dict:
        """Check database integrity."""
        users = self._load_file(Path(file_path))
        stats = {
            "total_users": len(users),
            "valid": 0,
            "invalid": 0,
            "has_username": sum(1 for u in users if u.get("username")),
            "has_phone": sum(1 for u in users if u.get("phone")),
            "has_first_name": sum(1 for u in users if u.get("first_name")),
            "has_last_name": sum(1 for u in users if u.get("last_name")),
            "has_user_id": sum(1 for u in users if u.get("user_id")),
            "unique_users": len(set(str(u.get("user_id") or u.get("id") or u.get("phone", "")) for u in users)),
        }
        return stats

    async def verify_links(
        self,
        file_path: str,
        account_phone: Optional[str] = None,
        output_file: Optional[str] = None,
    ) -> dict:
        """Verify Telegram links in database are valid and accessible.
        
        Args:
            file_path: Path to database file containing links
            account_phone: Optional account to use for verification
            output_file: Optional output file for results
        """
        import asyncio
        
        users = self._load_file(Path(file_path))
        results = []
        verified = 0
        invalid = 0
        private = 0
        
        for user in users:
            username = user.get("username") or user.get("user_id")
            if not username:
                invalid += 1
                results.append({
                    "user": user,
                    "status": "invalid",
                    "reason": "no_username",
                })
                continue
            
            try:
                # Check if username is valid
                if username.startswith("@"):
                    username = username[1:]
                
                # Try to get entity
                if account_phone:
                    client = await self._get_client(account_phone)
                    if client:
                        entity = await client.get_entity(username)
                        if entity:
                            verified += 1
                            results.append({
                                "user": user,
                                "status": "verified",
                                "entity_id": entity.id,
                                "username": entity.username,
                            })
                        else:
                            invalid += 1
                            results.append({
                                "user": user,
                                "status": "invalid",
                                "reason": "entity_not_found",
                            })
                    else:
                        invalid += 1
                        results.append({
                            "user": user,
                            "status": "invalid",
                            "reason": "no_client",
                        })
                else:
                    # Basic format check without client
                    if username and len(username) >= 5 and len(username) <= 32:
                        verified += 1
                        results.append({
                            "user": user,
                            "status": "format_valid",
                        })
                    else:
                        invalid += 1
                        results.append({
                            "user": user,
                            "status": "invalid",
                            "reason": "invalid_format",
                        })
                        
            except Exception as e:
                error_str = str(e).lower()
                if "private" in error_str or "channel" in error_str:
                    private += 1
                    results.append({
                        "user": user,
                        "status": "private",
                        "reason": "private_entity",
                    })
                else:
                    invalid += 1
                    results.append({
                        "user": user,
                        "status": "invalid",
                        "reason": str(e),
                    })
        
        stats = {
            "total_checked": len(users),
            "verified": verified,
            "invalid": invalid,
            "private": private,
        }
        
        # Save results if output file specified
        if output_file:
            output_path = Path(output_file)
            self._save_file(output_path, results)
            stats["output_file"] = str(output_path)
        
        return stats

    async def _get_client(self, account_phone: str):
        """Get client for account."""
        # This would need access to client_manager
        # For now, return None (will be overridden when integrated)
        return None

    def _load_file(self, path: Path) -> list[dict]:
        """Load a database file."""
        suffix = path.suffix.lower()
        if suffix == '.json':
            with open(path) as f:
                return json.load(f)
        elif suffix == '.csv':
            with open(path) as f:
                reader = csv.DictReader(f)
                return list(reader)
        else:
            # TXT: pipe-delimited or one user per line
            with open(path) as f:
                lines = [l.strip() for l in f if l.strip()]
            if '|' in lines[0]:
                return [{"user_id": p.split('|')[0], "username": p.split('|')[1], "phone": p.split('|')[2]} for p in lines]
            return [{"user_id": l} for l in lines]

    def _save_file(self, path: Path, users: list[dict]):
        """Save a database file."""
        suffix = path.suffix.lower()
        if suffix == '.json':
            with open(path, 'w') as f:
                json.dump(users, f, indent=2)
        elif suffix == '.csv':
            if users:
                with open(path, 'w', newline='') as f:
                    writer = csv.DictWriter(f, fieldnames=users[0].keys())
                    writer.writeheader()
                    writer.writerows(users)
        else:
            with open(path, 'w') as f:
                for u in users:
                    f.write(f"{u.get('user_id', '')}|{u.get('username', '')}|{u.get('phone', '')}\n")
