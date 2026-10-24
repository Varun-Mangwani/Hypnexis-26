from typing import Any

import numpy as np
from rank_bm25 import BM25Okapi


class VectorStore:
    def __init__(self) -> None:
        self._chunk_ids: list[str] = []
        self._texts: list[str] = []
        self._vectors: list[np.ndarray[Any, Any]] = []

    def add(self, chunk_id: str, text: str, vector: np.ndarray[Any, Any]) -> None:
        self._chunk_ids.append(chunk_id)
        self._texts.append(text)
        self._vectors.append(vector)

    def cosine_search(self, query_vec: np.ndarray[Any, Any], top_k: int) -> list[dict[str, Any]]:
        if not self._vectors:
            return []
        matrix = np.stack(self._vectors)
        scores = matrix @ query_vec
        indices = np.argsort(scores)[::-1][:top_k]
        return [
            {"chunk_id": self._chunk_ids[i], "score": float(scores[i]), "text": self._texts[i]}
            for i in indices
        ]

    def __len__(self) -> int:
        return len(self._chunk_ids)


class BM25Store:
    def __init__(self) -> None:
        self._chunk_ids: list[str] = []
        self._texts: list[str] = []
        self._bm25: BM25Okapi | None = None

    def add(self, chunk_id: str, text: str) -> None:
        self._chunk_ids.append(chunk_id)
        self._texts.append(text)
        self._bm25 = None

    def _ensure_built(self) -> None:
        if self._bm25 is None:
            tokenized = [t.lower().split() for t in self._texts]
            self._bm25 = BM25Okapi(tokenized)

    def search(self, query: str, top_k: int) -> list[dict[str, Any]]:
        if not self._texts:
            return []
        self._ensure_built()
        assert self._bm25 is not None
        tokens = query.lower().split()
        scores = self._bm25.get_scores(tokens)
        indices = np.argsort(scores)[::-1][:top_k]
        return [
            {"chunk_id": self._chunk_ids[i], "score": float(scores[i]), "text": self._texts[i]}
            for i in indices
            if scores[i] > 0
        ]
