"""POST /api/lead -> validate -> score -> fire the n8n webhook.

Called by the widget's guided LeadSteps sequence once a visitor has
answered name, phone, budget, and timeline one field at a time — not by
the free-text chat model, so validation here is a hard, testable boundary.
"""

from __future__ import annotations

import re

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field, field_validator

from app.core.config import Settings, get_settings
from app.services.scoring import BudgetBand, Timeline, score_lead
from app.services.sessions import get_session_store
from app.services.webhook import build_lead_payload, send_lead_webhook

router = APIRouter()

_PK_PHONE_RE = re.compile(r"^(\+92|0)3\d{2}[- ]?\d{7}$")


class LeadRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=20)
    budget_band: BudgetBand
    timeline: Timeline

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("name must not be blank")
        return stripped

    @field_validator("phone")
    @classmethod
    def phone_is_pakistani_format(cls, value: str) -> str:
        if not _PK_PHONE_RE.match(value.strip()):
            raise ValueError("phone must be a Pakistani mobile number, e.g. 03001234567")
        return value.strip()


class LeadResponse(BaseModel):
    received: bool
    webhook_delivered: bool


@router.post("/lead")
async def submit_lead(
    lead: LeadRequest,
    request: Request,
    settings: Settings = Depends(get_settings),  # noqa: B008
) -> LeadResponse:
    store = get_session_store(settings.session_ttl_minutes)
    session = store.get_or_create(request.cookies.get(settings.session_cookie_name))

    score = score_lead(lead.budget_band, lead.timeline)
    payload = build_lead_payload(
        name=lead.name,
        phone=lead.phone,
        budget_band=lead.budget_band,
        timeline=lead.timeline,
        score=score,
        session=session,
    )
    delivered = await send_lead_webhook(settings.n8n_webhook_url, payload)
    return LeadResponse(received=True, webhook_delivered=delivered)
