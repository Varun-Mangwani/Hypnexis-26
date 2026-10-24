import random
from typing import Any


class FaultType:
    TINY_CHUNKS = "tiny_chunks"
    TOP_K_ONE = "top_k_one"
    SHUFFLED_RETRIEVAL = "shuffled_retrieval"
    GUESS_PROMPT = "guess_prompt"
    GOLD_REMOVED = "gold_removed"


def inject_tiny_chunks(chunks: list[dict[str, Any]], size: int = 100) -> list[dict[str, Any]]:
    result = []
    for chunk in chunks:
        text = chunk["text"]
        for i in range(0, len(text), size):
            sub = dict(chunk)
            sub_text = text[i : i + size]
            if sub_text.strip():
                sub["text"] = sub_text
                sub["chunk_id"] = chunk["chunk_id"] + f"_sub{i}"
                result.append(sub)
    return result


def inject_top_k_one(top_k: int) -> int:
    return 1


def shuffle_retrieval(retrieved: list[dict[str, Any]], seed: int = 42) -> list[dict[str, Any]]:
    r = random.Random(seed)
    shuffled = list(retrieved)
    r.shuffle(shuffled)
    return shuffled


def remove_gold_chunks(chunks: list[dict[str, Any]], gold_ids: list[str]) -> list[dict[str, Any]]:
    gold_set = set(gold_ids)
    return [c for c in chunks if c["chunk_id"] not in gold_set]


def compute_confusion_matrix(
    cases: list[dict[str, Any]],
) -> dict[str, Any]:
    injected = [c for c in cases if c.get("injected_fault")]
    matrix: dict[str, dict[str, int]] = {}
    for case in injected:
        fault = case["injected_fault"]
        verdict = case.get("verdict", "UNKNOWN")
        if fault not in matrix:
            matrix[fault] = {}
        matrix[fault][verdict] = matrix[fault].get(verdict, 0) + 1
    return matrix
