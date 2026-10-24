import difflib
import json
from typing import Any, cast

from ragdoctor.llm import client as llm

_DERIVABLE_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "derivability_check",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "derivable": {"type": "boolean"},
                "closed_book_answerable": {"type": "boolean"},
            },
            "required": ["derivable", "closed_book_answerable"],
            "additionalProperties": False,
        },
    },
}


def _is_near_duplicate(q1: str, q2: str, threshold: float = 0.85) -> bool:
    ratio = difflib.SequenceMatcher(None, q1.lower(), q2.lower()).ratio()
    return ratio >= threshold


def _is_lexical_copy(question: str, source_text: str, threshold: float = 0.7) -> bool:
    words_q = set(question.lower().split())
    words_s = set(source_text.lower().split())
    if not words_q:
        return False
    overlap = len(words_q & words_s) / len(words_q)
    return overlap >= threshold


async def verify_question(
    question: str,
    answer: str,
    source_text: str,
    model: str,
    run_id: str | None = None,
) -> dict[str, Any]:
    messages: list[dict[str, Any]] = [
        {
            "role": "system",
            "content": (
                "Check if the answer is derivable from the source text and if the question "
                "is answerable without context (from parametric knowledge). Return JSON."
            ),
        },
        {
            "role": "user",
            "content": f"Source:\n{source_text}\n\nQuestion: {question}\nAnswer: {answer}",
        },
    ]
    raw = await llm.complete(
        model=model,
        messages=messages,
        response_format=_DERIVABLE_SCHEMA,
        max_tokens=128,
        run_id=run_id,
    )
    try:
        parsed: Any = json.loads(raw)
        if isinstance(parsed, dict):
            return cast(dict[str, Any], parsed)
        return {"derivable": True, "closed_book_answerable": False}
    except json.JSONDecodeError:
        return {"derivable": True, "closed_book_answerable": False}


def filter_questions(questions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: list[str] = []
    filtered = []
    for q in questions:
        text = q["question"]
        if any(_is_near_duplicate(text, s) for s in seen):
            continue
        seen.append(text)
        filtered.append(q)
    return filtered
