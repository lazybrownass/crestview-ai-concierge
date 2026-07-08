from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

VALID_LEAD = {
    "name": "Ayesha Khan",
    "phone": "03001234567",
    "budget_band": "20m_35m",
    "timeline": "this_month",
}


def test_valid_lead_is_accepted() -> None:
    response = client.post("/api/lead", json=VALID_LEAD)
    assert response.status_code == 200
    body = response.json()
    assert body["received"] is True
    # no N8N_WEBHOOK_URL configured in the test environment -> not delivered
    assert body["webhook_delivered"] is False


def test_malformed_phone_is_rejected() -> None:
    response = client.post("/api/lead", json={**VALID_LEAD, "phone": "not-a-phone"})
    assert response.status_code == 422


def test_overlength_name_is_rejected() -> None:
    response = client.post("/api/lead", json={**VALID_LEAD, "name": "a" * 101})
    assert response.status_code == 422


def test_blank_name_is_rejected() -> None:
    response = client.post("/api/lead", json={**VALID_LEAD, "name": "   "})
    assert response.status_code == 422


def test_unknown_budget_band_is_rejected() -> None:
    response = client.post("/api/lead", json={**VALID_LEAD, "budget_band": "not-a-band"})
    assert response.status_code == 422
