"""Search Chats with Admin Rights module — find chats/channels where account has admin privileges.

Telegram Expert manual: Search for chats and channels with administrator rights

Finds:
- Groups where account is admin
- Channels where account is admin
- Bot permissions in each chat
"""

import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional
from loguru import logger


class AdminChatSearchService:
    """Search for chats where account has admin rights."""

    def __init__(self, client_manager):
        self.client_manager = client_manager

    async def search_admin_chats(
        self,
        account_phone: str,
        chat_type: str = "all",  # all, groups, channels
    ) -> Dict:
        """Search for chats where account has admin rights.
        
        Args:
            account_phone: Account to search with
            chat_type: Type of chats to search
        """
        logger.info(f"Searching admin chats for {account_phone}")
        
        client = await self.client_manager.get_client(account_phone)
        if not client:
            return {
                "status": "error",
                "message": f"Account {account_phone} not connected",
            }
        
        try:
            # Get all dialogs
            dialogs = await client.get_dialogs()
            
            admin_chats = []
            
            for dialog in dialogs:
                if not dialog.entity:
                    continue
                
                # Check if we're an admin
                is_admin = await self._check_admin_rights(client, dialog.entity)
                
                if is_admin:
                    chat_info = {
                        "id": dialog.entity.id,
                        "title": getattr(dialog.entity, 'title', None),
                        "username": getattr(dialog.entity, 'username', None),
                        "type": self._get_chat_type(dialog.entity),
                        "is_admin": True,
                        "permissions": await self._get_admin_permissions(client, dialog.entity),
                        "members_count": getattr(dialog.entity, 'participants_count', 0),
                    }
                    admin_chats.append(chat_info)
            
            # Filter by chat type
            if chat_type == "groups":
                admin_chats = [c for c in admin_chats if c["type"] == "group"]
            elif chat_type == "channels":
                admin_chats = [c for c in admin_chats if c["type"] == "channel"]
            
            return {
                "status": "success",
                "account": account_phone,
                "chat_type": chat_type,
                "total_admin_chats": len(admin_chats),
                "admin_chats": admin_chats,
            }
        
        except Exception as e:
            logger.error(f"Error searching admin chats: {e}")
            return {
                "status": "error",
                "message": str(e),
            }

    async def _check_admin_rights(self, client, entity) -> bool:
        """Check if client has admin rights in entity."""
        try:
            from telethon.tl.functions.channels import GetParticipantRequest
            from telethon.tl.types import ChannelParticipantsAdmins
            
            # Try to get participant info
            participant = await client(GetParticipantRequest(entity, client.get_me().id))
            
            # Check if admin
            if hasattr(participant, 'admin') and participant.admin:
                return True
            
            # Also check if creator
            if hasattr(participant, 'creator') and participant.creator:
                return True
            
            return False
            
        except Exception as e:
            logger.debug(f"Admin check error: {e}")
            return False

    async def _get_admin_permissions(self, client, entity) -> Dict:
        """Get admin permissions for account in entity."""
        permissions = {
            "change_info": False,
            "post_messages": False,
            "edit_messages": False,
            "delete_messages": False,
            "ban_users": False,
            "invite_users": False,
            "pin_messages": False,
            "add_admins": False,
            "anonymous": False,
            "manage_call": False,
        }
        
        try:
            from telethon.tl.functions.channels import GetParticipantRequest
            from telethon.tl.types import ChannelParticipantsAdmins
            
            participant = await client(GetParticipantRequest(entity, client.get_me().id))
            
            if hasattr(participant, 'admin_rights'):
                admin_rights = participant.admin_rights
                permissions["change_info"] = getattr(admin_rights, 'change_info', False)
                permissions["post_messages"] = getattr(admin_rights, 'post_messages', False)
                permissions["edit_messages"] = getattr(admin_rights, 'edit_messages', False)
                permissions["delete_messages"] = getattr(admin_rights, 'delete_messages', False)
                permissions["ban_users"] = getattr(admin_rights, 'ban_users', False)
                permissions["invite_users"] = getattr(admin_rights, 'invite_users', False)
                permissions["pin_messages"] = getattr(admin_rights, 'pin_messages', False)
                permissions["add_admins"] = getattr(admin_rights, 'add_admins', False)
                permissions["anonymous"] = getattr(admin_rights, 'anonymous', False)
                permissions["manage_call"] = getattr(admin_rights, 'manage_call', False)
        
        except Exception as e:
            logger.debug(f"Permissions check error: {e}")
        
        return permissions

    def _get_chat_type(self, entity) -> str:
        """Get chat type string."""
        try:
            from telethon.tl.types import (
                Channel, Chat, Group,
            )
            
            if isinstance(entity, Channel):
                if getattr(entity, 'megagroup', False):
                    return "supergroup"
                elif getattr(entity, 'broadcast', False):
                    return "channel"
                else:
                    return "channel"
            elif isinstance(entity, (Chat, Group)):
                return "group"
            else:
                return "unknown"
        except:
            return "unknown"

    async def get_chat_participants(
        self,
        account_phone: str,
        chat_id: int,
        limit: int = 100,
    ) -> Dict:
        """Get participants of a chat.
        
        Args:
            account_phone: Account to use
            chat_id: Chat ID
            limit: Maximum participants
        """
        logger.info(f"Getting participants for chat {chat_id}")
        
        client = await self.client_manager.get_client(account_phone)
        if not client:
            return {
                "status": "error",
                "message": f"Account {account_phone} not connected",
            }
        
        try:
            participants = await client.get_participants(chat_id, limit=limit)
            
            participant_list = []
            for p in participants:
                participant_info = {
                    "id": p.id,
                    "first_name": getattr(p, 'first_name', None),
                    "last_name": getattr(p, 'last_name', None),
                    "username": getattr(p, 'username', None),
                    "phone": getattr(p, 'phone', None),
                    "is_bot": getattr(p, 'bot', False),
                    "is_admin": getattr(p, 'admin', False),
                    "is_creator": getattr(p, 'creator', False),
                }
                participant_list.append(participant_info)
            
            return {
                "status": "success",
                "chat_id": chat_id,
                "total_participants": len(participant_list),
                "participants": participant_list,
            }
        
        except Exception as e:
            logger.error(f"Error getting participants: {e}")
            return {
                "status": "error",
                "message": str(e),
            }
