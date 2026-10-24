# UNDERSTANDING.md — RAGDoctor (Dev B quick reference)

## What this project is

A backend API that evaluates RAG systems. You upload a document, it generates synthetic questions, runs a retriever + generator, scores them, and diagnoses every failure.

## How to use the API

### Start the stub server (MOCK=1, no LLM calls needed)
```bash
MOCK=1 uvicorn ragdoctor.api.main:app --port 8000
```

### Core flow
1. `POST /api/corpora` — upload a file → get `corpus_id`
2. `POST /api/runs` — start evaluation with `corpus_id` → get `run_id`
3. `GET /api/runs/{run_id}/events` — SSE stream for progress
4. `GET /api/runs/{run_id}` — final scores
5. `GET /api/runs/{run_id}/cases` — all evaluated questions
6. `GET /api/cases/{id}` — full detail for one case

### Response shapes
All shapes are in `contract/openapi.json`. The fixture files in `contract/fixtures/` show real examples.

## Key concepts

- **chunk_id**: stable ID like `ch_abc123def456` — never changes for the same content
- **verdict**: one of `PASS`, `RETRIEVAL_MISS`, `CONTEXT_DISTRACTION`, `HALLUCINATION`, `BOTH_FAILED`, `PARAMETRIC_LEAK`, `FAILED_TO_ABSTAIN`
- **probes**: three booleans — was the answer correct with gold context / retrieved context / no context
- **faithfulness**: fraction of answer claims supported by quoted evidence in context
- **confusion_matrix**: fault injection results — what fault was injected vs what verdict was assigned

## Thresholds (from backend config.py)

- `faithfulness_threshold: 0.5` — below this → faithfulness failure
- `answer_accuracy_threshold: 0.5` — below this → accuracy failure

## Dev B contact

When backend response shapes change, Dev A will notify you immediately and update fixtures + openapi.json.
