"""Orchestration engine and conversation router for multi-account coordination."""
import asyncio
import random
import time
from typing import Any, Optional
from loguru import logger


class ConversationThread:
    def __init__(self, thread_id: str, target_peer: str, topic: str):
        self.thread_id = thread_id
        self.target_peer = target_peer
        self.topic = topic
        self.messages: list[dict] = []
        self.created_at = time.time()

    def add_message(self, text: str, direction: str, account: str = ""):
        self.messages.append({
            "text": text, "direction": direction, "account": account,
            "timestamp": time.time(),
        })

    def to_dict(self):
        return {
            "thread_id": self.thread_id,
            "target_peer": self.target_peer,
            "topic": self.topic,
            "message_count": len(self.messages),
            "messages": self.messages[-10:],
            "created_at": self.created_at,
        }


class OrchestrationEngine:
    # ponytail: coarse-grained lock per engine, per-thread locks if contention becomes an issue
    def __init__(self, client_manager=None, ai_engine=None):
        self.client_manager = client_manager
        self.ai_engine = ai_engine
        self.threads: dict[str, ConversationThread] = {}
        self.action_stats: dict[str, int] = {}
        self._lock = asyncio.Lock()

    async def get_available_accounts(self) -> list[dict]:
        if not self.client_manager:
            return []
        clients = await self.client_manager.get_all_clients()
        return [{"phone": phone, "connected": client.is_connected()} for phone, client in clients.items()]

    async def distribute_messages(self, target_peer: str, messages: list[str], min_delay: int = 10, max_delay: int = 60) -> dict:
        if not self.client_manager:
            raise RuntimeError("Client manager not available")
        clients = await self.client_manager.get_all_clients()
        if not clients:
            return {"status": "error", "message": "No connected accounts", "sent": 0, "total": len(messages)}

        phones = list(clients.keys())
        results = []
        for i, msg in enumerate(messages):
            phone = phones[i % len(phones)]
            delay = random.randint(min_delay, max_delay)
            try:
                msg_id = await self.client_manager.send_message(phone, target_peer, msg)
                results.append({"phone": phone, "message_preview": msg[:50], "message_id": msg_id, "delay": delay})
                await asyncio.sleep(delay)
            except Exception as e:
                logger.warning(f"Distribute failed on {phone}: {e}")
                results.append({"phone": phone, "error": str(e)})

        async with self._lock:
            key = "messages_distributed"
            self.action_stats[key] = self.action_stats.get(key, 0) + len(results)
        return {"status": "ok", "sent": sum(1 for r in results if r.get("message_id")), "total": len(messages), "results": results}

    async def create_conversation_thread(self, thread_id: str, target_peer: str, topic: str) -> ConversationThread:
        thread = ConversationThread(thread_id, target_peer, topic)
        async with self._lock:
            self.threads[thread_id] = thread
        logger.info(f"Created thread {thread_id} for {target_peer}: {topic}")
        return thread

    async def send_thread_response(self, thread_id: str, message: str, direction: str = "outbound") -> dict:
        async with self._lock:
            thread = self.threads.get(thread_id)
        if not thread:
            raise RuntimeError(f"Thread {thread_id} not found")

        if direction == "outbound" and self.client_manager:
            clients = await self.client_manager.get_all_clients()
            if clients:
                phone = random.choice(list(clients.keys()))
                try:
                    msg_id = await self.client_manager.send_message(phone, thread.target_peer, message)
                    thread.add_message(message, direction, phone)
                    return {"status": "ok", "message_id": msg_id, "account": phone}
                except Exception as e:
                    return {"status": "error", "error": str(e)}

        thread.add_message(message, direction)
        return {"status": "ok", "note": "message recorded"}

    async def collective_action(self, action_type: str, target: Any = None, **params) -> dict:
        if not self.client_manager:
            raise RuntimeError("Client manager not available")
        clients = await self.client_manager.get_all_clients()
        if not clients:
            return {"status": "error", "message": "No connected accounts", "results": []}

        phones = list(clients.keys())
        results = []
        for phone in phones:
            try:
                if action_type == "join_group":
                    from telethon.tl.functions.messages import ImportChatInviteRequest
                    client = await self.client_manager.get_client(phone)
                    if client and target:
                        hash_val = target.split("+")[-1] if target else target
                        await client(ImportChatInviteRequest(hash=hash_val))
                        results.append({"phone": phone, "status": "joined"})
                    else:
                        results.append({"phone": phone, "status": "skipped", "reason": "no client/target"})
                elif action_type == "leave_group":
                    client = await self.client_manager.get_client(phone)
                    if client and target:
                        await client.delete_dialog(target)
                        results.append({"phone": phone, "status": "left"})
                    else:
                        results.append({"phone": phone, "status": "skipped"})
                elif action_type == "react":
                    client = await self.client_manager.get_client(phone)
                    if client and target and params.get("message_id"):
                        from telethon import functions
                        await client(functions.messages.SendReactionRequest(
                            peer=target, msg_id=params["message_id"],
                            reaction=params.get("reaction", "👍"),
                        ))
                        results.append({"phone": phone, "status": "reacted"})
                else:
                    results.append({"phone": phone, "status": "unknown_action"})
                await asyncio.sleep(random.randint(2, 5))
            except Exception as e:
                logger.warning(f"Collective action {action_type} failed on {phone}: {e}")
                results.append({"phone": phone, "error": str(e)})

        async with self._lock:
            self.action_stats[action_type] = self.action_stats.get(action_type, 0) + 1
        return {"status": "ok", "action": action_type, "results": results, "accounts_used": len(phones)}

    def get_stats(self) -> dict:
        return {**self.action_stats, "active_threads": len(self.threads)}


class ConversationRouter:
    def __init__(self, client_manager=None, ai_engine=None):
        self.client_manager = client_manager
        self.ai_engine = ai_engine
        self.account_expertise: dict[str, list[str]] = {}
        self.conversations: dict[str, list[dict]] = {}
        self.stats: dict = {"routed": 0, "unmatched": 0}
        self._lock = asyncio.Lock()

    async def set_account_expertise(self, account: str, topics: list[str]):
        async with self._lock:
            self.account_expertise[account] = topics

    async def route_message(self, peer_id: str, incoming_message: str, account_id: str) -> dict:
        async with self._lock:
            if peer_id not in self.conversations:
                self.conversations[peer_id] = []
            self.conversations[peer_id].append({
                "role": "incoming", "content": incoming_message, "timestamp": time.time(),
            })

        best_account = account_id
        if not best_account or best_account == "auto":
            async with self._lock:
                best_account = self._find_best_account(incoming_message)

        response = incoming_message
        if self.ai_engine:
            async with self._lock:
                context = "\n".join(
                    f"{m['role']}: {m['content']}" for m in self.conversations[peer_id][-5:]
                )
            response = await self.ai_engine.generate_reply(context)

        async with self._lock:
            self.conversations[peer_id].append({
                "role": "outbound", "content": response, "account": best_account, "timestamp": time.time(),
            })

        if best_account and self.client_manager:
            try:
                await self.client_manager.send_message(best_account, peer_id, response)
            except Exception as e:
                logger.warning(f"Route send failed: {e}")

        async with self._lock:
            self.stats["routed"] += 1
        return {"status": "ok", "account": best_account, "response": response[:100]}

    def _find_best_account(self, message: str) -> Optional[str]:
        if not self.account_expertise or not self.client_manager:
            return None
        msg_lower = message.lower()
        best_score = 0
        best_account = None
        for account, topics in self.account_expertise.items():
            score = sum(1 for topic in topics if topic.lower() in msg_lower)
            if score > best_score:
                best_score = score
                best_account = account
        return best_account

    def get_routing_stats(self) -> dict:
        return {**self.stats, "accounts_with_expertise": len(self.account_expertise), "active_conversations": len(self.conversations)}

    def list_conversations(self) -> list[dict]:
        return [
            {"peer_id": pid, "messages": msgs[-5:], "count": len(msgs)}
            for pid, msgs in self.conversations.items()
        ]
