import hashlib
from pathlib import Path
from typing import Any, cast

import numpy as np
from sentence_transformers import SentenceTransformer

from ragdoctor.config import settings

_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.embed_model)
    return _model


def _vector_cache_path(chunk_id: str) -> Path:
    cache_dir: Path = settings.data_dir / "embed_cache"
    cache_dir.mkdir(parents=True, exist_ok=True)
    res_path: Path = cache_dir / f"{chunk_id}.npy"
    return res_path


def embed_chunks(chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    model = _get_model()
    to_encode = []
    for chunk in chunks:
        cache_path = _vector_cache_path(chunk["chunk_id"])
        if not cache_path.exists():
            to_encode.append(chunk)

    if to_encode:
        texts = [c["text"] for c in to_encode]
        vectors = model.encode(texts, batch_size=32, normalize_embeddings=True)
        for chunk, vec in zip(to_encode, vectors, strict=True):
            cache_path = _vector_cache_path(chunk["chunk_id"])
            np.save(str(cache_path), vec)

    result = []
    for chunk in chunks:
        cache_path = _vector_cache_path(chunk["chunk_id"])
        vec = np.load(str(cache_path))
        c_dict = dict(chunk)
        c_dict["embedding"] = vec
        c_dict["embedding_hash"] = hashlib.sha256(vec.tobytes()).hexdigest()[:16]
        result.append(c_dict)
    return result


def embed_query(text: str) -> np.ndarray[Any, Any]:
    model = _get_model()
    encoded: Any = model.encode([text], normalize_embeddings=True)
    return cast(np.ndarray[Any, Any], encoded[0])
