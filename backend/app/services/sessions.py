"""In-memory, TTL-bounded session store keyed by a uuid cookie.

No database: this is a demo-scale concierge, not a product. Sessions (and
the process-wide stats counters) live only as long as the backend process.
"""

from __future__ import annotations

import threading
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta


@dataclass
class Message:
    role: str  # "user" | "assistant"
    content: str
    citations: list[str] = field(default_factory=list)


@dataclass
class Session:
    session_id: str
    created_at: datetime
    last_seen: datetime
    messages: list[Message] = field(default_factory=list)


class SessionStore:
    def __init__(self, ttl_minutes: int = 60) -> None:
        self._ttl = timedelta(minutes=ttl_minutes)
        self._sessions: dict[str, Session] = {}
        self._lock = threading.Lock()
        self.total_conversations = 0
        self.unanswered_questions: list[str] = []

    def _now(self) -> datetime:
        return datetime.now(UTC)

    def _purge_expired(self) -> None:
        cutoff = self._now() - self._ttl
        expired = [sid for sid, s in self._sessions.items() if s.last_seen < cutoff]
        for sid in expired:
            del self._sessions[sid]

    def get_or_create(self, session_id: str | None) -> Session:
        with self._lock:
            self._purge_expired()
            if session_id and session_id in self._sessions:
                session = self._sessions[session_id]
                session.last_seen = self._now()
                return session

            new_id = session_id or str(uuid.uuid4())
            now = self._now()
            session = Session(session_id=new_id, created_at=now, last_seen=now)
            self._sessions[new_id] = session
            self.total_conversations += 1
            return session

    def record_unanswered(self, question: str) -> None:
        with self._lock:
            self.unanswered_questions.append(question)
            self.unanswered_questions = self.unanswered_questions[-50:]

    def stats(self) -> dict[str, object]:
        with self._lock:
            return {
                "total_conversations": self.total_conversations,
                "active_sessions": len(self._sessions),
                "unanswered_questions": list(self.unanswered_questions[-5:]),
            }


_store: SessionStore | None = None


def get_session_store(ttl_minutes: int = 60) -> SessionStore:
    global _store
    if _store is None:
        _store = SessionStore(ttl_minutes=ttl_minutes)
    return _store
