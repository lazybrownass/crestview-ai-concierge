"""Offline corpus embedding.

Reads content/docs/*.md, splits each into heading-aware chunks, embeds them
with fastembed (ONNX, no torch), and writes the result to
backend/app/data/embeddings.npz + backend/app/data/chunks.json.

Run this whenever content/docs/*.md changes:

    backend/.venv/Scripts/python.exe scripts/embed.py
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
from fastembed import TextEmbedding

REPO_ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = REPO_ROOT / "content" / "docs"
DATA_DIR = REPO_ROOT / "backend" / "app" / "data"
EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
DEFAULT_CACHE_DIR = REPO_ROOT / "backend" / ".fastembed_cache"

MAX_CHUNK_TOKENS = 500
HEADING_RE = re.compile(r"^(#{1,2})\s+(.*)$")


@dataclass(frozen=True)
class Chunk:
    id: str
    doc: str
    doc_label: str
    section: str
    section_index: int
    text: str


def estimate_tokens(text: str) -> int:
    """Rough chars-per-token heuristic; good enough for a 500-token budget."""
    return max(1, len(text) // 4)


def doc_label(stem: str) -> str:
    return stem.replace("-", " ").upper()


def split_into_sections(markdown: str) -> list[tuple[str, str]]:
    """Split a doc into (heading, body) pairs on H2 (##) boundaries."""
    lines = markdown.splitlines()
    sections: list[tuple[str, list[str]]] = []
    current_heading = "Overview"
    current_body: list[str] = []

    for line in lines:
        match = HEADING_RE.match(line)
        if match and len(match.group(1)) == 2:
            if current_body:
                sections.append((current_heading, current_body))
            current_heading = match.group(2).strip()
            current_body = []
        elif match and len(match.group(1)) == 1:
            continue  # doc title, not a section boundary
        else:
            current_body.append(line)

    if current_body:
        sections.append((current_heading, current_body))

    return [(heading, "\n".join(body).strip()) for heading, body in sections if "\n".join(body).strip()]


def split_oversized(heading: str, body: str) -> list[str]:
    """Split a section further by paragraph if it exceeds the token budget."""
    if estimate_tokens(body) <= MAX_CHUNK_TOKENS:
        return [body]

    paragraphs = [p for p in body.split("\n\n") if p.strip()]
    parts: list[str] = []
    current = ""
    for para in paragraphs:
        candidate = f"{current}\n\n{para}".strip() if current else para
        if estimate_tokens(candidate) > MAX_CHUNK_TOKENS and current:
            parts.append(current)
            current = para
        else:
            current = candidate
    if current:
        parts.append(current)
    return parts


def build_chunks() -> list[Chunk]:
    chunks: list[Chunk] = []
    for doc_path in sorted(DOCS_DIR.glob("*.md")):
        stem = doc_path.stem
        label = doc_label(stem)
        markdown = doc_path.read_text(encoding="utf-8")
        sections = split_into_sections(markdown)

        section_index = 0
        for heading, body in sections:
            section_index += 1
            pieces = split_oversized(heading, body)
            for piece_num, piece in enumerate(pieces, start=1):
                suffix = "" if len(pieces) == 1 else f".{piece_num}"
                chunk_text = f"{heading}\n\n{piece}"
                chunks.append(
                    Chunk(
                        id=f"{stem}-{section_index}{suffix}",
                        doc=stem,
                        doc_label=label,
                        section=heading,
                        section_index=section_index,
                        text=chunk_text,
                    )
                )
    return chunks


def main() -> None:
    chunks = build_chunks()
    print(f"Built {len(chunks)} chunks from {len(list(DOCS_DIR.glob('*.md')))} docs")

    cache_dir = os.environ.get("FASTEMBED_CACHE_DIR", str(DEFAULT_CACHE_DIR))
    model = TextEmbedding(model_name=EMBEDDING_MODEL, cache_dir=cache_dir)
    vectors = np.array(list(model.embed([c.text for c in chunks])), dtype=np.float32)
    print(f"Embedded chunks -> shape {vectors.shape}")

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(DATA_DIR / "embeddings.npz", vectors=vectors)
    (DATA_DIR / "chunks.json").write_text(
        json.dumps([asdict(c) for c in chunks], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    (DATA_DIR / "model.json").write_text(
        json.dumps({"model_name": EMBEDDING_MODEL, "dim": int(vectors.shape[1])}, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {DATA_DIR / 'embeddings.npz'} and {DATA_DIR / 'chunks.json'}")


if __name__ == "__main__":
    main()
