# Architecture — RAGDoctor Backend

## Overview

RAGDoctor evaluates RAG systems by separating retrieval and generation scoring and diagnosing failures with counterfactual probes.

## Layer Diagram

```
HTTP Client (Dev B frontend)
        │
        ▼
api/routes.py          ← FastAPI routes (only layer allowed to import FastAPI)
        │
        ├─→ ingest/    ← parse, chunk, embed (pure Python)
        ├─→ rag/       ← retriever, generator, vector store (pure Python)
        ├─→ testgen/   ← question generator + QC (pure Python)
        ├─→ scoring/   ← retrieval metrics, faithfulness, correctness, NLI (pure Python)
        ├─→ diagnosis/ ← probes, verdict, explanations (pure Python)
        ├─→ validation/← fault injection, calibration (pure Python)
        └─→ store/     ← SQLite models and session (pure Python)
```

## Key Design Decisions

### Deterministic retrieval metrics
Hit@k, recall@k, and MRR are computed from gold chunk IDs — no LLM needed. The chunk ID scheme (`ch_` + sha256 of corpus_id + offsets + content hash) ensures stability across re-ingestion.

### Counterfactual probes
For each failed case, we generate answers under three conditions:
1. **Gold context** — what the answer would be with the ideal context
2. **Retrieved context** — what the answer actually was
3. **No context** — whether the model knows the answer parametrically

This 3-way probe gives us the truth table for the verdict enum.

### LLM cache
Every LLM call is keyed by sha256(model + prompt + params). Re-runs and demos replay instantly from the SQLite cache. This makes demos offline-capable.

### Cost cascade
1. Deterministic metrics (no LLM)
2. NLI cross-encoder (CPU, fast)
3. LLM judge (only for uncertain claims)

### MOCK=1 mode
Serves `contract/fixtures/` via the same API routes. Dev B can build the full UI from day one without waiting for real pipeline execution.

## Data Flow

```
Upload PDF
    → extract_text()
    → chunk_text() → stable chunk_ids
    → embed_chunks() → cache on disk
    → store in SQLite (Corpus, Chunk tables)

Start Run
    → sample chunks → generate_questions_for_chunk()
    → QC filter
    → for each question:
        → hybrid_retrieve() [dense + BM25]
        → generate_answer()
        → score_retrieval() [deterministic]
        → score_faithfulness() [claims + NLI → LLM]
        → score_answer_accuracy() [LLM judge]
        → if failed: run_probes() [3 counterfactual LLM calls]
        → assign_verdict() [truth table]
        → explain() + suggest_fix() [deterministic]
    → store TestCase in SQLite
    → update Run scores and manifest
```

## Verdict Truth Table

| Gold retrieved | Gold ctx correct | Retrieved ctx correct | No ctx correct | Verdict |
|---|---|---|---|---|
| any | any | any | yes | PARAMETRIC_LEAK |
| no | yes | no | no | RETRIEVAL_MISS |
| yes | yes | no | no | CONTEXT_DISTRACTION |
| yes | no | no | no | HALLUCINATION |
| no | no | no | no | BOTH_FAILED |
| unanswerable | n/a | yes | any | FAILED_TO_ABSTAIN |
| any | n/a | yes | no | PASS |
