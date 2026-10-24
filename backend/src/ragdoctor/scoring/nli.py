from sentence_transformers import CrossEncoder

_nli_model: CrossEncoder | None = None
_NLI_MODEL_NAME = "cross-encoder/nli-deberta-v3-small"


def _get_nli() -> CrossEncoder:
    global _nli_model
    if _nli_model is None:
        _nli_model = CrossEncoder(_NLI_MODEL_NAME)
    return _nli_model


def nli_entailment_score(premise: str, hypothesis: str) -> float:
    model = _get_nli()
    scores = model.predict([(premise, hypothesis)])
    return float(scores[0][0])


def batch_nli_scores(pairs: list[tuple[str, str]]) -> list[float]:
    if not pairs:
        return []
    model = _get_nli()
    scores = model.predict(pairs)
    return [float(s[0]) for s in scores]
