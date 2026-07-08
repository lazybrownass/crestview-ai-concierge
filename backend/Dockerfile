# Build from the repo root: docker build -f backend/Dockerfile .
# content/docs/ and backend/app/data/ must both be in the build context —
# calculator.py and rag.py resolve paths relative to the repo root, not
# just the backend/ subtree.
FROM python:3.13-slim

WORKDIR /srv
COPY content/ content/
COPY backend/ backend/
RUN pip install --no-cache-dir -e ./backend

WORKDIR /srv/backend
ENV FASTEMBED_CACHE_DIR=/srv/backend/.fastembed_cache

# Bake the query-embedding model into the image at build time so a cold
# start doesn't pay a ~70MB Hugging Face download on the first request.
RUN python -c "from app.services.rag import get_query_embedder; get_query_embedder()"

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
