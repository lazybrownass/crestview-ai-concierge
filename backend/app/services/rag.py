"""Runtime retrieval: load precomputed embeddings, cosine top-k, build context.

No model weights are loaded at runtime. scripts/embed.py (offline) is the only
place fastembed runs; this module does pure numpy cosine similarity against
the committed .npz + chunks.json.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import numpy as np
from fastembed import TextEmbedding

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
DEFAULT_CACHE_DIR = Path(__file__).resolve().parent.parent.parent / ".fastembed_cache"


@dataclass(frozen=True)
class Chunk:
    id: str
    doc: str
    doc_label: str
    section: str
    section_index: int
    text: str


@dataclass(frozen=True)
class RetrievedChunk:
    chunk: Chunk
    score: float

    @property
    def citation(self) -> str:
        return f"{self.chunk.doc_label} · §{self.chunk.section_index}"


class CorpusIndex:
    def __init__(self, vectors: np.ndarray, chunks: list[Chunk]) -> None:
        if vectors.shape[0] != len(chunks):
            raise ValueError("vectors and chunks length mismatch")
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self._normalized = vectors / norms
        self.chunks = chunks

    def search(self, query_vector: np.ndarray, top_k: int = 4) -> list[RetrievedChunk]:
        norm = np.linalg.norm(query_vector)
        if norm == 0:
            return []
        normalized_query = query_vector / norm
        scores = self._normalized @ normalized_query
        top_indices = np.argsort(-scores)[:top_k]
        return [RetrievedChunk(chunk=self.chunks[i], score=float(scores[i])) for i in top_indices]


def load_index(data_dir: Path = DATA_DIR) -> CorpusIndex:
    vectors = np.load(data_dir / "embeddings.npz")["vectors"]
    raw_chunks = json.loads((data_dir / "chunks.json").read_text(encoding="utf-8"))
    chunks = [Chunk(**c) for c in raw_chunks]
    return CorpusIndex(vectors=vectors, chunks=chunks)


@lru_cache(maxsize=1)
def get_index() -> CorpusIndex:
    return load_index()


@lru_cache(maxsize=1)
def get_query_embedder() -> TextEmbedding:
    """Loaded once per process and kept warm; corpus vectors are precomputed
    offline, so this only ever embeds a single short query string per request."""
    cache_dir = os.environ.get("FASTEMBED_CACHE_DIR", str(DEFAULT_CACHE_DIR))
    return TextEmbedding(model_name=EMBEDDING_MODEL, cache_dir=cache_dir)


def embed_query(text: str) -> np.ndarray:
    embedder = get_query_embedder()
    return next(iter(embedder.query_embed([text])))


def retrieve(query: str, top_k: int = 4) -> list[RetrievedChunk]:
    index = get_index()
    query_vector = embed_query(query)
    return index.search(query_vector, top_k=top_k)


def build_context(retrieved: list[RetrievedChunk]) -> str:
    """Render retrieved chunks into a context block for the LLM prompt."""
    blocks = []
    for r in retrieved:
        blocks.append(f"[{r.citation}]\n{r.chunk.text}")
    return "\n\n---\n\n".join(blocks)
