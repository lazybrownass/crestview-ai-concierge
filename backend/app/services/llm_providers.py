"""LLM provider implementations behind one interface: stream_answer().

AnthropicProvider is the production path (Claude Haiku 4.5, server-side
only). OllamaProvider is a local-dev-only swap-in for iterating without an
API key — see docs/ollama-dev.md. Both hide their tool-call handling behind
the same async text-delta stream so app/services/llm.py never branches on
which provider is active.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any, Protocol

import httpx
from anthropic import AsyncAnthropic

CALCULATOR_TOOL_NAME = "installment_calculator"

ANTHROPIC_CALCULATOR_TOOL = {
    "name": CALCULATOR_TOOL_NAME,
    "description": (
        "Compute the down payment, monthly installment, and possession payment "
        "for a Crestview unit type under the standard or a customized payment plan. "
        "Use this whenever a buyer asks for a monthly figure, not mental math."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "unit_type": {
                "type": "string",
                "enum": ["1-bed", "2-bed", "3-bed"],
                "description": "Unit type",
            },
            "down_payment_pct": {
                "type": "number",
                "description": "Down payment fraction, e.g. 0.2 for 20%. Between 0.10 and 0.30.",
            },
            "months": {
                "type": "integer",
                "description": "Installment term in months, between 12 and 60.",
            },
        },
        "required": ["unit_type", "down_payment_pct", "months"],
    },
}


def _to_openai_tool(tool: dict[str, Any]) -> dict[str, Any]:
    return {
        "type": "function",
        "function": {
            "name": tool["name"],
            "description": tool["description"],
            "parameters": tool["input_schema"],
        },
    }


class ToolExecutor(Protocol):
    def __call__(self, name: str, tool_input: dict[str, Any]) -> tuple[str, bool]: ...

    """Returns (result_text, is_error)."""


class LLMProvider(Protocol):
    def stream_answer(
        self,
        *,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        execute_tool: ToolExecutor,
    ) -> AsyncIterator[str]: ...


class AnthropicProvider:
    def __init__(self, api_key: str, model: str, max_tokens: int) -> None:
        self._client = AsyncAnthropic(api_key=api_key)
        self._model = model
        self._max_tokens = max_tokens

    async def stream_answer(
        self,
        *,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        execute_tool: ToolExecutor,
    ) -> AsyncIterator[str]:
        conversation = list(messages)

        for _ in range(3):  # at most: initial call + a couple of tool round-trips
            async with self._client.messages.stream(
                model=self._model,
                max_tokens=self._max_tokens,
                system=system,
                messages=conversation,  # type: ignore[arg-type]
                tools=tools,  # type: ignore[arg-type]
            ) as stream:
                async for event in stream:
                    if event.type == "content_block_delta" and event.delta.type == "text_delta":
                        yield event.delta.text
                final_message = await stream.get_final_message()

            if final_message.stop_reason != "tool_use":
                return

            tool_uses = [block for block in final_message.content if block.type == "tool_use"]
            conversation.append(
                {"role": "assistant", "content": [b.model_dump() for b in final_message.content]}
            )
            tool_results = []
            for tool_use in tool_uses:
                result_text, is_error = execute_tool(tool_use.name, dict(tool_use.input))
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": tool_use.id,
                        "content": result_text,
                        "is_error": is_error,
                    }
                )
            conversation.append({"role": "user", "content": tool_results})


class OllamaProvider:
    """Local-dev-only. Uses Ollama's OpenAI-compatible /v1/chat/completions.

    Tool-call decisions are made in a non-streaming round trip (simpler and
    more reliable than reassembling streamed tool-call deltas across models
    with inconsistent function-calling support); the final answer is always
    streamed so the dev experience still shows token-by-token text.
    """

    def __init__(self, base_url: str, model: str, max_tokens: int) -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._max_tokens = max_tokens

    async def stream_answer(
        self,
        *,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        execute_tool: ToolExecutor,
    ) -> AsyncIterator[str]:
        conversation: list[dict[str, Any]] = [{"role": "system", "content": system}, *messages]
        openai_tools = [_to_openai_tool(t) for t in tools]

        async with httpx.AsyncClient(timeout=60.0) as client:
            decision = await client.post(
                f"{self._base_url}/v1/chat/completions",
                json={
                    "model": self._model,
                    "messages": conversation,
                    "tools": openai_tools,
                    "max_tokens": self._max_tokens,
                    "stream": False,
                },
            )
            decision.raise_for_status()
            choice = decision.json()["choices"][0]["message"]
            tool_calls = choice.get("tool_calls") or []

            if tool_calls:
                conversation.append(choice)
                for call in tool_calls:
                    args = json.loads(call["function"]["arguments"])
                    result_text, is_error = execute_tool(call["function"]["name"], args)
                    conversation.append(
                        {
                            "role": "tool",
                            "tool_call_id": call["id"],
                            "content": result_text if not is_error else f"Error: {result_text}",
                        }
                    )

            async with client.stream(
                "POST",
                f"{self._base_url}/v1/chat/completions",
                json={
                    "model": self._model,
                    "messages": conversation,
                    "max_tokens": self._max_tokens,
                    "stream": True,
                },
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    payload = line.removeprefix("data: ").strip()
                    if payload == "[DONE]":
                        break
                    delta = json.loads(payload)["choices"][0]["delta"]
                    text = delta.get("content")
                    if text:
                        yield text
