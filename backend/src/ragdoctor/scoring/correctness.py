import json

from ragdoctor.llm import client as llm

_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "answer_accuracy",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "correct": {"type": "boolean"},
                "reason": {"type": "string"},
            },
            "required": ["correct", "reason"],
            "additionalProperties": False,
        },
    },
}


async def score_answer_accuracy(
    question: str,
    answer: str,
    gold_answer: str,
    model: str,
    run_id: str | None = None,
) -> float:
    messages = [
        {
            "role": "system",
            "content": (
                "Judge whether the candidate answer is semantically equivalent to the gold answer. "
                "Minor wording differences are OK. Return JSON."
            ),
        },
        {
            "role": "user",
            "content": f"Question: {question}\nGold answer: {gold_answer}\nCandidate: {answer}",
        },
    ]
    raw = await llm.complete(model=model, messages=messages, response_format=_SCHEMA, max_tokens=128, run_id=run_id)
    try:
        data = json.loads(raw)
        return 1.0 if data.get("correct") else 0.0
    except json.JSONDecodeError:
        return 0.0
