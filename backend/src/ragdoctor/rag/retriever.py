from typing import Any

import numpy as np

from ragdoctor.rag.vector_store import BM25Store, VectorStore


def hybrid_retrieve(
    query_vec: np.ndarray[Any, Any],
    query_text: str,
    vector_store: VectorStore,
    bm25_store: BM25Store,
    top_k: int,
    alpha: float,
) -> list[dict[str, Any]]:
    dense = vector_store.cosine_search(query_vec, top_k * 2)
    sparse = bm25_store.search(query_text, top_k * 2)

    scores: dict[str, float] = {}
    texts: dict[str, str] = {}

    max_dense = max((r["score"] for r in dense), default=1.0)
    max_sparse = max((r["score"] for r in sparse), default=1.0)

    for r in dense:
        cid = r["chunk_id"]
        scores[cid] = scores.get(cid, 0.0) + alpha * (r["score"] / max_dense)
        texts[cid] = r["text"]

    for r in sparse:
        cid = r["chunk_id"]
        sparse_score = r["score"] / max_sparse if max_sparse > 0 else 0.0
        scores[cid] = scores.get(cid, 0.0) + (1 - alpha) * sparse_score
        texts[cid] = r["text"]

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
    return [{"chunk_id": cid, "score": sc, "text": texts[cid]} for cid, sc in ranked]


def build_stores(chunks: list[dict[str, Any]]) -> tuple[VectorStore, BM25Store]:
    vs = VectorStore()
    bm25 = BM25Store()
    for chunk in chunks:
        vs.add(chunk["chunk_id"], chunk["text"], chunk["embedding"])
        bm25.add(chunk["chunk_id"], chunk["text"])
    return vs, bm25
