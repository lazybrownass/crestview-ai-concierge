"""Fire-and-forget delivery of the lead payload to the n8n webhook.

Best-effort by design: a broken or unconfigured n8n instance should never
block a visitor from having their lead captured. Failures are logged, not
raised. See README for the JSON contract this payload follows.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any

import httpx

from app.services.sessions import Session

logger = logging.getLogger(__name__)


def summarize_transcript(session: Session, max_messages: int = 3, max_chars: int = 150) -> str:
    lines = []
    for message in session.messages[-max_messages:]:
        prefix = "Visitor" if message.role == "user" else "Concierge"
        text = message.content.strip().replace("\n", " ")
        if len(text) > max_chars:
            text = text[: max_chars - 1] + "…"
        lines.append(f"{prefix}: {text}")
    return "\n".join(lines)


def build_lead_payload(
    *, name: str, phone: str, budget_band: str, timeline: str, score: str, session: Session
) -> dict[str, Any]:
    return {
        "name": name,
        "phone": phone,
        "budget_band": budget_band,
        "timeline": timeline,
        "score": score,
        "transcript_summary": summarize_transcript(session),
        "session_id": session.session_id,
        "timestamp": datetime.now(UTC).isoformat(),
    }


async def send_lead_webhook(webhook_url: str, payload: dict[str, Any]) -> bool:
    if not webhook_url:
        logger.info("N8N_WEBHOOK_URL not configured; skipping lead webhook delivery")
        return False
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(webhook_url, json=payload)
            response.raise_for_status()
        return True
    except httpx.HTTPError as exc:
        logger.warning("lead webhook delivery failed: %s", exc)
        return False
