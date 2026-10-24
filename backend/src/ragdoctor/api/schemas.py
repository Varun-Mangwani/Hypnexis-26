
from typing import Any

from pydantic import BaseModel

from ragdoctor.store.models import QuestionTypeEnum, RunStatusEnum, VerdictEnum


class CorpusCreate(BaseModel):
    pass


class ChunkSchema(BaseModel):
    chunk_id: str
    corpus_id: str
    text: str
    char_start: int
    char_end: int
    token_count: int | None = None
    embedding_hash: str = ""


class CorpusResponse(BaseModel):
    corpus_id: str
    filename: str
    chunk_count: int
    created_at: str
    file_hash: str
    name: str | None = None
    document_count: int = 1
    total_chunks: int = 0
    total_tokens: int = 0
    avg_chunk_size: int = 512
    file_size_bytes: int | None = None
    chunks: list[ChunkSchema] = []


class RunCreate(BaseModel):
    corpus_id: str
    num_questions: int = 50
    top_k: int = 5
    generator_model: str | None = None
    judge_model: str | None = None
    chunk_size: int | None = None


class RunResponse(BaseModel):
    run_id: str
    corpus_id: str
    status: RunStatusEnum
    created_at: str
    completed_at: str | None = None
    num_questions: int
    tokens_used: int
    config_hash: str
    scores: dict[str, Any]
    manifest: dict[str, Any]
    verdict_distribution: dict[str, int]
    id: str | None = None
    corpus_name: str | None = None
    total_cases: int = 0
    processed_cases: int = 0
    token_usage: int = 0
    component_scores: dict[str, Any] = {}
    latency_ms: int = 0
    cost_estimate_usd: float = 0.0
    finished_at: str | None = None


class ClaimSchema(BaseModel):
    text: str
    supported: bool
    evidence_chunk_id: str | None = None
    span: list[int] = [0, 0]
    claim_id: str | None = None


class RetrievedChunkSchema(BaseModel):
    chunk_id: str
    score: float
    text: str
    is_gold: bool = False
    doc_name: str | None = None


class CaseResponse(BaseModel):
    id: str
    question: str
    question_type: str
    gold_answer: str = ""
    gold_chunk_ids: list[str] = []
    retrieved: list[RetrievedChunkSchema]
    answer: str
    claims: list[ClaimSchema]
    scores: dict[str, Any]
    probes: dict[str, Any]
    verdict: VerdictEnum | None = None
    verdict_detail: str = ""
    explanation: str = ""
    fix_suggestion: str = ""
    run_id: str | None = None


class CasesFilter(BaseModel):
    verdict: VerdictEnum | None = None
    question_type: str | None = None


class QueryRequest(BaseModel):
    corpus_id: str
    question: str
    top_k: int = 5


class QueryResponse(BaseModel):
    question: str
    retrieved: list[RetrievedChunkSchema]
    answer: str
    scores: dict[str, Any]


class CompareRequest(BaseModel):
    settings_override: dict[str, Any] = {}
    baseline_run_id: str | None = None


class CompareResponse(BaseModel):
    before: dict[str, Any]
    after: dict[str, Any]
    delta: dict[str, Any]
    run_a_id: str | None = None
    run_b_id: str | None = None
    delta_scores: dict[str, Any] = {}
    improved_cases_count: int = 4
    regressed_cases_count: int = 1
    unchanged_cases_count: int = 15


class ValidationResponse(BaseModel):
    run_id: str
    confusion_matrix: dict[str, Any]
    judge_kappa: float
    judge_kappa_interpretation: str
    hand_labeled_count: int
    judge_labeled_count: int
    cohen_kappa: float | None = None
    calibration_verdict: str | None = None

