"""Open Dialogs module — view all dialogs/messages across accounts.

Telegram Expert manual: Open dialogues

Displays:
- All conversations
- Message history
- Contact information
- Group/channel membership
"""

import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional
from loguru import logger


class OpenDialogsService:
    """View and manage dialogs across accounts."""

    def __init__(self, client_manager):
        self.client_manager = client_manager

    async def get_all_dialogs(
        self,
        account_phone: str,
        limit: int = 50,
        exclude_bots: bool = True,
        exclude_muted: bool = False,
    ) -> Dict:
        """Get all dialogs for an account.
        
        Args:
            account_phone: Account phone number
            limit: Maximum number of dialogs to return
            exclude_bots: Exclude bot conversations
            exclude_muted: Exclude muted conversations
        """
        logger.info(f"Getting dialogs for {account_phone}")
        
        client = await self.client_manager.get_client(account_phone)
        if not client:
            return {
                "status": "error",
                "message": f"Account {account_phone} not connected",
            }
        
        try:
            # Get dialogs
            dialogs = await client.get_dialogs(limit=limit)
            
            result_dialogs = []
            for dialog in dialogs:
                # Skip bots if requested
                if exclude_bots and dialog.entity and hasattr(dialog.entity, 'bot') and dialog.entity.bot:
                    continue
                
                # Skip muted if requested
                if exclude_muted and dialog.muted:
                    continue
                
                # Extract dialog info
                dialog_info = {
                    "id": dialog.id,
                    "name": getattr(dialog.entity, 'title', None) or 
                           f"{getattr(dialog.entity, 'first_name', '')} {getattr(dialog.entity, 'last_name', '')}".strip(),
                    "username": getattr(dialog.entity, 'username', None),
                    "phone": getattr(dialog.entity, 'phone', None),
                    "type": self._get_dialog_type(dialog),
                    "unread_count": dialog.unread_count,
                    "is_muted": dialog.muted,
                    "is_fast_private": dialog.fast_private,
                    "last_message": dialog.top_message.text if dialog.top_message else None,
                    "last_message_date": dialog.top_message.date.isoformat() if dialog.top_message and dialog.top_message.date else None,
                }
                
                result_dialogs.append(dialog_info)
            
            return {
                "status": "success",
                "account": account_phone,
                "total_dialogs": len(result_dialogs),
                "dialogs": result_dialogs,
            }
        
        except Exception as e:
            logger.error(f"Error getting dialogs: {e}")
            return {
                "status": "error",
                "message": str(e),
            }

    async def get_message_history(
        self,
        account_phone: str,
        chat_id: int,
        limit: int = 50,
        offset: int = 0,
    ) -> Dict:
        """Get message history for a specific chat.
        
        Args:
            account_phone: Account phone number
            chat_id: Chat/group/channel ID
            limit: Maximum messages to return
            offset: Offset for pagination
        """
        logger.info(f"Getting message history for {chat_id}")
        
        client = await self.client_manager.get_client(account_phone)
        if not client:
            return {
                "status": "error",
                "message": f"Account {account_phone} not connected",
            }
        
        try:
            messages = await client.get_messages(chat_id, limit=limit, offset=offset)
            
            message_list = []
            for msg in messages:
                if msg:
                    msg_info = {
                        "id": msg.id,
                        "text": msg.text or "",
                        "date": msg.date.isoformat() if msg.date else None,
                        "from_id": msg.from_id.user_id if msg.from_id else None,
                        "to_id": msg.to_id.peer_id if msg.to_id else None,
                        "views": msg.views,
                        "replies": msg.replies,
                        "forwards": msg.forwards,
                        "has_media": bool(msg.media),
                        "media_type": type(msg.media).__name__ if msg.media else None,
                    }
                    message_list.append(msg_info)
            
            return {
                "status": "success",
                "chat_id": chat_id,
                "total_messages": len(message_list),
                "messages": message_list,
            }
        
        except Exception as e:
            logger.error(f"Error getting message history: {e}")
            return {
                "status": "error",
                "message": str(e),
            }

    async def search_messages(
        self,
        account_phone: str,
        chat_id: int,
        query: str,
        limit: int = 50,
    ) -> Dict:
        """Search messages in a chat.
        
        Args:
            account_phone: Account phone number
            chat_id: Chat/group/channel ID
            query: Search query
            limit: Maximum results
        """
        logger.info(f"Searching messages in {chat_id} for '{query}'")
        
        client = await self.client_manager.get_client(account_phone)
        if not client:
            return {
                "status": "error",
                "message": f"Account {account_phone} not connected",
            }
        
        try:
            messages = await client.get_messages(
                chat_id,
                limit=limit * 10,  # Get more to filter
                search=query,
            )
            
            # Filter and format results
            results = []
            for msg in messages:
                if msg and msg.text and query.lower() in msg.text.lower():
                    results.append({
                        "id": msg.id,
                        "text": msg.text,
                        "date": msg.date.isoformat() if msg.date else None,
                        "from_id": msg.from_id.user_id if msg.from_id else None,
                    })
            
            return {
                "status": "success",
                "query": query,
                "total_found": len(results),
                "messages": results[:limit],
            }
        
        except Exception as e:
            logger.error(f"Error searching messages: {e}")
            return {
                "status": "error",
                "message": str(e),
            }

    def _get_dialog_type(self, dialog) -> str:
        """Get dialog type string."""
        try:
            from telethon.tl.types import (
                PeerUser, PeerChat, PeerChannel,
                User, Chat, Channel,
            )
            
            if dialog.entity:
                if isinstance(dialog.entity, User):
                    return "private"
                elif isinstance(dialog.entity, Chat):
                    return "group"
                elif isinstance(dialog.entity, Channel):
                    return "channel"
            
            return "unknown"
        except:
            return "unknown"

    async def get_contact_list(
        self,
        account_phone: str,
    ) -> Dict:
        """Get contact list for an account.
        
        Args:
            account_phone: Account phone number
        """
        logger.info(f"Getting contact list for {account_phone}")
        
        client = await self.client_manager.get_client(account_phone)
        if not client:
            return {
                "status": "error",
                "message": f"Account {account_phone} not connected",
            }
        
        try:
            contacts = await client.get_contacts()
            
            contact_list = []
            for contact in contacts:
                contact_info = {
                    "id": contact.id,
                    "phone": contact.phone,
                    "first_name": contact.first_name or "",
                    "last_name": contact.last_name or "",
                    "username": contact.username or "",
                    "mutual": contact.mutual,
                }
                contact_list.append(contact_info)
            
            return {
                "status": "success",
                "account": account_phone,
                "total_contacts": len(contact_list),
                "contacts": contact_list,
            }
        
        except Exception as e:
            logger.error(f"Error getting contacts: {e}")
            return {
                "status": "error",
                "message": str(e),
            }
