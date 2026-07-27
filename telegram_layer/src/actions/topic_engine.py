"""Topic Engine — group topic analysis and trend tracking."""

from collections import Counter, defaultdict
from datetime import datetime, timezone
from loguru import logger


class TopicEngineService:
    KEYWORDS = {
        "crypto": ["bitcoin", "ethereum", "crypto", "btc", "eth", "defi", "nft", "blockchain", "token", "web3"],
        "tech": ["ai", "ml", "python", "javascript", "coding", "programming", "software", "app", "cloud", "data"],
        "marketing": ["marketing", "seo", "growth", "conversion", "leads", "funnel", "campaign", "social media", "ads"],
        "trading": ["trading", "forex", "stocks", "market", "signal", "profit", "analysis", "chart", "trend"],
    }

    def __init__(self):
        self.messages: list[dict] = []
        self.trends: dict[str, dict] = {}

    def analyze_message(self, chat_id: str, text: str) -> dict:
        text_lower = text.lower()
        topics = []
        for topic, keywords in self.KEYWORDS.items():
            if any(kw in text_lower for kw in keywords):
                topics.append(topic)
        record = {"chat_id": chat_id, "text": text[:200], "topics": topics, "ts": datetime.now(timezone.utc).isoformat()}
        self.messages.append(record)
        if len(self.messages) > 10000:
            self.messages = self.messages[-5000:]
        return record

    def get_chat_topics(self, chat_id: str, hours: int = 24) -> dict:
        cutoff = datetime.now(timezone.utc).timestamp() - hours * 3600
        chat_msgs = [m for m in self.messages if m["chat_id"] == chat_id and datetime.fromisoformat(m["ts"]).timestamp() > cutoff]
        topic_counts = Counter()
        for m in chat_msgs:
            for t in m["topics"]:
                topic_counts[t] += 1
        total = len(chat_msgs)
        return {
            "chat_id": chat_id,
            "total_messages": total,
            "topics": {t: {"count": c, "percentage": round(c / total * 100, 1)} for t, c in topic_counts.most_common()},
            "period_hours": hours,
        }

    def get_trends(self, hours: int = 72) -> dict:
        cutoff = datetime.now(timezone.utc).timestamp() - hours * 3600
        recent = [m for m in self.messages if datetime.fromisoformat(m["ts"]).timestamp() > cutoff]
        topic_over_time = defaultdict(lambda: defaultdict(int))
        for m in recent:
            hour_bucket = m["ts"][:13]
            for t in m["topics"]:
                topic_over_time[t][hour_bucket] += 1
        return {
            "period_hours": hours,
            "total_messages": len(recent),
            "topic_timeline": {t: dict(buckets) for t, buckets in topic_over_time.items()},
        }
