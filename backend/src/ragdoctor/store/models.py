from datetime import UTC, datetime
from enum import StrEnum

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(UTC)


class VerdictEnum(StrEnum):
    PASS = "PASS"
    RETRIEVAL_MISS = "RETRIEVAL_MISS"
    CONTEXT_DISTRACTION = "CONTEXT_DISTRACTION"
    HALLUCINATION = "HALLUCINATION"
    BOTH_FAILED = "BOTH_FAILED"
    PARAMETRIC_LEAK = "PARAMETRIC_LEAK"
    FAILED_TO_ABSTAIN = "FAILED_TO_ABSTAIN"


class QuestionTypeEnum(StrEnum):
    FACTOID = "factoid"
    FACTUAL = "factual"
    NUMERIC = "numeric"
    MULTI_HOP = "multi_hop"
    MULTI_HOP_HYPHEN = "multi-hop"
    PARAPHRASED = "paraphrased"
    UNANSWERABLE = "unanswerable"


class RunStatusEnum(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETE = "complete"
    COMPLETED = "completed"
    FAILED = "failed"


class Corpus(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    corpus_id: str = Field(unique=True, index=True)
    filename: str
    created_at: datetime = Field(default_factory=utc_now)

    chunk_count: int = 0
    file_hash: str = ""


class Chunk(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    chunk_id: str = Field(unique=True, index=True)
    corpus_id: str = Field(index=True)
    text: str
    char_start: int
    char_end: int
    page: int | None = None
    embedding_hash: str = ""


class Run(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    run_id: str = Field(unique=True, index=True)
    corpus_id: str
    status: RunStatusEnum = RunStatusEnum.PENDING
    config_hash: str = ""
    manifest: str = "{}"
    created_at: datetime = Field(default_factory=utc_now)
    completed_at: datetime | None = None
    num_questions: int = 0
    tokens_used: int = 0
    scores: str = "{}"


class TestCase(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    case_id: str = Field(unique=True, index=True)
    run_id: str = Field(index=True)
    question: str
    question_type: str = Field(default="factual")
    gold_answer: str = ""
    gold_chunk_ids: str = "[]"
    retrieved: str = "[]"
    answer: str = ""
    claims: str = "[]"
    scores: str = "{}"
    probes: str = "{}"
    verdict: VerdictEnum | None = None
    verdict_detail: str = ""
    explanation: str = ""
    fix_suggestion: str = ""


class LLMCache(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    cache_key: str = Field(unique=True, index=True)
    response: str
    created_at: datetime = Field(default_factory=utc_now)
    tokens_used: int = 0

