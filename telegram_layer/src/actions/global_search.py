"""Global Search module — search Telegram for users, channels, groups by keyword.

Telegram Expert manual: Global search

Searches:
- Users
- Channels
- Groups
- Bots
"""

import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional
from loguru import logger


class GlobalSearchService:
    """Search Telegram globally for users, channels, groups."""

    def __init__(self, client_manager):
        self.client_manager = client_manager
        self.search_history: List[Dict] = []

    async def search_global(
        self,
        account_phone: str,
        query: str,
        search_users: bool = True,
        search_channels: bool = True,
        search_groups: bool = True,
        search_bots: bool = True,
        limit: int = 50,
    ) -> Dict:
        """Perform global search on Telegram.
        
        Args:
            account_phone: Account to use for search
            query: Search query
            search_users: Search for users
            search_channels: Search for channels
            search_groups: Search for groups
            search_bots: Search for bots
            limit: Maximum results per type
        """
        logger.info(f"Global search: '{query}' from {account_phone}")
        
        client = await self.client_manager.get_client(account_phone)
        if not client:
            return {
                "status": "error",
                "message": f"Account {account_phone} not connected",
            }
        
        try:
            # Perform search
            results = await client.search(query=query, limit=limit * 4)
            
            # Categorize results
            users = []
            channels = []
            groups = []
            bots = []
            
            for entity in results:
                if not entity:
                    continue
                
                # Get entity details
                entity_info = {
                    "id": entity.id,
                    "username": getattr(entity, 'username', None),
                    "first_name": getattr(entity, 'first_name', None),
                    "last_name": getattr(entity, 'last_name', None),
                    "phone": getattr(entity, 'phone', None),
                    "title": getattr(entity, 'title', None),
                    "participants_count": getattr(entity, 'participants_count', None),
                    "photo": hasattr(entity, 'photo') and entity.photo is not None,
                }
                
                # Categorize
                if hasattr(entity, 'bot') and entity.bot:
                    if search_bots:
                        bots.append(entity_info)
                elif hasattr(entity, 'megagroup') and entity.megagroup:
                    if search_groups:
                        groups.append(entity_info)
                elif hasattr(entity, 'broadcast') and entity.broadcast:
                    if search_channels:
                        channels.append(entity_info)
                elif hasattr(entity, 'username') or hasattr(entity, 'phone'):
                    if search_users:
                        users.append(entity_info)
            
            # Trim to limits
            users = users[:limit]
            channels = channels[:limit]
            groups = groups[:limit]
            bots = bots[:limit]
            
            result = {
                "status": "success",
                "query": query,
                "account": account_phone,
                "total_found": len(users) + len(channels) + len(groups) + len(bots),
                "results": {
                    "users": users,
                    "channels": channels,
                    "groups": groups,
                    "bots": bots,
                },
            }
            
            # Record in history
            self.search_history.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "query": query,
                "account": account_phone,
                "total_found": result["total_found"],
            })
            
            return result
        
        except Exception as e:
            logger.error(f"Global search error: {e}")
            return {
                "status": "error",
                "message": str(e),
            }

    async def search_users(
        self,
        account_phone: str,
        query: str,
        limit: int = 50,
    ) -> Dict:
        """Search specifically for users.
        
        Args:
            account_phone: Account to use
            query: Search query (name, username, phone)
            limit: Maximum results
        """
        return await self.search_global(
            account_phone, query,
            search_users=True,
            search_channels=False,
            search_groups=False,
            search_bots=False,
            limit=limit,
        )

    async def search_channels(
        self,
        account_phone: str,
        query: str,
        limit: int = 50,
    ) -> Dict:
        """Search specifically for channels.
        
        Args:
            account_phone: Account to use
            query: Search query
            limit: Maximum results
        """
        return await self.search_global(
            account_phone, query,
            search_users=False,
            search_channels=True,
            search_groups=False,
            search_bots=False,
            limit=limit,
        )

    async def search_groups(
        self,
        account_phone: str,
        query: str,
        limit: int = 50,
    ) -> Dict:
        """Search specifically for groups.
        
        Args:
            account_phone: Account to use
            query: Search query
            limit: Maximum results
        """
        return await self.search_global(
            account_phone, query,
            search_users=False,
            search_channels=False,
            search_groups=True,
            search_bots=False,
            limit=limit,
        )

    async def get_user_info(
        self,
        account_phone: str,
        user_id: int,
    ) -> Dict:
        """Get detailed info about a user.
        
        Args:
            account_phone: Account to use
            user_id: User ID to look up
        """
        logger.info(f"Getting user info for {user_id}")
        
        client = await self.client_manager.get_client(account_phone)
        if not client:
            return {
                "status": "error",
                "message": f"Account {account_phone} not connected",
            }
        
        try:
            user = await client.get_entity(user_id)
            
            user_info = {
                "id": user.id,
                "username": getattr(user, 'username', None),
                "first_name": getattr(user, 'first_name', None),
                "last_name": getattr(user, 'last_name', None),
                "phone": getattr(user, 'phone', None),
                "about": getattr(user, 'about', None),
                "photo": hasattr(user, 'photo') and user.photo is not None,
                "bot": getattr(user, 'bot', False),
                "verified": getattr(user, 'verified', False),
                "restricted": getattr(user, 'restricted', False),
            }
            
            return {
                "status": "success",
                "user": user_info,
            }
        
        except Exception as e:
            logger.error(f"Error getting user info: {e}")
            return {
                "status": "error",
                "message": str(e),
            }

    def get_search_history(self, limit: int = 50) -> List[Dict]:
        """Get search history."""
        return self.search_history[-limit:]
