# State tracking for RAGDoctor
current_phase: P0-P6 (Project Complete & Fully Integrated)
status: verified
last_updated: 2026-10-24

completed:
  - Phase P0: Foundation (env, dependencies, OpenAPI contract, fixtures, AGENTS.md)
  - Phase P1: Ingestion pipeline, VectorStore, BM25, hybrid retriever, mock server
  - Phase P2: Test generator, QC validation, prompt templating
  - Phase P3: Retrieval scoring (Hit@K, Recall@K, MRR) & Generation scoring (Faithfulness, Correctness, NLI)
  - Phase P4: Counterfactual probes, 7 verdict categories, root cause explanations, prescriptive suggestions
  - Phase P5: 5 fault-injection synthetics, confusion matrix, Cohen's kappa calibration
  - Phase P6: Freeze + Demo + Full-Stack Integration:
    - Frontend SPA mounted directly on FastAPI backend root (`GET /`)
    - Authentic API integration in React 18 frontend (`client.ts`, `useRuns.ts`)
    - Dynamic state propagation across Control, Evidence, and Diagnosis columns (`app.tsx`)
    - Real-time Server-Sent Events (SSE) progress streaming
    - Offline database & embedding cache pre-population (`scripts/prepare_demo.py`)
    - Integrated desktop launcher (`desktop/app.py`) with pywebview and browser fallback
    - OpenAPI 3.1 specification exported to `contract/openapi.json`

verification:
  - backend uv sync: 125 packages installed
  - backend pytest: 23/23 passed in 1.04s
  - backend ruff check: All checks passed (0 warnings, 0 errors)
  - backend mypy: Success: no issues found in 37 source files (strict mode)
  - frontend vitest: 11/11 tests passed in 1.78s
  - frontend build: tsc --noEmit && vite build compiled 1,642 modules with 0 errors
  - frontend eslint: 0 errors, 0 warnings
  - smoke_test.py: 8/8 contract & integration checks passed against live uvicorn server

next:
  - Project ready for hackathon presentation and live demo
