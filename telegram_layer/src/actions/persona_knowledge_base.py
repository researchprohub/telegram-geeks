"""Dynamic Knowledge Base (RAG) — per-persona document store with keyword-based retrieval.

Stores documents per persona and retrieves relevant context for generation.
Uses keyword indexing (no external vector DB dependency).
"""

import json
import re
import hashlib
from datetime import datetime, timezone
from typing import Optional
from loguru import logger


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r'\b[a-zA-Z]{3,}\b', text.lower()))


class PersonaKnowledgeBase:
    """Per-persona document store with keyword search."""

    def __init__(self):
        self._documents: dict[str, list[dict]] = {}
        self._index: dict[str, dict[str, list[int]]] = {}  # persona_id -> {keyword: [doc_indices]}

    def add_group_document(self, group_id: str, title: str, content: str, source: str = "group_manual", tags: list[str] = None):
        """Add a group-specific knowledge document. Applied when any persona posts in this group."""
        persona_id = f"group:{group_id}"
        self.add_document(persona_id, title, content, source, tags)

    def get_group_context(self, group_id: str, query: str, max_chars: int = 500) -> str:
        """Retrieve group-specific knowledge context."""
        return self.get_relevant_context(f"group:{group_id}", query, max_chars)

    def add_document(self, persona_id: str, title: str, content: str, source: str = "manual", tags: list[str] = None):
        self._documents.setdefault(persona_id, [])
        doc = {
            "id": hashlib.md5(content.encode()).hexdigest()[:12],
            "title": title, "content": content, "source": source,
            "tags": tags or [], "added_at": datetime.now(timezone.utc).isoformat(),
        }
        self._documents[persona_id].append(doc)
        idx = len(self._documents[persona_id]) - 1
        self._index.setdefault(persona_id, {})

        keywords = _tokenize(title + " " + content)
        for kw in keywords:
            self._index[persona_id].setdefault(kw, [])
            if idx not in self._index[persona_id][kw]:
                self._index[persona_id][kw].append(idx)
        logger.info(f"Added document '{title}' to persona {persona_id}")

    def add_documents_bulk(self, persona_id: str, documents: list[dict]):
        for doc in documents:
            self.add_document(persona_id, doc.get("title", "Untitled"), doc.get("content", ""), doc.get("source", "bulk"), doc.get("tags"))

    def search(self, persona_id: str, query: str, top_k: int = 3) -> list[dict]:
        query_keywords = _tokenize(query)
        if not query_keywords or persona_id not in self._index:
            return []

        scores: dict[int, float] = {}
        for kw in query_keywords:
            if kw in self._index.get(persona_id, {}):
                for doc_idx in self._index[persona_id][kw]:
                    scores[doc_idx] = scores.get(doc_idx, 0) + 1.0

        total_kw = len(query_keywords)
        ranked = sorted(scores.items(), key=lambda x: x[1] / total_kw, reverse=True)

        results = []
        for doc_idx, score in ranked[:top_k]:
            doc = self._documents[persona_id][doc_idx]
            results.append({**doc, "relevance_score": round(score / max(total_kw, 1), 3)})
        return results

    def get_relevant_context(self, persona_id: str, query: str, max_chars: int = 1000) -> str:
        results = self.search(persona_id, query, top_k=3)
        if not results:
            return ""
        parts = []
        char_count = 0
        for r in results:
            snippet = f"[{r['title']} (relevance: {r['relevance_score']:.0%})]\n{r['content'][:300]}"
            if char_count + len(snippet) > max_chars:
                break
            parts.append(snippet)
            char_count += len(snippet)
        return "Relevant knowledge:\n\n" + "\n\n".join(parts)

    def list_documents(self, persona_id: str) -> list[dict]:
        return [
            {"id": d["id"], "title": d["title"], "source": d["source"], "tags": d["tags"], "added_at": d["added_at"]}
            for d in self._documents.get(persona_id, [])
        ]

    def remove_document(self, persona_id: str, doc_id: str) -> bool:
        docs = self._documents.get(persona_id, [])
        for i, d in enumerate(docs):
            if d["id"] == doc_id:
                docs.pop(i)
                self._rebuild_index(persona_id)
                return True
        return False

    def _rebuild_index(self, persona_id: str):
        self._index[persona_id] = {}
        for idx, doc in enumerate(self._documents.get(persona_id, [])):
            keywords = _tokenize(doc["title"] + " " + doc["content"])
            for kw in keywords:
                self._index[persona_id].setdefault(kw, [])
                if idx not in self._index[persona_id][kw]:
                    self._index[persona_id][kw].append(idx)

    def get_stats(self, persona_id: str) -> dict:
        docs = self._documents.get(persona_id, [])
        return {
            "persona_id": persona_id,
            "document_count": len(docs),
            "keyword_count": len(self._index.get(persona_id, {})),
            "total_chars": sum(len(d["content"]) for d in docs),
        }

    def clear_persona(self, persona_id: str):
        self._documents.pop(persona_id, None)
        self._index.pop(persona_id, None)


persona_kb = PersonaKnowledgeBase()
