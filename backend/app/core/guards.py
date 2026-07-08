"""Pre-LLM input guards and the post-LLM citation invariant.

The citation invariant is the load-bearing safety property of this bot:
every answer either carries at least one citation copied from retrieved
context, or it is replaced with the canonical refusal. There is no third
state, and this is enforced here rather than trusted to model behavior.
"""

from __future__ import annotations

import re

REFUSAL_MESSAGE = (
    "I don't have that in the Crestview materials I can check. "
    "I can have someone from the team follow up with you directly — want me to arrange that?"
)

MAX_INPUT_CHARS = 500

_INJECTION_PATTERNS = [
    re.compile(
        r"ignore\s+(all\s+|your\s+|any\s+|the\s+)?(previous|prior|above|earlier)\s+instructions",
        re.I,
    ),
    re.compile(r"disregard\s+(all\s+|your\s+|any\s+|the\s+)?(previous|prior|above|earlier)", re.I),
    re.compile(r"forget\s+(all\s+|your\s+|any\s+)?(previous|prior|earlier)\s+instructions", re.I),
    re.compile(r"you\s+are\s+now\s+", re.I),
    re.compile(r"act\s+as\s+(a|an|if)\b", re.I),
    re.compile(r"pretend\s+(you\s+are|to\s+be)", re.I),
    re.compile(r"reveal\s+(your\s+)?(system\s+prompt|instructions)", re.I),
    re.compile(r"(what|show|print)\s+.{0,20}\bsystem\s+prompt\b", re.I),
    re.compile(r"new\s+instructions\s*:", re.I),
    re.compile(r"\bjailbreak\b", re.I),
    re.compile(r"\bDAN\s+mode\b", re.I),
    re.compile(r"override\s+(your\s+)?(rules|instructions|guidelines)", re.I),
    re.compile(r"give\s+me\s+a\s+discount\s+code", re.I),
]

_CITATION_RE = re.compile(r"\[([A-Z0-9 ]+ · §\d+(?:\.\d+)?)\]")


class InputGuardResult:
    def __init__(self, blocked: bool, reason: str | None = None) -> None:
        self.blocked = blocked
        self.reason = reason


def check_input(text: str, max_chars: int = MAX_INPUT_CHARS) -> InputGuardResult:
    """Pre-LLM heuristics: length cap and instruction-override patterns."""
    if len(text) > max_chars:
        return InputGuardResult(blocked=True, reason="input exceeds max length")
    for pattern in _INJECTION_PATTERNS:
        if pattern.search(text):
            return InputGuardResult(
                blocked=True, reason=f"matched injection pattern: {pattern.pattern}"
            )
    return InputGuardResult(blocked=False)


def extract_citations(text: str) -> list[str]:
    return _CITATION_RE.findall(text)


def enforce_citation_invariant(
    answer: str, available_citations: list[str]
) -> tuple[str, list[str]]:
    """Return (final_answer, citations_used).

    An answer is only trusted as grounded if it cites at least one chunk that
    was actually retrieved for this turn. Anything else — including a model
    refusal written in its own words, or a hallucinated citation tag — is
    replaced with the canonical refusal so the invariant holds unconditionally.
    """
    cited = [c for c in extract_citations(answer) if c in available_citations]
    if cited:
        return answer, sorted(set(cited))
    return REFUSAL_MESSAGE, []


def is_refusal(answer: str) -> bool:
    return answer.strip() == REFUSAL_MESSAGE
