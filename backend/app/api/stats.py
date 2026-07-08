"""GET /api/stats -> conversation count and recent unanswered questions."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.services.sessions import get_session_store

router = APIRouter()


@router.get("/stats")
async def stats(settings: Settings = Depends(get_settings)) -> dict[str, object]:  # noqa: B008
    store = get_session_store(settings.session_ttl_minutes)
    return store.stats()
