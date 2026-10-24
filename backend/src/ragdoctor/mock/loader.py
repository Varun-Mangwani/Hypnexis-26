import json
from typing import Any, cast

from ragdoctor.config import settings


def _load(name: str) -> dict[str, Any] | list[Any]:
    path = settings.fixtures_dir / f"{name}.json"
    if not path.exists():
        return {}
    res: dict[str, Any] | list[Any] = json.loads(path.read_text(encoding="utf-8"))
    return res


def get_corpus(corpus_id: str) -> dict[str, Any]:
    data = _load("corpus")
    res: dict[str, Any] = {}
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict) and item.get("corpus_id") == corpus_id:
                res = dict(item)
                break
        if not res and data and isinstance(data[0], dict):
            res = dict(data[0])
    elif isinstance(data, dict):
        res = dict(data)

    if res:
        res.setdefault("name", res.get("filename", "Evaluation Corpus"))
        res.setdefault("document_count", 3)
        res.setdefault("total_chunks", res.get("chunk_count", 142))
        res.setdefault("total_tokens", 72800)
        res.setdefault("avg_chunk_size", 512)
    return res


def get_run(run_id: str) -> dict[str, Any]:
    run_raw = _load("run")
    summary_raw = _load("run_summary")

    run_dict: dict[str, Any] = dict(run_raw) if isinstance(run_raw, dict) else {}
    summary_dict: dict[str, Any] = dict(summary_raw) if isinstance(summary_raw, dict) else {}

    res: dict[str, Any] = {
        "run_id": run_id,
        "id": run_id,
        "corpus_id": run_dict.get("corpus_id", "corp_demo_001"),
        "corpus_name": summary_dict.get("corpus_name", "Financial & Technical Architecture Corpus (Q3-2026)"),
        "status": "complete",
        "created_at": summary_dict.get("created_at", "2026-10-24T10:00:00Z"),
        "completed_at": summary_dict.get("finished_at", "2026-10-24T10:02:18Z"),
        "finished_at": summary_dict.get("finished_at", "2026-10-24T10:02:18Z"),
        "num_questions": summary_dict.get("total_cases", run_dict.get("num_questions", 24)),
        "total_cases": summary_dict.get("total_cases", 24),
        "processed_cases": summary_dict.get("processed_cases", 24),
        "tokens_used": summary_dict.get("token_usage", run_dict.get("tokens_used", 142850)),
        "token_usage": summary_dict.get("token_usage", 142850),
        "latency_ms": summary_dict.get("latency_ms", 18450),
        "cost_estimate_usd": summary_dict.get("cost_estimate_usd", 0.428),
        "config_hash": run_dict.get("config_hash", "cfg_abc123"),
        "scores": summary_dict.get("scores", run_dict.get("scores", {
            "context_relevance": 0.79,
            "faithfulness": 0.71,
            "answer_accuracy": 0.68,
        })),
        "component_scores": summary_dict.get("component_scores", {
            "retriever_score": 0.81,
            "generator_score": 0.74,
            "e2e_score": 0.68,
        }),
        "verdict_distribution": run_dict.get("verdict_distribution", {
            "PASS": 12,
            "RETRIEVAL_MISS": 4,
            "HALLUCINATION": 4,
            "BOTH_FAILED": 2,
            "CONTEXT_DISTRACTION": 1,
            "PARAMETRIC_LEAK": 1,
        }),
        "manifest": run_dict.get("manifest", {
            "generator_model": "gpt-4o-mini",
            "judge_model": "gpt-4o",
            "embed_model": "BAAI/bge-small-en-v1.5",
            "top_k": 5,
            "chunk_size": 512,
            "chunk_overlap": 64,
            "faithfulness_threshold": 0.5,
            "answer_accuracy_threshold": 0.5,
        }),
    }
    return res


def get_cases(run_id: str) -> list[dict[str, Any]]:
    if run_id.startswith("run-demo") or run_id == "demo":
        run_cases = _load("run_cases")
        if isinstance(run_cases, list) and run_cases:
            return cast(list[dict[str, Any]], run_cases)

    cases = _load("cases")
    if isinstance(cases, list) and cases:
        return cast(list[dict[str, Any]], cases)

    run_cases = _load("run_cases")
    if isinstance(run_cases, list) and run_cases:
        return cast(list[dict[str, Any]], run_cases)
    return []


def get_case(case_id: str) -> dict[str, Any]:
    run_cases = _load("run_cases")
    if isinstance(run_cases, list):
        for c in run_cases:
            if isinstance(c, dict) and c.get("id") == case_id:
                return cast(dict[str, Any], c)

    cases = _load("cases")
    if isinstance(cases, list):
        for c in cases:
            if isinstance(c, dict) and c.get("id") == case_id:
                return cast(dict[str, Any], c)
    return {}


def get_validation(run_id: str) -> dict[str, Any]:
    data = _load("validation")
    if isinstance(data, dict):
        res = dict(data)
        res.setdefault("cohen_kappa", res.get("judge_kappa", 0.74))
        res.setdefault(
            "calibration_verdict",
            f"{res.get('judge_kappa_interpretation', 'Substantial agreement')} — judge is well-calibrated for evaluation.",
        )
        return res
    return {
        "run_id": run_id,
        "confusion_matrix": {},
        "judge_kappa": 0.74,
        "cohen_kappa": 0.74,
        "judge_kappa_interpretation": "Substantial agreement",
        "calibration_verdict": "Substantial agreement — judge is well-calibrated for evaluation.",
        "hand_labeled_count": 50,
        "judge_labeled_count": 50,
    }


def get_report(run_id: str) -> str:
    path = settings.fixtures_dir / "report.html"
    if path.exists():
        content: str = path.read_text(encoding="utf-8")
        return content
    return "<html><body><h1>RAG Evaluation Report</h1><p>No data yet.</p></body></html>"

