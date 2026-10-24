# DECISIONS.md

Shared decisions — change with Dev B's approval via PR.

## 2026-10-24: Initial contract

- Verdict enum frozen: `PASS`, `RETRIEVAL_MISS`, `CONTEXT_DISTRACTION`, `HALLUCINATION`, `BOTH_FAILED`, `PARAMETRIC_LEAK`, `FAILED_TO_ABSTAIN`
- Case ID format: `c_<num>` for fixtures, `case_<hex>` for real runs
- Corpus ID format: `corp_<hex12>`
- Run ID format: `run_<hex12>`
- Chunk ID format: `ch_<hex16>`
- API prefix: `/api`
- SSE endpoint: `GET /api/runs/{id}/events` — JSON objects `{"progress": 0-100, "stage": string}`
- CORS: allow all origins (hackathon)
- Token budget: 500,000 per run (hard cap)
