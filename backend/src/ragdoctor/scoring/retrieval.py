from typing import Any


def hit_at_k(retrieved_ids: list[str], gold_ids: set[str], k: int) -> float:
    top_k = retrieved_ids[:k]
    return 1.0 if any(cid in gold_ids for cid in top_k) else 0.0


def recall_at_k(retrieved_ids: list[str], gold_ids: set[str], k: int) -> float:
    if not gold_ids:
        return 1.0
    top_k = set(retrieved_ids[:k])
    return len(top_k & gold_ids) / len(gold_ids)


def mrr(retrieved_ids: list[str], gold_ids: set[str]) -> float:
    for rank, cid in enumerate(retrieved_ids, start=1):
        if cid in gold_ids:
            return 1.0 / rank
    return 0.0


def score_retrieval(retrieved: list[dict[str, Any]], gold_chunk_ids: list[str], k: int) -> dict[str, float]:
    retrieved_ids = [r["chunk_id"] for r in retrieved]
    gold = set(gold_chunk_ids)
    return {
        f"hit_at_{k}": hit_at_k(retrieved_ids, gold, k),
        f"recall_at_{k}": recall_at_k(retrieved_ids, gold, k),
        "mrr": mrr(retrieved_ids, gold),
        "context_relevance": recall_at_k(retrieved_ids, gold, k),
    }
