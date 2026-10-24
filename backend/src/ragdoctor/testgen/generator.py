import json
from typing import Any

from ragdoctor.config import settings
from ragdoctor.llm import client as llm

_QA_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "qa_pair",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "question": {"type": "string"},
                "answer": {"type": "string"},
                "question_type": {
                    "type": "string",
                    "enum": ["factoid", "numeric", "multi_hop", "paraphrased", "unanswerable"],
                },
            },
            "required": ["question", "answer", "question_type"],
            "additionalProperties": False,
        },
    },
}

_BATCH_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "qa_batch",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "pairs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "question": {"type": "string"},
                            "answer": {"type": "string"},
                            "question_type": {
                                "type": "string",
                                "enum": ["factoid", "numeric", "multi_hop", "paraphrased", "unanswerable"],
                            },
                        },
                        "required": ["question", "answer", "question_type"],
                        "additionalProperties": False,
                    },
                }
            },
            "required": ["pairs"],
            "additionalProperties": False,
        },
    },
}


async def generate_questions_for_chunk(
    chunk: dict[str, Any],
    model: str,
    n: int = 3,
    run_id: str | None = None,
) -> list[dict[str, Any]]:
    prompt_path = settings.prompts_dir / "generate_questions.txt"
    template = prompt_path.read_text()
    user_content = template.format(text=chunk["text"], n=n)
    messages = [
        {
            "role": "system",
            "content": (
                "Generate diverse question-answer pairs from the provided text. "
                "Include a mix of factoid, numeric, multi_hop, paraphrased, and unanswerable types. "
                "Return JSON."
            ),
        },
        {"role": "user", "content": user_content},
    ]
    raw = await llm.complete(
        model=model,
        messages=messages,
        response_format=_BATCH_SCHEMA,
        max_tokens=1024,
        run_id=run_id,
    )
    try:
        pairs = json.loads(raw).get("pairs", [])
    except json.JSONDecodeError:
        return []
    return [
        {
            "question": p["question"],
            "answer": p["answer"],
            "question_type": p["question_type"],
            "gold_chunk_ids": [chunk["chunk_id"]],
        }
        for p in pairs
    ]
