# REQUIREMENTS.md — RAGDoctor Backend

## Functional Requirements

### FR-01: Document Ingestion
- Accept PDF, plain text, markdown uploads
- Parse → chunk → embed with stable, deterministic chunk IDs and char offsets
- Re-ingesting the same file produces identical IDs

### FR-02: Synthetic Test Generation
- Generate factoid, numeric, multi_hop, paraphrased, unanswerable Q/A pairs
- Each question has gold_chunk_ids and gold answer span
- 100+ questions for demo corpus
- Quality control: verify answer derivability, drop near-duplicates, drop lexical copies, flag answerable_without_context

### FR-03: Reference RAG
- Hybrid retrieval: dense (cosine/embeddings) + sparse (BM25)
- Configurable top_k
- Pluggable via adapter interface

### FR-04: Retrieval Scoring
- Deterministic: hit@k, recall@k, MRR from gold chunk IDs (no LLM)

### FR-05: Generation Scoring
- Faithfulness: claim split → verify each claim with quoted evidence
- Answer accuracy vs gold answer
- NLI cross-encoder as cheap first pass; LLM judge for uncertain claims

### FR-06: Diagnosis Engine
- Three counterfactual probes per failed case: gold context, retrieved context, no context
- Verdict assignment: PASS, RETRIEVAL_MISS, CONTEXT_DISTRACTION, HALLUCINATION, BOTH_FAILED, PARAMETRIC_LEAK, FAILED_TO_ABSTAIN
- Detailed sub-verdicts: ranking, chunking, semantic for RETRIEVAL_MISS
- Explanation + fix suggestion per case

### FR-07: Validation
- Fault injection: tiny chunks, top_k=1, shuffled retrieval, guess-prompt, gold chunk removed
- Confusion matrix of injected fault vs diagnosed cause
- Judge calibration: Cohen's kappa vs hand-labeled set

### FR-08: API (FastAPI)
- Every route in contract/openapi.json
- SSE progress stream for runs
- MOCK=1 mode serving from contract/fixtures/

## Non-Functional Requirements

### NFR-01: Performance
- LLM cache by hash(model+prompt+params) — re-runs instant
- Probes only on failures; closed-book check once at QC time
- asyncio.Semaphore(4), exponential backoff, max 2 retries
- Batch claim verification

### NFR-02: Reproducibility
- Temperature 0, fixed seeds, run manifest (config hash, model names, prompt hashes, lib versions)
- Offline demo mode: full cached run with no network

### NFR-03: Quality
- ruff + mypy clean; pytest passes; smoke_test.py passes
- Conventional commits

### NFR-04: Security
- No secrets in code; validate uploads (type + size); no arbitrary file paths
