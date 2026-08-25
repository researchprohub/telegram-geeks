"""Telegram Web Service — Complete MTProto Dialogs, Chat Media, Reactions, Avatars, Translations, Stories, and Settings."""

import os
import io
import base64
import urllib.parse
import urllib.request
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from loguru import logger
from telethon import TelegramClient, functions, types
from telethon.sessions import StringSession
from telethon.tl.functions.channels import JoinChannelRequest, LeaveChannelRequest
from telethon.tl.functions.messages import ImportChatInviteRequest, SendReactionRequest
from telethon.tl.functions.account import UpdateProfileRequest, UpdateUsernameRequest
from telethon.tl.functions.stories import GetPeerStoriesRequest, SendStoryRequest

from app.models import Account


DEFAULT_API_ID = int(os.getenv("TELEGRAM_API_ID", "2040"))
DEFAULT_API_HASH = os.getenv("TELEGRAM_API_HASH", "b18441a1ff607e10a989891a5462e627")

# In-memory avatar & media cache for fast serving
_avatar_cache: Dict[str, bytes] = {}
_media_cache: Dict[str, tuple[bytes, str, str]] = {}


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
        """Fetch all dialogs (groups, channels, DMs, bots, archived) for an account."""
        client = cls.get_client(account)
        if not client:
            return {
                "stats": {"total": 0, "groups": 0, "channels": 0, "dms": 0, "bots": 0, "unread": 0, "archived": 0},
                "dialogs": [],
                "archived_preview": None,
                "error": "No session string available for account",
            }

        try:
            await client.connect()
            if not await client.is_user_authorized():
                return {
                    "stats": {"total": 0, "groups": 0, "channels": 0, "dms": 0, "bots": 0, "unread": 0, "archived": 0},
                    "dialogs": [],
                    "archived_preview": None,
                    "error": "Account session expired or revoked",
                }

            # If folder_type is "archived", query folder=1
            is_archived_view = folder_type == "archived"
            target_folder = 1 if is_archived_view else 0

            telethon_dialogs = await client.get_dialogs(limit=limit, folder=target_folder)

            # Query archived count if in main view
            archived_count = 0
            archived_snippet = ""
            if not is_archived_view:
                try:
                    arch_dialogs = await client.get_dialogs(limit=10, folder=1)
                    archived_count = len(arch_dialogs)
                    if arch_dialogs:
                        archived_snippet = ", ".join([d.name or "Chat" for d in arch_dialogs[:3]])
                except Exception:
                    pass

            dialog_list: List[Dict[str, Any]] = []

            stats = {
                "total": 0,
                "groups": 0,
                "channels": 0,
                "dms": 0,
                "bots": 0,
                "unread": 0,
                "archived": archived_count,
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
                if folder_type not in ("all", "archived"):
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
                has_media = False
                media_kind = None
                if d.message:
                    if d.message.message:
                        last_msg = d.message.message
                    elif d.message.media:
                        has_media = True
                        media_kind = d.message.media.__class__.__name__.replace("MessageMedia", "").lower()
                        last_msg = f"[{media_kind.capitalize()}]"

                    if d.message.date:
                        last_date = d.message.date.isoformat()

                photo_obj = getattr(entity, "photo", None)
                has_photo = bool(photo_obj and not isinstance(photo_obj, (types.ChatPhotoEmpty, types.UserProfilePhotoEmpty)))

                dialog_list.append({
                    "id": d.id,
                    "title": title,
                    "type": d_type,
                    "unread_count": unread,
                    "pinned": bool(d.pinned),
                    "last_message": last_msg,
                    "last_message_date": last_date,
                    "has_media": has_media,
                    "media_kind": media_kind,
                    "has_photo": has_photo,
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
                "archived_preview": {
                    "count": archived_count,
                    "snippet": archived_snippet,
                } if archived_count > 0 else None,
            }

        except Exception as e:
            logger.exception(f"Failed to fetch dialogs for account {account.id}: {e}")
            return {
                "stats": {"total": 0, "groups": 0, "channels": 0, "dms": 0, "bots": 0, "unread": 0, "archived": 0},
                "dialogs": [],
                "archived_preview": None,
                "error": str(e),
            }
        finally:
            try:
                await client.disconnect()
            except Exception:
                pass

    @classmethod
    async def get_avatar(cls, account: Account, dialog_id: int | str) -> Optional[bytes]:
        """Download and cache profile photo for a chat/channel/user."""
        cache_key = f"{account.id}_{dialog_id}"
        if cache_key in _avatar_cache:
            return _avatar_cache[cache_key]

        client = cls.get_client(account)
        if not client:
            return None

        try:
            await client.connect()
            target_entity = int(dialog_id) if str(dialog_id).lstrip("-").isdigit() else dialog_id
            try:
                entity = await client.get_entity(target_entity)
            except Exception:
                entity = await client.get_input_entity(target_entity)
            buf = io.BytesIO()
            res = await client.download_profile_photo(entity, file=buf, download_big=False)
            if res:
                img_bytes = buf.getvalue()
                if len(img_bytes) > 0:
                    _avatar_cache[cache_key] = img_bytes
                    return img_bytes
            return None
        except Exception as e:
            logger.debug(f"Could not download avatar for {dialog_id}: {e}")
            return None
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
        """Fetch message history with full media, replies, and reactions."""
        client = cls.get_client(account)
        if not client:
            return {"messages": [], "error": "No session string"}

        try:
            await client.connect()
            target_entity = int(dialog_id) if str(dialog_id).lstrip("-").isdigit() else dialog_id
            entity = await client.get_input_entity(target_entity)
            history = await client.get_messages(entity, limit=limit)

            formatted_msgs = []
            for m in reversed(history):
                media_info = None
                if m.media:
                    media_type = "document"
                    file_name = None
                    file_size = None
                    mime_type = None
                    duration = None

                    if m.photo:
                        media_type = "photo"
                        file_name = f"photo_{m.id}.jpg"
                        mime_type = "image/jpeg"
                    elif m.video:
                        media_type = "video"
                        file_name = f"video_{m.id}.mp4"
                        mime_type = "video/mp4"
                    elif m.voice:
                        media_type = "voice"
                        file_name = f"voice_{m.id}.ogg"
                        mime_type = "audio/ogg"
                    elif m.document:
                        media_type = "document"
                        if hasattr(m.document, "attributes"):
                            for attr in m.document.attributes:
                                if isinstance(attr, types.DocumentAttributeFilename):
                                    file_name = attr.file_name
                                elif isinstance(attr, types.DocumentAttributeVideo):
                                    media_type = "video"
                                    duration = getattr(attr, "duration", None)
                                elif isinstance(attr, types.DocumentAttributeAudio):
                                    media_type = "audio"
                                    duration = getattr(attr, "duration", None)
                        if hasattr(m.document, "size"):
                            file_size = m.document.size
                        if hasattr(m.document, "mime_type"):
                            mime_type = m.document.mime_type

                    media_info = {
                        "type": media_type,
                        "file_name": file_name or f"file_{m.id}",
                        "file_size": file_size,
                        "mime_type": mime_type,
                        "duration": duration,
                        "download_url": f"/api/v1/accounts/{account.id}/dialogs/{dialog_id}/messages/{m.id}/media",
                    }

                # Reactions
                reactions_list = []
                if hasattr(m, "reactions") and m.reactions and hasattr(m.reactions, "results"):
                    for r in m.reactions.results:
                        emoticon = getattr(r.reaction, "emoticon", None)
                        if emoticon:
                            reactions_list.append({
                                "emoji": emoticon,
                                "count": r.count,
                                "chosen": bool(getattr(r, "chosen", False)),
                            })

                sender_name = None
                sender_username = None
                if m.sender:
                    if hasattr(m.sender, "first_name"):
                        sender_name = f"{m.sender.first_name or ''} {getattr(m.sender, 'last_name', '') or ''}".strip()
                        sender_username = getattr(m.sender, "username", None)
                    elif hasattr(m.sender, "title"):
                        sender_name = m.sender.title

                formatted_msgs.append({
                    "id": m.id,
                    "text": m.message or "",
                    "date": m.date.isoformat() if m.date else None,
                    "out": bool(m.out),
                    "sender_id": m.sender_id,
                    "sender_name": sender_name,
                    "sender_username": sender_username,
                    "media": media_info,
                    "reactions": reactions_list,
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
    async def download_media(
        cls,
        account: Account,
        dialog_id: int | str,
        message_id: int,
    ) -> Optional[tuple[bytes, str, str]]:
        """Download media file bytes, returning (bytes, filename, mime_type)."""
        cache_key = f"{account.id}_{dialog_id}_{message_id}"
        if cache_key in _media_cache:
            return _media_cache[cache_key]

        client = cls.get_client(account)
        if not client:
            return None

        try:
            await client.connect()
            target_entity = int(dialog_id) if str(dialog_id).lstrip("-").isdigit() else dialog_id
            try:
                entity = await client.get_entity(target_entity)
            except Exception:
                entity = await client.get_input_entity(target_entity)
            message = await client.get_messages(entity, ids=message_id)

            if not message or not message.media:
                return None

            buf = io.BytesIO()
            await client.download_media(message, file=buf)
            file_bytes = buf.getvalue()

            filename = f"media_{message_id}"
            mime_type = "application/octet-stream"

            if message.photo:
                filename = f"photo_{message_id}.jpg"
                mime_type = "image/jpeg"
            elif message.document:
                if hasattr(message.document, "attributes"):
                    for attr in message.document.attributes:
                        if isinstance(attr, types.DocumentAttributeFilename):
                            filename = attr.file_name
                        elif isinstance(attr, types.DocumentAttributeVideo):
                            filename = f"video_{message_id}.mp4"
                            mime_type = "video/mp4"
                if hasattr(message.document, "mime_type") and message.document.mime_type:
                    mime_type = message.document.mime_type

            result = (file_bytes, filename, mime_type)
            if len(file_bytes) > 0:
                _media_cache[cache_key] = result
            return result
        except Exception as e:
            logger.exception(f"Failed to download media for msg {message_id}: {e}")
            return None
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
    async def send_media(
        cls,
        account: Account,
        dialog_id: int | str,
        file_bytes: bytes,
        filename: str,
        caption: Optional[str] = None,
        reply_to: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Send a file or image attachment to a chat/channel."""
        client = cls.get_client(account)
        if not client:
            return {"success": False, "error": "No session string"}

        try:
            await client.connect()
            target_entity = int(dialog_id) if str(dialog_id).lstrip("-").isdigit() else dialog_id
            entity = await client.get_input_entity(target_entity)

            file_stream = io.BytesIO(file_bytes)
            file_stream.name = filename

            sent = await client.send_file(
                entity,
                file=file_stream,
                caption=caption or "",
                reply_to=reply_to,
            )

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
            logger.exception(f"Failed to send media to dialog {dialog_id}: {e}")
            return {"success": False, "error": str(e)}
        finally:
            try:
                await client.disconnect()
            except Exception:
                pass

    @classmethod
    async def send_reaction(
        cls,
        account: Account,
        dialog_id: int | str,
        message_id: int,
        emoji: str,
    ) -> Dict[str, Any]:
        """Send an emoji reaction to a message."""
        client = cls.get_client(account)
        if not client:
            return {"success": False, "error": "No session string"}

        try:
            await client.connect()
            target_entity = int(dialog_id) if str(dialog_id).lstrip("-").isdigit() else dialog_id
            entity = await client.get_input_entity(target_entity)

            await client(
                SendReactionRequest(
                    peer=entity,
                    msg_id=message_id,
                    reaction=[types.ReactionEmoji(emoticon=emoji)],
                )
            )
            return {"success": True, "emoji": emoji, "message_id": message_id}
        except Exception as e:
            logger.exception(f"Failed to send reaction: {e}")
            return {"success": False, "error": str(e)}
        finally:
            try:
                await client.disconnect()
            except Exception:
                pass

    @classmethod
    def translate_text(cls, text: str, target_lang: str = "en") -> str:
        """Translate text using free multi-language engine."""
        if not text or not text.strip():
            return ""

        try:
            clean_text = text.strip()
            encoded_text = urllib.parse.quote(clean_text)
            url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={target_lang}&dt=t&q={encoded_text}"

            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
            )
            with urllib.request.urlopen(req, timeout=8) as response:
                result = json.loads(response.read().decode("utf-8"))
                translated = "".join([part[0] for part in result[0] if part[0]])
                return translated or clean_text
        except Exception as e:
            logger.warning(f"Translation failed: {e}")
            return text

    @classmethod
    async def get_stories(cls, account: Account) -> Dict[str, Any]:
        """Fetch active stories for the connected account."""
        client = cls.get_client(account)
        if not client:
            return {"stories": [], "error": "No session string"}

        try:
            await client.connect()
            me = await client.get_me()
            stories_res = await client(GetPeerStoriesRequest(peer=me))

            stories_list = []
            if hasattr(stories_res, "stories") and hasattr(stories_res.stories, "stories"):
                for s in stories_res.stories.stories:
                    stories_list.append({
                        "id": s.id,
                        "date": s.date.isoformat() if hasattr(s, "date") else None,
                        "expire_date": s.expire_date.isoformat() if hasattr(s, "expire_date") else None,
                        "caption": getattr(s, "caption", ""),
                        "views": getattr(s, "views", None),
                    })

            return {"stories": stories_list}
        except Exception as e:
            logger.debug(f"Stories fetch error: {e}")
            return {"stories": []}
        finally:
            try:
                await client.disconnect()
            except Exception:
                pass

    @classmethod
    async def upload_story(
        cls,
        account: Account,
        file_bytes: bytes,
        filename: str,
        caption: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Publish a new Telegram story."""
        client = cls.get_client(account)
        if not client:
            return {"success": False, "error": "No session string"}

        try:
            await client.connect()
            file_stream = io.BytesIO(file_bytes)
            file_stream.name = filename

            uploaded_media = await client.upload_file(file_stream)
            input_media = types.InputMediaUploadedPhoto(file=uploaded_media)

            res = await client(
                SendStoryRequest(
                    peer=types.InputPeerSelf(),
                    media=input_media,
                    privacy_rules=[types.InputPrivacyValueAllowAll()],
                    caption=caption or "",
                )
            )
            return {"success": True, "detail": "Story published successfully"}
        except Exception as e:
            logger.exception(f"Story upload error: {e}")
            return {"success": False, "error": str(e)}
        finally:
            try:
                await client.disconnect()
            except Exception:
                pass

    @classmethod
    async def get_telegram_settings(cls, account: Account) -> Dict[str, Any]:
        """Get Telegram profile and security settings."""
        client = cls.get_client(account)
        if not client:
            return {"error": "No session string"}

        try:
            await client.connect()
            me = await client.get_me()
            full = await client(functions.users.GetFullUserRequest(me))

            return {
                "id": me.id,
                "first_name": me.first_name or "",
                "last_name": me.last_name or "",
                "username": me.username or "",
                "phone": me.phone or account.phone_number or "",
                "bio": getattr(full.full_user, "about", "") or "",
                "is_premium": bool(getattr(me, "premium", False)),
                "is_verified": bool(getattr(me, "verified", False)),
                "dc_id": getattr(me.photo, "dc_id", None) if getattr(me, "photo", None) else None,
            }
        except Exception as e:
            logger.exception(f"Get settings failed: {e}")
            return {"error": str(e)}
        finally:
            try:
                await client.disconnect()
            except Exception:
                pass

    @classmethod
    async def update_telegram_profile(
        cls,
        account: Account,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        bio: Optional[str] = None,
        username: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Update Telegram first_name, last_name, bio, or username."""
        client = cls.get_client(account)
        if not client:
            return {"success": False, "error": "No session string"}

        try:
            await client.connect()
            if first_name is not None or last_name is not None or bio is not None:
                await client(
                    UpdateProfileRequest(
                        first_name=first_name if first_name is not None else "",
                        last_name=last_name if last_name is not None else "",
                        about=bio if bio is not None else "",
                    )
                )

            if username is not None:
                await client(UpdateUsernameRequest(username=username.lstrip("@")))

            return {"success": True, "detail": "Profile updated successfully"}
        except Exception as e:
            logger.exception(f"Update profile failed: {e}")
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
