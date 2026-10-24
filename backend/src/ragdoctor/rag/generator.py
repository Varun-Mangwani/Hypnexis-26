from typing import Any

from ragdoctor.config import settings
from ragdoctor.llm import client as llm


async def generate_answer(
    question: str,
    context_chunks: list[dict[str, Any]],
    model: str,
    run_id: str | None = None,
    seed: int = 42,
) -> str:
    context = "\n\n".join(c["text"] for c in context_chunks)
    prompt_path = settings.prompts_dir / "generate_answer.txt"
    template = prompt_path.read_text()
    user_content = template.format(context=context, question=question)
    messages: list[dict[str, Any]] = [
        {"role": "system", "content": "You are a precise question-answering assistant. Answer only from the provided context. If the context does not contain the answer, say 'I cannot answer this from the provided context'."},
        {"role": "user", "content": user_content},
    ]
    ans: str = await llm.complete(model=model, messages=messages, max_tokens=256, run_id=run_id)
    return ans


async def generate_answer_no_context(
    question: str,
    model: str,
    run_id: str | None = None,
) -> str:
    messages: list[dict[str, Any]] = [
        {"role": "system", "content": "Answer this question from your parametric knowledge only. Be concise."},
        {"role": "user", "content": question},
    ]
    ans: str = await llm.complete(model=model, messages=messages, max_tokens=256, run_id=run_id)
    return ans
