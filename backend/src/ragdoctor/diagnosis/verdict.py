from typing import Any

from ragdoctor.config import settings
from ragdoctor.store.models import VerdictEnum


def assign_verdict(
    gold_chunk_ids: list[str],
    retrieved_ids: list[str],
    retrieved_set: set[str],
    top_k_set: set[str],
    probes: dict[str, Any],
    question_type: str,
    scores: dict[str, Any],
) -> tuple[VerdictEnum, str]:
    gold = set(gold_chunk_ids)

    if probes.get("no_context_correct"):
        return VerdictEnum.PARAMETRIC_LEAK, ""

    if question_type == "unanswerable" and probes.get("retrieved_context_correct"):
        return VerdictEnum.FAILED_TO_ABSTAIN, ""

    faith = scores.get("faithfulness", 1.0)
    accuracy = scores.get("answer_accuracy", 0.0)
    faith_ok = faith >= settings.faithfulness_threshold
    accuracy_ok = accuracy >= settings.answer_accuracy_threshold

    if faith_ok and accuracy_ok:
        return VerdictEnum.PASS, ""

    gold_retrieved = bool(gold & top_k_set)

    if not gold_retrieved:
        if probes.get("gold_context_correct") and not probes.get("retrieved_context_correct"):
            detail = _retrieval_miss_detail(gold, retrieved_ids)
            return VerdictEnum.RETRIEVAL_MISS, detail
        return VerdictEnum.BOTH_FAILED, ""

    if gold_retrieved:
        if probes.get("gold_context_correct") and not probes.get("retrieved_context_correct"):
            return VerdictEnum.CONTEXT_DISTRACTION, ""
        if not probes.get("gold_context_correct") and not probes.get("retrieved_context_correct"):
            return VerdictEnum.HALLUCINATION, ""

    return VerdictEnum.BOTH_FAILED, ""


def _retrieval_miss_detail(gold: set[str], retrieved_ids: list[str]) -> str:
    if gold & set(retrieved_ids):
        return "ranking"
    return "semantic"
