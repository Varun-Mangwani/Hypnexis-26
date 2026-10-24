# RAGDoctor — RAG Evaluation Pipeline

## Setup

```bash
cd backend
uv sync
cp .env.example .env        # add your LLM key
uv run uvicorn ragdoctor.api.main:app --reload --port 8000
```

**Mock mode** (serves fixtures, no LLM calls):
```bash
MOCK=1 uv run uvicorn ragdoctor.api.main:app --reload --port 8000
```

**Export contract** after route/model changes:
```bash
uv run python -m ragdoctor.scripts.export_openapi
```

**Smoke test** (must pass before every PR):
```bash
uv run python ../scripts/smoke_test.py
```

**Run tests**:
```bash
uv run pytest
```

## Required Environment Variables

| Variable | Description | Default |
|---|---|---|
| `LLM_API_KEY` | OpenAI-compatible API key | required |
| `LLM_BASE_URL` | API base URL | `https://api.openai.com/v1` |
| `LLM_GENERATOR_MODEL` | Cheaper model for bulk generation | `gpt-4o-mini` |
| `LLM_JUDGE_MODEL` | Stronger model for judging | `gpt-4o` |
| `MOCK` | `1` for mock mode | `0` |
| `EMBED_MODEL` | Sentence-transformers model | `BAAI/bge-small-en-v1.5` |
| `TOKEN_BUDGET_PER_RUN` | Hard token cap per run | `500000` |

## Architecture & Mind Map

- **Main Interactive Mind Map**: Open [`RAG Doctor mind map.html`](file:///c:/Users/Dell/Desktop/Hackathon/RAG%20Doctor%20mind%20map.html) or [`index.html`](file:///c:/Users/Dell/Desktop/Hackathon/index.html) in any browser.
- **In Cockpit**: Click the **Map** tab in the running frontend at `http://127.0.0.1:5173/`.
- Full documentation: See [`PROJECT_DOCUMENTATION.md`](file:///c:/Users/Dell/Desktop/Hackathon/PROJECT_DOCUMENTATION.md) and `docs/ARCHITECTURE.md`.


## Dev collaboration

- Dev A owns `backend/`
- Dev B owns `frontend/` and `desktop/`
- Shared: `contract/`, `docs/` — PR required for changes
