"""All environment-derived configuration in one place.

Routes and services receive a Settings instance via dependency injection
(get_settings) rather than reading os.environ directly.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=REPO_ROOT / ".env", env_file_encoding="utf-8", extra="ignore"
    )

    # LLM provider: "anthropic" is the production path (Claude Haiku 4.5,
    # server-side only). "ollama" is a local-dev-only swap-in behind the same
    # llm.py interface, so you can iterate without an API key or API spend;
    # it is not intended for the deployed demo.
    llm_provider: Literal["anthropic", "ollama"] = "anthropic"

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-haiku-4-5"

    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1"

    max_tokens: int = 600
    max_input_chars: int = 500
    retrieval_top_k: int = 4

    cors_origins: str = "http://localhost:3000"
    rate_limit_per_minute: int = 20

    n8n_webhook_url: str = ""

    session_cookie_name: str = "crestview_session"
    session_ttl_minutes: int = 60

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
