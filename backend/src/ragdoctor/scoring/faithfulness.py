import json
from typing import Any

from pydantic import BaseModel

from ragdoctor.llm import client as llm


class Claim(BaseModel):
    text: str
    supported: bool
    evidence_chunk_id: str | None
    span: list[int]


class FaithfulnessResult(BaseModel):
    claims: list[Claim]
    faithfulness: float


_SPLIT_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "claim_split",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "claims": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["claims"],
            "additionalProperties": False,
        },
    },
}

_VERIFY_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "claim_verify",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "results": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "claim": {"type": "string"},
                            "supported": {"type": "boolean"},
                            "evidence": {"type": "string"},
                            "chunk_id": {"type": "string"},
                        },
                        "required": ["claim", "supported", "evidence", "chunk_id"],
                        "additionalProperties": False,
                    },
                }
            },
            "required": ["results"],
            "additionalProperties": False,
        },
    },
}


def _find_span(text: str, claim: str) -> list[int]:
    idx = text.lower().find(claim.lower()[:30])
    if idx == -1:
        return [0, 0]
    return [idx, idx + len(claim)]


async def score_faithfulness(
    answer: str,
    context_chunks: list[dict[str, Any]],
    model: str,
    run_id: str | None = None,
) -> FaithfulnessResult:
    split_messages = [
        {"role": "system", "content": "Split the answer into atomic factual claims. Return JSON."},
        {"role": "user", "content": f"Answer: {answer}"},
    ]
    raw_split = await llm.complete(
        model=model,
        messages=split_messages,
        response_format=_SPLIT_SCHEMA,
        max_tokens=512,
        run_id=run_id,
    )
    try:
        claim_texts: list[str] = json.loads(raw_split).get("claims", [])
    except json.JSONDecodeError:
        claim_texts = [answer]

    if not claim_texts:
        return FaithfulnessResult(claims=[], faithfulness=1.0)

    context_text = "\n\n".join(f"[{c['chunk_id']}] {c['text']}" for c in context_chunks)
    verify_messages = [
        {
            "role": "system",
            "content": (
                "For each claim, determine if it is supported by the context. "
                "Return the exact sentence from context that supports it as 'evidence'. "
                "If not supported, evidence must be an empty string. Return JSON."
            ),
        },
        {
            "role": "user",
            "content": f"Context:\n{context_text}\n\nClaims:\n" + "\n".join(f"- {c}" for c in claim_texts),
        },
    ]
    raw_verify = await llm.complete(
        model=model,
        messages=verify_messages,
        response_format=_VERIFY_SCHEMA,
        max_tokens=1024,
        run_id=run_id,
    )
    try:
        results = json.loads(raw_verify).get("results", [])
    except json.JSONDecodeError:
        results = []

    claims = []
    for i, r in enumerate(results):
        evidence = r.get("evidence", "")
        chunk_id = r.get("chunk_id", "") or None
        ctx_texts = {c["chunk_id"]: c["text"] for c in context_chunks}
        if chunk_id and evidence:
            source_text = ctx_texts.get(chunk_id, "")
            if evidence not in source_text:
                r["supported"] = False
                chunk_id = None
                evidence = ""
        claims.append(
            Claim(
                text=r.get("claim", claim_texts[i] if i < len(claim_texts) else ""),
                supported=bool(r.get("supported", False)),
                evidence_chunk_id=chunk_id if r.get("supported") else None,
                span=_find_span(answer, r.get("claim", "")),
            )
        )

    supported_count = sum(1 for c in claims if c.supported)
    faithfulness = supported_count / len(claims) if claims else 1.0
    return FaithfulnessResult(claims=claims, faithfulness=faithfulness)
