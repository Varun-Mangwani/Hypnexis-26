from typing import Any

from ragdoctor.config import settings
from ragdoctor.rag import generator as gen
from ragdoctor.scoring import correctness


async def run_probes(
    question: str,
    gold_answer: str,
    gold_chunks: list[dict[str, Any]],
    retrieved_chunks: list[dict[str, Any]],
    model: str,
    run_id: str | None = None,
) -> dict[str, bool]:
    gold_answer_text = await gen.generate_answer(question, gold_chunks, model, run_id)
    retrieved_answer_text = await gen.generate_answer(question, retrieved_chunks, model, run_id)
    no_context_answer = await gen.generate_answer_no_context(question, model, run_id)

    gold_correct = await correctness.score_answer_accuracy(question, gold_answer_text, gold_answer, model, run_id)
    retrieved_correct = await correctness.score_answer_accuracy(question, retrieved_answer_text, gold_answer, model, run_id)
    no_context_correct = await correctness.score_answer_accuracy(question, no_context_answer, gold_answer, model, run_id)

    return {
        "gold_context_correct": gold_correct >= settings.answer_accuracy_threshold,
        "retrieved_context_correct": retrieved_correct >= settings.answer_accuracy_threshold,
        "no_context_correct": no_context_correct >= settings.answer_accuracy_threshold,
    }
