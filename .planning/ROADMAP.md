# ROADMAP.md — RAGDoctor

## Phase P0 — Foundation (Together with Dev B)
**Goal:** Repo, env, contract, fixtures. Both devs run the stack.
- [x] Git repo init
- [x] `backend/pyproject.toml` with all dependencies
- [x] `.env.example`
- [x] `contract/openapi.json` (exported from live FastAPI schema)
- [x] `contract/fixtures/` — all fixture JSON files
- [x] `AGENTS.md` at repo root and `backend/AGENTS.md`

## Phase P1 — Stub API + Ingestion + Reference RAG
**Goal:** UI shows fixture data from real stub server
- [x] `backend/src/ragdoctor/api/` — all routes (MOCK=1)
- [x] `backend/src/ragdoctor/ingest/` — parse, chunk, embed, store
- [x] `backend/src/ragdoctor/rag/` — reference RAG, VectorStore, BM25
- [x] `backend/src/ragdoctor/mock/` — fixture loader
- [x] `scripts/smoke_test.py`

## Phase P2 — Test Generator + QC
**Goal:** Real document → real chunks visible in UI
- [x] `backend/src/ragdoctor/testgen/` — question generator
- [x] `backend/src/ragdoctor/testgen/qc.py` — quality control
- [x] `backend/src/ragdoctor/prompts/` — prompt files

## Phase P3 — Retrieval + Generation Scoring
**Goal:** Real scores, colour-coded in UI
- [x] `backend/src/ragdoctor/scoring/retrieval.py`
- [x] `backend/src/ragdoctor/scoring/faithfulness.py`
- [x] `backend/src/ragdoctor/scoring/correctness.py`
- [x] `backend/src/ragdoctor/scoring/nli.py`

## Phase P4 — Diagnosis Engine
**Goal:** One full end-to-end run, no manual steps
- [x] `backend/src/ragdoctor/diagnosis/probes.py`
- [x] `backend/src/ragdoctor/diagnosis/verdict.py`
- [x] `backend/src/ragdoctor/diagnosis/explanations.py`
- [x] `backend/src/ragdoctor/diagnosis/suggestions.py`

## Phase P5 — Fault Injection + Judge Calibration
**Goal:** Confusion matrix and kappa shown in UI
- [x] `backend/src/ragdoctor/validation/fault_injection.py`
- [x] `backend/src/ragdoctor/validation/calibration.py`

## Phase P6 — Freeze + Demo & Full-Stack Integration
**Goal:** Offline demo with cached results, full frontend & backend integration
- [x] Populate LLM cache & DB for demo run (`scripts/prepare_demo.py`)
- [x] Verify `smoke_test.py` passes all 8 checks against live FastAPI backend
- [x] Mount frontend SPA onto FastAPI root (`GET /`)
- [x] Connect React 18 cockpit components to real `/api` endpoints
- [x] Verify desktop launcher (`desktop/app.py`) starts integrated server
- [x] Rehearsal pass

