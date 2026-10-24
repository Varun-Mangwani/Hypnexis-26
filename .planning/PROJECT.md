# PROJECT.md — RAGDoctor: RAG Evaluation Pipeline (Dev-A Backend)

## Project Identity
- **Name:** RAGDoctor — RAG Evaluation Pipeline
- **Track:** Hackathon AI-04
- **Role:** Developer A — Core ML & Backend (Python)
- **Workspace:** `backend/` (never touch `frontend/`, `desktop/`)

## Mission
Build the engine that ingests documents, generates synthetic Q&A, runs a reference RAG, scores retrieval/generation separately, diagnoses every failure with counterfactual probes, proves the evaluator via fault injection, and exposes all of it via FastAPI matching `contract/openapi.json`.

**The differentiator:** Counterfactual root-cause diagnosis + proof that the evaluator itself is accurate.

## Tech Stack
| Layer | Choice |
|---|---|
| Runtime | Python 3.11, `uv`, locked deps |
| API | FastAPI, Pydantic v2, SSE |
| Storage | SQLite via SQLModel |
| Parsing | PyMuPDF / pypdf |
| Chunking | Own recursive splitter |
| Embeddings | sentence-transformers (bge-small/MiniLM) |
| Vector search | NumPy cosine behind VectorStore interface |
| Keyword search | rank_bm25 |
| LLM | openai SDK, configurable base_url |
| Reliability | tenacity retries, JSON-schema outputs, temp 0 |
| Cache | SQLite keyed by hash(model+prompt+params) |
| NLI | cross-encoder (CPU) for faithfulness |
| Tests | pytest, smoke_test.py, golden-run regression |
| Quality | ruff, mypy |

## Collaboration Boundary
- **Dev B** owns `frontend/` and `desktop/`
- Shared (PR-only changes): `contract/`, `docs/`
- **Stub API first** (MOCK=1) so Dev B can build immediately

## Phase Gates
| Phase | Deliverable | Gate |
|---|---|---|
| P0 | Repo, env, contract, fixtures | Both devs run the stack |
| P1 | Stub API, ingestion, reference RAG | UI shows fixture data |
| P2 | Test generator + QC | Real chunks visible |
| P3 | Retrieval + generation scoring | Real scores shown |
| P4 | Diagnosis engine | Full end-to-end run |
| P5 | Fault injection + judge calibration | Confusion matrix shown |
| P6 | Freeze, cached demo, rehearsal | Offline demo works |

## Key Constraints
- NEVER call LLM for anything a formula can compute
- Temperature 0, JSON-schema outputs, at most 2 retries
- All LLM calls through `llm/client.py`
- Prompts in `prompts/*.txt`, hashed into run manifest
- No secrets in code — `.env` only
- `ruff`, `mypy`, `pytest`, `smoke_test.py` must pass before every PR
