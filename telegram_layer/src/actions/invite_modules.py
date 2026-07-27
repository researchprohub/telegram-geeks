"""Invite modules — All invite methods (Telegram Expert clone)."""

import asyncio
import random
from loguru import logger


class InviteService:
    """All Telegram invite methods."""

    def __init__(self, client_manager):
        self.client_manager = client_manager

    async def invite_by_numbers(self, account_id: str, chat_id: int, phone_numbers: list[str]) -> dict:
        """Invite users by phone numbers."""
        results = {"invited": 0, "failed": 0, "already_member": 0}
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        try:
            from telethon.tl.functions.contacts import ResolveUsernameRequest
            from telethon.tl.functions.channels import InviteParticipantsRequest
            from telethon.tl.types import InputUserPhone

            resolved_users = []
            for phone in phone_numbers:
                try:
                    # Resolve phone to user
                    resolved = await client(ResolveUsernameRequest(phone))
                    if resolved:
                        resolved_users.append(resolved)
                except Exception:
                    pass

            if resolved_users:
                await client(InviteParticipantsRequest(
                    channel=chat_id,
                    users=resolved_users,
                ))
                results["invited"] += len(resolved_users)

        except Exception as e:
            logger.error(f"Invite by numbers error: {e}")
            results["failed"] += len(phone_numbers)

        return results

    async def invite_by_username(self, account_id: str, chat_id: int, usernames: list[str]) -> dict:
        """Invite users by @username."""
        results = {"invited": 0, "failed": 0}
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        try:
            from telethon.tl.functions.channels import InviteParticipantsRequest
            from telethon.tl.types import InputUser

            users = []
            for username in usernames:
                try:
                    user = await client.get_entity(username.lstrip('@'))
                    if hasattr(user, 'id'):
                        users.append(InputUser(user_id=user.id, access_hash=getattr(user, 'access_hash', 0)))
                except Exception:
                    pass

            if users:
                await client(InviteParticipantsRequest(channel=chat_id, users=users))
                results["invited"] += len(users)
            else:
                results["failed"] = len(usernames)

        except Exception as e:
            logger.error(f"Invite by username error: {e}")
            results["failed"] = len(usernames)

        return results

    async def invite_by_id(self, account_id: str, chat_id: int, user_ids: list[int]) -> dict:
        """Invite users by numeric ID."""
        results = {"invited": 0, "failed": 0}
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        try:
            from telethon.tl.functions.channels import InviteParticipantsRequest
            from telethon.tl.types import InputUser

            users = [
                InputUser(user_id=uid, access_hash=0)
                for uid in user_ids
            ]
            await client(InviteParticipantsRequest(channel=chat_id, users=users))
            results["invited"] = len(users)
        except Exception as e:
            logger.error(f"Invite by ID error: {e}")
            results["failed"] = len(user_ids)

        return results

    async def invite_via_admin_v1(self, account_id: str, chat_id: int, bot_token: str, user_ids: list[int]) -> dict:
        """V1: Use bot as admin to invite users."""
        results = {"invited": 0, "failed": 0}
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        try:
            from telethon.tl.functions.channels import InviteParticipantsRequest
            from telethon.tl.types import InputBotAppShortName, InputUser

            # The bot acts as admin and invites users
            users = [InputUser(user_id=uid, access_hash=0) for uid in user_ids]
            await client(InviteParticipantsRequest(
                channel=chat_id,
                users=users,
            ))
            results["invited"] = len(users)
        except Exception as e:
            logger.error(f"Invite via admin V1 error: {e}")
            results["failed"] = len(user_ids)

        return results

    async def invite_via_admin_v2(self, account_id: str, chat_id: int, bot_token: str, user_ids: list[int]) -> dict:
        """V2: Add user as admin, invite them, then remove admin."""
        results = {"invited": 0, "failed": 0, "promoted": 0, "demoted": 0}
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        for uid in user_ids:
            try:
                # Step 1: Grant admin rights
                from telethon.tl.functions.channels import EditAdminRequest
                from telethon.tl.types import ChannelAdminRights
                await client(EditAdminRequest(
                    channel=chat_id,
                    user_id=uid,
                    admin_rights=ChannelAdminRights(change_info=True, post_messages=True),
                ))
                results["promoted"] += 1

                # Step 2: Invite to group
                from telethon.tl.functions.channels import InviteParticipantsRequest
                from telethon.tl.types import InputUser
                await client(InviteParticipantsRequest(
                    channel=chat_id,
                    users=[InputUser(user_id=uid, access_hash=0)],
                ))
                results["invited"] += 1

                # Step 3: Remove admin rights
                await client(EditAdminRequest(
                    channel=chat_id,
                    user_id=uid,
                    admin_rights=ChannelAdminRights(),
                ))
                results["demoted"] += 1

                await asyncio.sleep(random.uniform(30, 120))

            except Exception as e:
                logger.error(f"Invite via admin V2 error for {uid}: {e}")
                results["failed"] += 1

        return results

    async def invite_v1(self, account_id: str, chat_id: int, users: list[dict]) -> dict:
        """Standard invite V1."""
        results = {"invited": 0, "failed": 0}
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        try:
            from telethon.tl.functions.channels import InviteParticipantsRequest
            from telethon.tl.types import InputUser

            user_objs = [
                InputUser(user_id=u.get("user_id", 0), access_hash=u.get("access_hash", 0))
                for u in users if u.get("user_id")
            ]
            if user_objs:
                await client(InviteParticipantsRequest(channel=chat_id, users=user_objs))
                results["invited"] = len(user_objs)
        except Exception as e:
            logger.error(f"Invite V1 error: {e}")
            results["failed"] = len(users)

        return results

    async def invite_v2(self, account_id: str, chat_id: int, users: list[dict]) -> dict:
        """Advanced invite V2 with retry logic."""
        results = {"invited": 0, "failed": 0, "retried": 0}
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        for user in users:
            if not user.get("user_id"):
                continue
            success = False
            for attempt in range(3):
                try:
                    from telethon.tl.functions.channels import InviteParticipantsRequest
                    from telethon.tl.types import InputUser
                    await client(InviteParticipantsRequest(
                        channel=chat_id,
                        users=[InputUser(user_id=user["user_id"], access_hash=user.get("access_hash", 0))],
                    ))
                    results["invited"] += 1
                    success = True
                    break
                except Exception as e:
                    if attempt < 2:
                        results["retried"] += 1
                        await asyncio.sleep(random.uniform(30, 120))
                    else:
                        results["failed"] += 1
                        logger.warning(f"Invite V2 failed for {user.get('user_id')}: {e}")

            await asyncio.sleep(random.uniform(10, 60))

        return results
