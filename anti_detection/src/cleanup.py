"""Digital Cleanup — Remove traces of account activity."""

import os
import shutil
from pathlib import Path
from loguru import logger


class CleanupService:
    """Remove digital footprints and clean up account traces."""

    def __init__(self, base_path: str = "./cleanup"):
        self.base_path = base_path

    async def clear_sent_dialogue(self, account_id: str, chat_id: int) -> bool:
        """Delete sent messages from a specific chat (for this account)."""
        # In production: use Telethon's delete_dialog or delete_messages
        logger.info(f"Clearing sent dialogue for account {account_id} in chat {chat_id}")
        return True

    async def remove_account_traces(self, account_id: str, target_id: int) -> bool:
        """Remove traces of account activity from a target."""
        # Clear sent messages, reactions, joins
        logger.info(f"Removing traces of {account_id} from target {target_id}")
        return True

    async def sanitize_browser_data(self, account_id: str) -> bool:
        """Clear temporary browser data for an account."""
        cache_dir = Path(self.base_path) / "cache" / account_id
        if cache_dir.exists():
            shutil.rmtree(cache_dir)
            logger.info(f"Sanitized browser data for {account_id}")
        return True

    async def purge_temporary_files(self, account_id: str) -> bool:
        """Remove temp files, session backups, logs."""
        tmp_dirs = [
            Path(self.base_path) / "temp" / account_id,
            Path(self.base_path) / "logs" / account_id,
            Path(self.base_path) / "backups" / account_id,
        ]
        for d in tmp_dirs:
            if d.exists():
                shutil.rmtree(d)
                logger.info(f"Purged temp files for {account_id}: {d}")
        return True

    async def wipe_account_data(self, account_id: str) -> bool:
        """Complete account data removal."""
        base = Path(self.base_path) / account_id
        if base.exists():
            shutil.rmtree(base)
            logger.info(f"Wiped all data for {account_id}")
        return True

    async def archive_before_cleanup(self, account_id: str, archive_path: str) -> str:
        """Archive account data before cleanup."""
        src = Path(self.base_path) / account_id
        dst = Path(archive_path) / f"{account_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.zip"
        if src.exists():
            shutil.make_archive(str(dst.with_suffix("")), "zip", str(src))
            logger.info(f"Archived {account_id} to {dst}")
        return str(dst)
