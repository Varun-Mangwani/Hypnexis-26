from ragdoctor.store.models import VerdictEnum

_EXPLANATIONS: dict[VerdictEnum, str] = {
    VerdictEnum.PASS: "Retrieved the right context and generated a faithful, accurate answer.",
    VerdictEnum.RETRIEVAL_MISS: "The gold chunk was not retrieved. The answer failed because the retriever did not surface the relevant information.",
    VerdictEnum.CONTEXT_DISTRACTION: "Gold chunk was retrieved, but the model was distracted by irrelevant context and produced a wrong or unfaithful answer.",
    VerdictEnum.HALLUCINATION: "Even with the correct context, the model produced an unsupported answer, indicating hallucination.",
    VerdictEnum.BOTH_FAILED: "Both retrieval and generation failed independently.",
    VerdictEnum.PARAMETRIC_LEAK: "Model answered correctly from parametric knowledge without needing the context. Excluded from headline scores.",
    VerdictEnum.FAILED_TO_ABSTAIN: "The question was unanswerable from context, but the model answered anyway.",
}

_SUGGESTIONS: dict[str, str] = {
    "ranking": "Increase top_k or add a reranker to surface the gold chunk.",
    "chunking": "Reduce chunk size or add overlap — the answer may span a chunk boundary.",
    "semantic": "Improve the embedding model or add keyword search (BM25) to the retriever.",
    VerdictEnum.CONTEXT_DISTRACTION: "Add a reranker or context filter to remove irrelevant chunks before generation.",
    VerdictEnum.HALLUCINATION: "Increase faithfulness pressure in the prompt or lower max_tokens to reduce speculation.",
    VerdictEnum.BOTH_FAILED: "Fix retrieval first; re-evaluate generation after retrieval improves.",
    VerdictEnum.PARAMETRIC_LEAK: "Flag this question for exclusion or rephrase to reduce reliance on parametric knowledge.",
    VerdictEnum.FAILED_TO_ABSTAIN: "Add an explicit abstention instruction to the generation prompt.",
}


def explain(verdict: VerdictEnum, verdict_detail: str) -> str:
    return _EXPLANATIONS.get(verdict, "")


def suggest_fix(verdict: VerdictEnum, verdict_detail: str) -> str:
    if verdict == VerdictEnum.RETRIEVAL_MISS and verdict_detail:
        return _SUGGESTIONS.get(verdict_detail, "")
    return _SUGGESTIONS.get(verdict, "")
