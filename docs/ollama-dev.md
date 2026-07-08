# Local dev with Ollama (optional)

The deployed demo always runs on Claude Haiku 4.5 via the Anthropic API —
that's the locked production path (see [CLAUDE.md](../CLAUDE.md) Section 3).
For local development you can swap in [Ollama](https://ollama.com) instead,
so you can iterate on the chat flow without an `ANTHROPIC_API_KEY` or API
spend. It sits behind the same `LLMProvider` interface in
[`backend/app/services/llm_providers.py`](../backend/app/services/llm_providers.py),
so nothing else in the backend needs to know which one is active.

## Run Ollama in Docker

```bash
docker run -d --name crestview-ollama -p 11434:11434 -v ollama:/root/.ollama ollama/ollama
docker exec -it crestview-ollama ollama pull llama3.1
```

`llama3.1` (or any recent Ollama model with function-calling support, e.g.
`qwen2.5` or `mistral-nemo`) works with the calculator tool call. Smaller
models may ignore the tool schema or answer without citations — that's
expected and is exactly what the citation invariant in `guards.py` is there
to catch, whichever provider is active.

## Point the backend at it

In `backend/.env`:

```
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

Switch back to `LLM_PROVIDER=anthropic` (the default) to test against the
real production path.

## Known trade-offs vs. Anthropic

- No GPU on a typical dev machine means noticeably higher latency than the
  <1.5s p50 streaming budget the deployed demo targets — expect this locally,
  don't chase it.
- Tool-calling reliability varies by model; `OllamaProvider` makes the
  tool-call decision in a non-streaming round trip specifically because
  streamed tool-call deltas are inconsistent across Ollama models.
- This path is never used in production or in CI — CI mocks the LLM
  provider entirely (see `backend/tests/test_llm.py`).
