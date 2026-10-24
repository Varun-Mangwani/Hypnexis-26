# DEV-A — Core, ML and Backend (Python)

Project: **RAG Evaluation Pipeline — Retriever and Generator Tested Apart** (Hackathon track AI-04)

You own everything in `backend/`. Dev B owns `frontend/` and `desktop/`. Both of you share `contract/` and `docs/`.

---

## 1. Mission

Build the engine that:

1. Ingests uploaded documents into chunks with stable IDs.
2. Generates realistic synthetic questions with known answers and known gold chunks.
3. Runs a reference RAG (and any pluggable RAG) on those questions.
4. Scores retrieval, generation and end-to-end separately.
5. Diagnoses every failure: retrieval problem, hallucination, or both.
6. Proves the evaluator itself works (fault injection and judge calibration).
7. Exposes all of it through a FastAPI API that matches `contract/openapi.json`.

The one idea that wins: **the metrics are a commodity, the diagnosis is the product.** RAGAS-style libraries already score faithfulness and context precision. Our edge is counterfactual root-cause analysis plus proof that it is accurate.

---

## 2. What you own and what you must not touch

| You own | You never edit |
|---|---|
| `backend/**` | `frontend/**`, `desktop/**` |
| `scripts/smoke_test.py` | Dev B's fixtures usage in the UI |

Shared, change only with Dev B's approval in a PR: `contract/**`, `docs/DECISIONS.md`.

---

## 3. Setup

```bash
cd backend
uv sync
cp .env.example .env        # add your LLM key and base URL
uv run uvicorn ragdoctor.api.main:app --reload --port 8000
```

Mock mode (serves fixtures from `contract/fixtures/`, no LLM calls):

```bash
MOCK=1 uv run uvicorn ragdoctor.api.main:app --reload --port 8000
```

Export the contract after any route or model change:

```bash
uv run python -m ragdoctor.scripts.export_openapi   # writes contract/openapi.json
```

Smoke test (must pass before every PR):

```bash
uv run python ../scripts/smoke_test.py
```

---

## 4. Tech stack

| Layer | Choice |
|---|---|
| Runtime | Python 3.11 or 3.12, `uv`, locked dependencies |
| API | FastAPI, Pydantic v2, Server-Sent Events for run progress |
| Storage | SQLite (SQLModel) |
| Parsing | PyMuPDF or pypdf, plain text and markdown |
| Chunking | Own recursive splitter (size and overlap are explicit settings) |
| Embeddings | `sentence-transformers` small open model (bge-small or MiniLM class) |
| Vector search | NumPy cosine behind a `VectorStore` interface |
| Keyword search | `rank_bm25` for hybrid search |
| LLM access | `openai` SDK with configurable `base_url` (hosted API or local Ollama) |
| Reliability | `tenacity` retries, JSON-schema outputs, temperature 0 |
| Cache | SQLite table keyed by hash of model + prompt + params |
| Faithfulness second opinion | NLI cross-encoder (CPU) |
| Dev-only comparator | `ragas` (cross-check numbers, never a runtime dependency) |
| Tests | `pytest`, one golden-run regression test |
| Quality | `ruff`, `mypy` |

---

## 5. Folder structure (feature-based)

```
backend/
  src/ragdoctor/
    api/          routes, SSE, app factory
    ingest/       parse, chunk, embed
    rag/          reference RAG, adapter interface, vector store, bm25
    testgen/      question generator, quality control, prompts
    scoring/      retrieval metrics, faithfulness, correctness, nli
    diagnosis/    probes, verdict rules, explanations, fix suggestions
    validation/   fault injection, judge calibration
    llm/          client, cache, rate limiter, token budget
    store/        db models and session
    mock/         fixture loader for MOCK=1
    prompts/      versioned prompt text files
    config.py     thresholds and settings
  tests/
```

Rule: `ingest`, `rag`, `scoring`, `diagnosis` are pure Python and never import FastAPI. The `api` layer only calls them.

---

## 6. Modules and definition of done

| Module | What it does | Done when |
|---|---|---|
| **M1 Ingestion** | Parse, chunk, embed, store with stable chunk IDs and char offsets | Upload returns a corpus with chunks; re-ingesting the same file gives identical IDs |
| **M2 Test generator** | Make Q/A pairs from sampled chunks with gold chunk IDs and answer spans. Types: `factoid`, `numeric`, `multi_hop`, `paraphrased`, `unanswerable` | 100+ questions generated for the demo corpus |
| **M2b Quality control** | Verify answer is derivable from source chunk, drop near-duplicates, drop lexical-copy questions, run the closed-book check once and flag `answerable_without_context` | 30 questions spot-checked by hand and at least 85% are good |
| **M3 Retrieval scorer** | Deterministic hit@k, recall@k, MRR from gold chunk IDs (no LLM) | Matches hand calculation on 5 examples |
| **M4 Generation scorer** | Faithfulness (claim split, verify each claim, require a quoted evidence sentence) and answer accuracy vs gold | Directionally agrees with RAGAS on the demo corpus |
| **M5 Diagnosis engine** | Counterfactual probes and verdict assignment (section 8) | Correct on 10 hand-picked cases |
| **M6 Validation** | Fault injection confusion matrix and judge calibration (kappa) | Both reported by the API |
| **API** | Every route in the contract, SSE progress | `smoke_test.py` passes with `MOCK=0` |

---

## 7. API contract you must honour

| Endpoint | Purpose |
|---|---|
| `POST /api/corpora` | Upload documents, return `corpus_id` |
| `POST /api/runs` | Start an evaluation (config, number of questions) |
| `GET /api/runs/{id}/events` | SSE progress stream |
| `GET /api/runs/{id}` | Run summary and scorecards |
| `GET /api/runs/{id}/cases` | Case list with filters (verdict, question type) |
| `GET /api/cases/{id}` | Full case detail |
| `POST /api/query` | Ad hoc query, reference-free scoring |
| `POST /api/runs/{id}/compare` | Re-run with changed settings, return before/after deltas |
| `GET /api/runs/{id}/validation` | Fault-injection confusion matrix and judge kappa |
| `GET /api/runs/{id}/report` | Exported HTML report |

Verdict enum (frozen after P0): `PASS`, `RETRIEVAL_MISS`, `CONTEXT_DISTRACTION`, `HALLUCINATION`, `BOTH_FAILED`, `PARAMETRIC_LEAK`, `FAILED_TO_ABSTAIN`.

Case detail shape:

```json
{
  "id": "c_042",
  "question": "...",
  "question_type": "multi_hop",
  "gold_answer": "...",
  "gold_chunk_ids": ["ch_11"],
  "retrieved": [{"chunk_id": "ch_07", "score": 0.81, "text": "...", "is_gold": false}],
  "answer": "...",
  "claims": [{"text": "...", "supported": false, "evidence_chunk_id": null, "span": [120, 168]}],
  "scores": {"context_relevance": 0.4, "faithfulness": 0.5, "answer_accuracy": 0.0},
  "probes": {"gold_context_correct": true, "retrieved_context_correct": false, "no_context_correct": false},
  "verdict": "RETRIEVAL_MISS",
  "verdict_detail": "ranking",
  "explanation": "...",
  "fix_suggestion": "Increase top_k from 3 to 8 or add a reranker"
}
```

**Stub first.** Your first deliverable (about two hours in) is the full API returning fixtures with `MOCK=1`. Dev B builds against it from day one.

---

## 8. Diagnosis logic

For each failed question, generate answers with three contexts: the **retrieved** chunks, the **gold** chunks, and **no** context.

| Gold in retrieved? | Answer with gold context | Answer with retrieved context | Verdict |
|---|---|---|---|
| No | Correct | Wrong | `RETRIEVAL_MISS` (detail: `ranking` if gold was in top-N but not top-k, `chunking` if the answer spans a chunk boundary, otherwise `semantic`) |
| Yes | Correct | Wrong or unfaithful | `CONTEXT_DISTRACTION` |
| Yes | Wrong | Wrong | `HALLUCINATION` |
| No | Wrong | Wrong | `BOTH_FAILED` |
| Any | n/a | Correct with no context | `PARAMETRIC_LEAK` (flag and exclude from headline scores) |
| Unanswerable question | n/a | Answered anyway | `FAILED_TO_ABSTAIN` |

Pass rule (thresholds live in `config.py` and are saved in the run manifest): answer accuracy correct **and** faithfulness at or above the threshold.

### Fault injection (the proof)

Break the reference RAG on purpose, run the pipeline, and show the confusion matrix of injected fault versus diagnosed cause.

| Injected fault | Expected diagnosis |
|---|---|
| Tiny chunks (about 100 characters) | `RETRIEVAL_MISS` / `chunking` |
| `top_k = 1` | `RETRIEVAL_MISS` / `ranking` |
| Shuffled retrieval | `RETRIEVAL_MISS` / `semantic` |
| Prompt that encourages guessing | `HALLUCINATION` or `PARAMETRIC_LEAK` |
| Gold chunk removed from the index | `RETRIEVAL_MISS` or `BOTH_FAILED` |

### Judge calibration

Hand-label 50 to 100 cases (Dev B helps), compare to the judge, and report Cohen's kappa through `/validation`.

---

## 9. Optimising the AI pipeline

Cost, latency and reliability decide whether the demo works. Apply these in order of payoff.

1. **Deterministic first.** Retrieval metrics come from gold chunk IDs and need no LLM. Never ask a model something a formula can answer.
2. **Cache every LLM call** by hash of model, prompt and params. Re-runs and demos become instant and free.
3. **Run probes only on failures.** The gold-context and retrieved-context probes run only for cases that failed end to end. The closed-book check runs once per question at QC time, not per run.
4. **Cascade cheap to expensive.** Lexical or embedding overlap, then the NLI model, then the LLM judge only for uncertain claims.
5. **Batch claims.** Verify many claims in one structured call instead of one call per claim.
6. **Bound concurrency.** Use an `asyncio.Semaphore` (start at 4) and exponential backoff on rate limits. Cap retries at 2.
7. **Keep prompts small.** Send only the chunks needed, cap `max_tokens`, and never paste whole documents.
8. **Model tiers.** Cheaper model for bulk question drafting and the reference generator. Stronger model for the judge and QC verification.
9. **Different families.** The judge must not be the same model family as the generator under test (self-preference bias).
10. **Force verifiable evidence.** The judge must return the exact supporting sentence. Check programmatically that it exists in the context. Reject judgments with invented evidence.
11. **Reduce position bias.** Randomise chunk order with a fixed seed when judging, and record the seed.
12. **Embed once.** Batch-encode, normalise, and cache vectors on disk keyed by chunk hash.
13. **Budget guard.** Count tokens per run, enforce a hard cap, and store the estimate on the run record.
14. **Reproducibility.** Temperature 0, fixed seeds, and a run manifest (config hash, model names, prompt file hashes, library versions).
15. **Offline demo mode.** A full cached run must replay with no network.

---

## 10. AI coding assistant instructions

Paste this block into `AGENTS.md` or `CLAUDE.md` at the repo root (or `backend/AGENTS.md`) so Claude Code, Antigravity or any agent follows it.

```
ROLE: You are working on Dev A's half (backend/) of a hackathon project.

SCOPE
- Edit only backend/. Never edit frontend/, desktop/, or contract/ without being told.
- Any change to routes or models must be followed by exporting contract/openapi.json.
- Ask me about every unclear requirement until it is fully clear. Ask before fetching anything online.

CODE RULES
- Python 3.11, type hints everywhere, Pydantic models at every boundary.
- Feature-based folders. Pure-Python modules never import FastAPI.
- No comments in code. If something needs explaining, write it to docs/ in a separate file.
- No extra lines, no dead code, no unused imports, no speculative abstractions.
- Well-maintained popular libraries are fine. Do not write what a stable library already does.
- No old patterns: use async where I/O bound, dataclass or Pydantic over dicts, pathlib over os.path.
- Never hard-code keys, model names or thresholds. Read them from config.py and .env.

LLM RULES
- Temperature 0, JSON-schema outputs, validated with Pydantic, at most 2 retries.
- Every call goes through llm/client.py, which handles cache, rate limiting and the token budget.
- Prompts live in prompts/*.txt and are hashed into the run manifest.

DONE MEANS
- ruff, mypy and pytest pass and scripts/smoke_test.py passes. Fix all errors before replying.
- Commit when a major change is complete, using: type(scope): message.

TESTING
- Minimal, hackathon-speed: the smoke test and the golden-run test. Add a unit test only for scoring math and verdict rules.

SECURITY
- Basic hygiene only: no secrets in code or logs, validate uploads (type and size), no arbitrary file paths.

REPLIES
- Terse. State what changed and nothing else.
```

---

## 11. Do's and Don'ts

**Do**

- Ship the stub API in the first two hours.
- Keep chunk IDs and character offsets stable and deterministic.
- Log every retrieval (chunk IDs, scores) so diagnosis is replayable.
- Record the manifest for every run.
- Rebase on `main` before opening a PR.
- Add new fields to the contract and fixtures before implementing them.
- Tell Dev B immediately when a response shape changes.
- Keep thresholds in `config.py` and report them in the UI payload.

**Don't**

- Don't edit `frontend/`, `desktop/` or `.github/CODEOWNERS`.
- Don't rename or remove contract fields without Dev B's approval.
- Don't call an LLM for anything a formula can compute.
- Don't use the generator's own model family as the judge.
- Don't trust judge output without verifying the quoted evidence exists.
- Don't commit `.env`, API keys, `*.db`, model caches or `data/runs/`.
- Don't push directly to `main`.
- Don't let one slow LLM call block the whole run. Use timeouts and the semaphore.
- Don't add metrics for their own sake. If time runs short, cut metrics, never diagnosis.

---

## 12. Git workflow

1. Branch from `main` as `a/<feature>`.
2. Commit small and often.
3. Before a PR: `git fetch && git rebase origin/main`, then run the smoke test.
4. Open a PR at least daily. Dev B reviews for "does it run and match the contract".
5. Squash merge. `main` must always run.

PR checklist:

- [ ] `ruff`, `mypy`, `pytest` pass
- [ ] `scripts/smoke_test.py` passes
- [ ] `contract/openapi.json` re-exported if routes or models changed
- [ ] Fixtures updated if response shapes changed
- [ ] No secrets or large files committed

---

## 13. Phase gates

| Phase | Your tasks | Gate |
|---|---|---|
| **P0** (together) | Repo, env, contract, fixtures | Both run the stack; contract committed |
| **P1** | Stub API, ingestion, reference RAG | UI shows fixture data from the real stub server |
| **P2** | Test generator and QC | Real document uploaded, real chunks visible in the UI |
| **P3** | Retrieval and generation scoring | Real scores shown, colour-coded |
| **P4** | Diagnosis engine | One full run end to end, no manual steps |
| **P5** | Fault injection, judge calibration | Confusion matrix and kappa shown in the UI |
| **P6** (together) | Freeze, cached demo run, rehearsal | Demo runs offline on cached results |

Freeze features at the start of P6. After that, bug fixes only.

---

## 14. Knowledge you must be able to explain to judges

- Retrieval metrics: hit@k, recall@k, MRR, and why synthetic questions make them deterministic.
- Faithfulness as supported claims divided by total claims, with verified evidence.
- The three counterfactual probes and the verdict table.
- Why synthetic questions need quality control (and what you filter out).
- What fault injection proves and what kappa tells you about the judge.
- Why you did not just wrap RAGAS.

Teach Dev B the backend at P3 in a 20-minute walkthrough, and write the key points into `docs/ARCHITECTURE.md`.
