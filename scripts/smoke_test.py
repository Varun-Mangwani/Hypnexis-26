#!/usr/bin/env python3
"""Smoke test — must pass before every PR. Run with: uv run python ../scripts/smoke_test.py"""
import os
import sys
import json
import subprocess
import time
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8000"


def get(path: str) -> dict | list | str:
    url = BASE + path
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=10) as resp:
        ct = resp.headers.get("content-type", "")
        body = resp.read()
        if "json" in ct:
            return json.loads(body)
        return body.decode()


def post(path: str, data: dict | None = None, files: dict | None = None) -> dict:
    url = BASE + path
    if files:
        import io
        boundary = b"----BoundaryXYZ"
        body_parts = []
        for k, v in (data or {}).items():
            body_parts.append(b"--" + boundary)
            body_parts.append(f'Content-Disposition: form-data; name="{k}"'.encode())
            body_parts.append(b"")
            body_parts.append(v.encode() if isinstance(v, str) else str(v).encode())
        for k, (fname, content, ct) in files.items():
            body_parts.append(b"--" + boundary)
            body_parts.append(f'Content-Disposition: form-data; name="{k}"; filename="{fname}"'.encode())
            body_parts.append(f"Content-Type: {ct}".encode())
            body_parts.append(b"")
            body_parts.append(content)
        body_parts.append(b"--" + boundary + b"--")
        body = b"\r\n".join(body_parts)
        req = urllib.request.Request(url, data=body, method="POST")
        req.add_header("Content-Type", f"multipart/form-data; boundary={boundary.decode()}")
    else:
        body = json.dumps(data or {}).encode()
        req = urllib.request.Request(url, data=body, method="POST")
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def check(condition: bool, msg: str) -> None:
    if not condition:
        print(f"  FAIL: {msg}", file=sys.stderr)
        sys.exit(1)
    print(f"  PASS: {msg}")


def main() -> None:
    print("=== RAGDoctor Smoke Test ===")
    print(f"Base URL: {BASE}")
    print(f"MOCK mode: {os.environ.get('MOCK', '0')}")
    print()

    print("[1] POST /api/corpora — upload document")
    sample_text = b"RAG stands for Retrieval-Augmented Generation. It combines a retriever and a generator. The retriever fetches relevant documents. The generator produces an answer based on retrieved context. This approach reduces hallucination compared to pure parametric models."
    corpus = post(
        "/api/corpora",
        files={"file": ("sample.txt", sample_text, "text/plain")},
    )
    check("corpus_id" in corpus, "corpus_id returned")
    check(isinstance(corpus.get("chunk_count"), int), "chunk_count is integer")
    corpus_id = corpus["corpus_id"]
    print(f"  corpus_id={corpus_id}")

    print("\n[2] POST /api/runs — start evaluation")
    run = post("/api/runs", {"corpus_id": corpus_id, "num_questions": 5, "top_k": 3})
    check("run_id" in run, "run_id returned")
    check(run.get("status") in ("pending", "running", "complete"), "status is valid")
    run_id = run["run_id"]
    print(f"  run_id={run_id}")

    print("\n[3] GET /api/runs/{id} — get run summary")
    run_detail = get(f"/api/runs/{run_id}")
    check("run_id" in run_detail, "run_id in response")
    check("scores" in run_detail, "scores in response")
    check("manifest" in run_detail, "manifest in response")

    print("\n[4] GET /api/runs/{id}/cases — list cases")
    cases = get(f"/api/runs/{run_id}/cases")
    check(isinstance(cases, list), "cases is a list")
    if cases:
        case = cases[0]
        check("id" in case, "case has id")
        check("verdict" in case, "case has verdict")
        check("claims" in case, "case has claims")

    print("\n[5] GET /api/cases/{id} — get case detail")
    if cases:
        case_id = cases[0]["id"]
        case_detail = get(f"/api/cases/{case_id}")
        check("question" in case_detail, "question present")
        check("gold_chunk_ids" in case_detail, "gold_chunk_ids present")
        check("probes" in case_detail, "probes present")
        check("fix_suggestion" in case_detail, "fix_suggestion present")

    print("\n[6] GET /api/runs/{id}/validation — validation report")
    validation = get(f"/api/runs/{run_id}/validation")
    check("confusion_matrix" in validation, "confusion_matrix present")
    check("judge_kappa" in validation, "judge_kappa present")

    print("\n[7] GET /api/runs/{id}/report — HTML report")
    report = get(f"/api/runs/{run_id}/report")
    check(isinstance(report, str) and "<html" in report.lower(), "HTML report returned")

    print("\n[8] GET / — UI frontend single-page app mount")
    html_page = get("/")
    check(isinstance(html_page, str) and ("cockpit" in html_page.lower() or "root" in html_page.lower() or "<html" in html_page.lower()), "Frontend SPA served from root")

    print("\n=== All checks passed ===")


if __name__ == "__main__":
    main()

