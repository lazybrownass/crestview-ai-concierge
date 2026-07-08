from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app

client = TestClient(app)


def test_21st_request_in_a_minute_is_rate_limited() -> None:
    limit = get_settings().rate_limit_per_minute
    responses = [client.get("/health") for _ in range(limit)]
    assert all(r.status_code == 200 for r in responses)

    blocked = client.get("/health")
    assert blocked.status_code == 429
