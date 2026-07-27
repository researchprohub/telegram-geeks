"""AI Conversation Routing — routes incoming messages to appropriate accounts based on expertise.

Key capabilities:
- Topic-based routing to specialized accounts
- Sentiment-aware response selection
- Load balancing across available accounts
- Context preservation across account switches
"""

import asyncio
import json
import random
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from loguru import logger


class ConversationContext:
    """Stores conversation context for a given peer."""

    def __init__(self, peer_id: str):
        self.peer_id = peer_id
        self.history: List[Dict[str, Any]] = []
        self.last_interaction: Optional[datetime] = None
        self.routed_account: Optional[str] = None
        self.topic_tags: List[str] = []
        self.sentiment: str = "neutral"

    def add_message(self, role: str, content: str, account: str = ""):
        self.history.append({
            "role": role,
            "content": content,
            "account": account,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        self.last_interaction = datetime.now(timezone.utc)
        if account:
            self.routed_account = account

    def to_dict(self) -> dict:
        return {
            "peer_id": self.peer_id,
            "message_count": len(self.history),
            "last_interaction": self.last_interaction.isoformat() if self.last_interaction else None,
            "routed_account": self.routed_account,
            "topic_tags": self.topic_tags,
            "recent_messages": self.history[-5:],  # Last 5 messages
        }


class ConversationRouter:
    """Routes incoming messages to appropriate Telegram accounts."""

    TOPIC_KEYWORDS = {
        "crypto": ["bitcoin", "crypto", "btc", "eth", "token", "blockchain", "defi", "nft"],
        "tech": ["software", "programming", "code", "developer", "api", "tech", "startup"],
        "marketing": ["marketing", "ads", "promotion", "seo", "content", "brand"],
        "finance": ["investment", "stock", "trading", "money", "bank", "loan", "credit"],
        "general": ["hello", "hi", "hey", "thanks", "help", "question"],
    }

    def __init__(self, client_manager, ai_engine=None):
        self.client_manager = client_manager
        self.ai_engine = ai_engine
        self.conversation_contexts: Dict[str, ConversationContext] = {}
        self.account_expertise: Dict[str, List[str]] = {}  # account -> topics
        self._routing_stats = {"total_routed": 0, "per_account": {}}

    def classify_topic(self, message: str) -> str:
        """Classify a message into a topic category."""
        msg_lower = message.lower()
        best_match = "general"
        best_score = 0

        for topic, keywords in self.TOPIC_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in msg_lower)
            if score > best_score:
                best_score = score
                best_match = topic

        return best_match

    async def select_best_account(
        self,
        topic: str,
        excluded_accounts: Optional[List[str]] = None,
    ) -> Optional[str]:
        """Select the best account for a given topic.

        Prioritizes accounts with matching expertise, then round-robin.
        """
        excluded = excluded_accounts or []

        # Get available accounts
        clients = await self.client_manager.get_all_clients()
        available = [p for p in clients.keys() if p not in excluded]

        if not available:
            return None

        # Filter by expertise if configured
        expert_accounts = [
            acc for acc in available
            if topic in self.account_expertise.get(acc, [])
        ]

        if expert_accounts:
            return random.choice(expert_accounts)

        # Round-robin fallback
        return available[len(self._routing_stats["per_account"]) % len(available)]

    async def route_message(
        self,
        peer_id: str,
        incoming_message: str,
        account_id: str,
    ) -> Dict[str, Any]:
        """Process an incoming message and route a response."""
        # Get or create conversation context
        if peer_id not in self.conversation_contexts:
            self.conversation_contexts[peer_id] = ConversationContext(peer_id)

        ctx = self.conversation_contexts[peer_id]
        ctx.add_message("incoming", incoming_message, account_id)

        # Classify topic
        topic = self.classify_topic(incoming_message)
        ctx.topic_tags.append(topic)

        # Select best account for response
        response_account = await self.select_best_account(
            topic, excluded_accounts=[account_id]
        )

        if not response_account:
            return {"status": "error", "message": "No available accounts for response"}

        # Generate response using AI if available
        response_text = ""
        if self.ai_engine:
            context_summary = " ".join(
                [m["content"] for m in ctx.history[-6:]]
            )
            prompt = f"Reply naturally to this message in a {topic} context. Keep it casual and helpful:\n\n{incoming_message}\n\nContext: {context_summary}"
            response_text = await self.ai_engine.generate(prompt, max_tokens=200)
        else:
            # Fallback: simple canned responses
            response_text = self._get_canned_response(topic)

        # Send response
        try:
            await asyncio.sleep(random.uniform(2, 10))
            result = await self.client_manager.send_message(
                response_account, peer_id, response_text
            )

            # Update stats
            self._routing_stats["total_routed"] += 1
            self._routing_stats["per_account"][response_account] = \
                self._routing_stats["per_account"].get(response_account, 0) + 1

            ctx.add_message("outbound", response_text, response_account)

            return {
                "status": "routed",
                "topic": topic,
                "response_account": response_account,
                "response_text": response_text,
                "routing_stats": self._routing_stats,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def _get_canned_response(self, topic: str) -> str:
        """Get a canned response for a topic (fallback when AI unavailable)."""
        responses = {
            "crypto": "Interesting topic! I've been following the market closely. What's your take on the current trend?",
            "tech": "Great point about technology. I think this could really change how we work.",
            "marketing": "That's a solid marketing strategy. Have you considered A/B testing?",
            "finance": "Financial planning is key. What's your approach to managing investments?",
            "general": "Thanks for reaching out! How can I help you today?",
        }
        return responses.get(topic, responses["general"])

    def get_routing_stats(self) -> dict:
        """Get routing statistics."""
        return {
            **self._routing_stats,
            "active_conversations": len(self.conversation_contexts),
        }

    def get_conversation_context(self, peer_id: str) -> Optional[dict]:
        """Get conversation context for a peer."""
        ctx = self.conversation_contexts.get(peer_id)
        return ctx.to_dict() if ctx else None

    def list_conversations(self) -> List[dict]:
        """List all conversation contexts."""
        return [ctx.to_dict() for ctx in self.conversation_contexts.values()]

    async def set_account_expertise(self, account: str, topics: List[str]):
        """Set topic expertise for an account."""
        self.account_expertise[account] = topics
        logger.info(f"Set expertise for {account}: {topics}")
