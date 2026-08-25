"""Telegram Web Service — MTProto Dialogs, Chat History, Messaging, and Channel Management."""

import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from loguru import logger
from telethon import TelegramClient, functions, types
from telethon.sessions import StringSession
from telethon.tl.functions.channels import JoinChannelRequest, LeaveChannelRequest
from telethon.tl.functions.messages import ImportChatInviteRequest

from app.models import Account


DEFAULT_API_ID = int(os.getenv("TELEGRAM_API_ID", "2040"))
DEFAULT_API_HASH = os.getenv("TELEGRAM_API_HASH", "b18441a1ff607e10a989891a5462e627")


class TelegramWebService:
    @staticmethod
    def get_client(account: Account) -> Optional[TelegramClient]:
        """Create a Telethon TelegramClient from an Account's session string."""
        if not account.session_string:
            return None

        api_id = account.api_id or DEFAULT_API_ID
        api_hash = account.api_hash or DEFAULT_API_HASH

        proxy = None
        if account.proxy_config and isinstance(account.proxy_config, dict):
            ptype = account.proxy_config.get("proxy_type", "socks5").lower()
            try:
                import socks
                proxy_type_map = {
                    "socks5": socks.SOCKS5,
                    "socks4": socks.SOCKS4,
                    "http": socks.HTTP,
                }
                if ptype in proxy_type_map and account.proxy_config.get("host"):
                    proxy = (
                        proxy_type_map[ptype],
                        account.proxy_config.get("host"),
                        int(account.proxy_config.get("port", 1080)),
                        True,
                        account.proxy_config.get("username"),
                        account.proxy_config.get("password"),
                    )
            except Exception:
                pass

        return TelegramClient(
            StringSession(account.session_string),
            api_id=api_id,
            api_hash=api_hash,
            proxy=proxy,
        )

    @classmethod
    async def get_dialogs(
        cls,
        account: Account,
        limit: int = 100,
        folder_type: str = "all",
    ) -> Dict[str, Any]:
        """Fetch all dialogs (groups, channels, DMs, bots) for an account."""
        client = cls.get_client(account)
        if not client:
            return {
                "stats": {"total": 0, "groups": 0, "channels": 0, "dms": 0, "bots": 0, "unread": 0},
                "dialogs": [],
                "error": "No session string available for account",
            }

        try:
            await client.connect()
            if not await client.is_user_authorized():
                return {
                    "stats": {"total": 0, "groups": 0, "channels": 0, "dms": 0, "bots": 0, "unread": 0},
                    "dialogs": [],
                    "error": "Account session expired or revoked",
                }

            telethon_dialogs = await client.get_dialogs(limit=limit)
            dialog_list: List[Dict[str, Any]] = []

            stats = {
                "total": 0,
                "groups": 0,
                "channels": 0,
                "dms": 0,
                "bots": 0,
                "unread": 0,
            }

            for d in telethon_dialogs:
                entity = d.entity
                d_type = "dm"
                if d.is_user:
                    d_type = "bot" if getattr(entity, "bot", False) else "dm"
                elif d.is_channel:
                    d_type = "supergroup" if getattr(entity, "megagroup", False) or getattr(entity, "gigagroup", False) else "channel"
                elif d.is_group:
                    d_type = "group"

                unread = d.unread_count or 0
                stats["unread"] += unread
                stats["total"] += 1

                if d_type in ("group", "supergroup"):
                    stats["groups"] += 1
                elif d_type == "channel":
                    stats["channels"] += 1
                elif d_type == "bot":
                    stats["bots"] += 1
                else:
                    stats["dms"] += 1

                # Apply folder filter
                if folder_type != "all":
                    if folder_type == "groups" and d_type not in ("group", "supergroup"):
                        continue
                    if folder_type == "channels" and d_type != "channel":
                        continue
                    if folder_type == "dms" and d_type != "dm":
                        continue
                    if folder_type == "bots" and d_type != "bot":
                        continue

                title = d.name or d.title or "Unknown"
                last_msg = ""
                last_date = None
                if d.message:
                    last_msg = d.message.message or (f"[{d.message.media.__class__.__name__}]" if d.message.media else "")
                    if d.message.date:
                        last_date = d.message.date.isoformat()

                dialog_list.append({
                    "id": d.id,
                    "title": title,
                    "type": d_type,
                    "unread_count": unread,
                    "pinned": bool(d.pinned),
                    "last_message": last_msg,
                    "last_message_date": last_date,
                    "username": getattr(entity, "username", None),
                    "participants_count": getattr(entity, "participants_count", None),
                    "is_creator": getattr(entity, "creator", False),
                    "is_verified": getattr(entity, "verified", False),
                    "is_scam": getattr(entity, "scam", False),
                    "is_fake": getattr(entity, "fake", False),
                })

            return {
                "stats": stats,
                "dialogs": dialog_list,
            }

        except Exception as e:
            logger.exception(f"Failed to fetch dialogs for account {account.id}: {e}")
            return {
                "stats": {"total": 0, "groups": 0, "channels": 0, "dms": 0, "bots": 0, "unread": 0},
                "dialogs": [],
                "error": str(e),
            }
        finally:
            try:
                await client.disconnect()
            except Exception:
                pass

    @classmethod
    async def get_messages(
        cls,
        account: Account,
        dialog_id: int | str,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """Fetch recent message history for a specific chat/channel."""
        client = cls.get_client(account)
        if not client:
            return {"messages": [], "error": "No session string"}

        try:
            await client.connect()
            # Convert dialog_id to int if numeric
            target_entity = int(dialog_id) if str(dialog_id).lstrip("-").isdigit() else dialog_id
            entity = await client.get_input_entity(target_entity)
            history = await client.get_messages(entity, limit=limit)

            formatted_msgs = []
            for m in reversed(history):
                media_type = None
                if m.photo:
                    media_type = "photo"
                elif m.video:
                    media_type = "video"
                elif m.voice:
                    media_type = "voice"
                elif m.document:
                    media_type = "document"
                elif m.poll:
                    media_type = "poll"

                sender_name = None
                if m.sender:
                    if hasattr(m.sender, "first_name"):
                        sender_name = f"{m.sender.first_name or ''} {getattr(m.sender, 'last_name', '') or ''}".strip()
                    elif hasattr(m.sender, "title"):
                        sender_name = m.sender.title

                formatted_msgs.append({
                    "id": m.id,
                    "text": m.message or "",
                    "date": m.date.isoformat() if m.date else None,
                    "out": bool(m.out),
                    "sender_id": m.sender_id,
                    "sender_name": sender_name,
                    "media_type": media_type,
                    "views": getattr(m, "views", None),
                    "forwards": getattr(m, "forwards", None),
                    "reply_to_msg_id": m.reply_to_msg_id if hasattr(m, "reply_to_msg_id") else None,
                })

            return {"messages": formatted_msgs}

        except Exception as e:
            logger.exception(f"Failed to fetch messages for dialog {dialog_id}: {e}")
            return {"messages": [], "error": str(e)}
        finally:
            try:
                await client.disconnect()
            except Exception:
                pass

    @classmethod
    async def send_message(
        cls,
        account: Account,
        dialog_id: int | str,
        text: str,
        reply_to: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Send a live text message to a chat/channel."""
        client = cls.get_client(account)
        if not client:
            return {"success": False, "error": "No session string"}

        try:
            await client.connect()
            target_entity = int(dialog_id) if str(dialog_id).lstrip("-").isdigit() else dialog_id
            entity = await client.get_input_entity(target_entity)
            sent = await client.send_message(entity, text, reply_to=reply_to)
            return {
                "success": True,
                "message": {
                    "id": sent.id,
                    "text": sent.message,
                    "date": sent.date.isoformat() if sent.date else datetime.utcnow().isoformat(),
                    "out": True,
                },
            }
        except Exception as e:
            logger.exception(f"Failed to send message to dialog {dialog_id}: {e}")
            return {"success": False, "error": str(e)}
        finally:
            try:
                await client.disconnect()
            except Exception:
                pass

    @classmethod
    async def join_chat(
        cls,
        account: Account,
        invite_link_or_username: str,
    ) -> Dict[str, Any]:
        """Join a group or channel by username or invite link."""
        client = cls.get_client(account)
        if not client:
            return {"success": False, "error": "No session string"}

        clean_target = invite_link_or_username.strip()
        try:
            await client.connect()
            if "t.me/+" in clean_target or "joinchat/" in clean_target:
                hash_part = clean_target.split("+")[-1].split("/")[-1].strip()
                await client(ImportChatInviteRequest(hash_part))
                return {"success": True, "detail": "Successfully joined private chat invite"}
            else:
                uname = clean_target.replace("https://t.me/", "").replace("@", "").strip()
                entity = await client.get_entity(uname)
                await client(JoinChannelRequest(entity))
                return {"success": True, "detail": f"Successfully joined {uname}"}
        except Exception as e:
            logger.exception(f"Failed to join chat {clean_target}: {e}")
            return {"success": False, "error": str(e)}
        finally:
            try:
                await client.disconnect()
            except Exception:
                pass

    @classmethod
    async def leave_chat(
        cls,
        account: Account,
        dialog_id: int | str,
    ) -> Dict[str, Any]:
        """Leave a group or channel."""
        client = cls.get_client(account)
        if not client:
            return {"success": False, "error": "No session string"}

        try:
            await client.connect()
            target_entity = int(dialog_id) if str(dialog_id).lstrip("-").isdigit() else dialog_id
            entity = await client.get_entity(target_entity)
            if isinstance(entity, types.Channel):
                await client(LeaveChannelRequest(entity))
            else:
                await client.delete_dialog(entity)
            return {"success": True, "detail": "Successfully left chat"}
        except Exception as e:
            logger.exception(f"Failed to leave chat {dialog_id}: {e}")
            return {"success": False, "error": str(e)}
        finally:
            try:
                await client.disconnect()
            except Exception:
                pass
