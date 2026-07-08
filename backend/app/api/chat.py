"""GET /chat -> SSE stream, one token event per delta, then citations + done.

GET (not POST) so the frontend can use the browser's native EventSource,
which reconnects automatically on a dropped connection — see
frontend/lib/sse.ts. The session id travels as an httponly cookie, not a
query param.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, Request
from sse_starlette.sse import EventSourceResponse

from app.core.config import Settings, get_settings
from app.services.llm import TurnResult, generate_reply
from app.services.sessions import Session, get_session_store

router = APIRouter()


async def _event_stream(
    request: Request, message: str, settings: Settings, session: Session
) -> AsyncIterator[dict[str, str]]:
    async for chunk in generate_reply(session, message, settings):
        if await request.is_disconnected():
            break
        if isinstance(chunk, TurnResult):
            sources = [{"label": c, "text": chunk.sources.get(c, "")} for c in chunk.citations]
            yield {"event": "citations", "data": json.dumps(sources)}
            yield {
                "event": "done",
                "data": json.dumps(
                    {
                        "corrected": chunk.corrected,
                        "text": chunk.final_text if chunk.corrected else None,
                    }
                ),
            }
        else:
            yield {"event": "token", "data": chunk}


@router.get("/chat")
async def chat(
    request: Request,
    message: str,
    settings: Settings = Depends(get_settings),  # noqa: B008
) -> EventSourceResponse:
    message = message.strip()
    if not message:
        raise HTTPException(status_code=422, detail="message is required")

    store = get_session_store(settings.session_ttl_minutes)
    session = store.get_or_create(request.cookies.get(settings.session_cookie_name))

    response = EventSourceResponse(_event_stream(request, message, settings, session))
    response.set_cookie(
        settings.session_cookie_name,
        session.session_id,
        httponly=True,
        samesite="lax",
        max_age=settings.session_ttl_minutes * 60,
    )
    return response
