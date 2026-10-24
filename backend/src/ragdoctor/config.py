import os
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_REPO_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    llm_base_url: str = "https://api.openai.com/v1"
    llm_api_key: str = Field(default="", alias="LLM_API_KEY")
    llm_generator_model: str = "gpt-4o-mini"
    llm_judge_model: str = "gpt-4o"

    gemini_api_key: str = Field(
        default="",
        alias="GEMINI_API_KEY",
    )
    gemini_model: str = "gemini-flash-latest"

    mock_mode: bool = Field(default=False, alias="MOCK")

    @property
    def mock(self) -> bool:
        env_val = os.environ.get("MOCK")
        if env_val is not None:
            return env_val.strip().lower() in ("1", "true", "yes")
        return self.mock_mode

    @mock.setter
    def mock(self, val: bool) -> None:
        self.mock_mode = val

    database_url: str = f"sqlite:///{(_REPO_ROOT / 'data' / 'ragdoctor.db').as_posix()}"
    embed_model: str = "BAAI/bge-small-en-v1.5"

    max_upload_bytes: int = 52_428_800
    allowed_mime_types: list[str] = ["application/pdf", "text/plain", "text/markdown"]

    chunk_size: int = 512
    chunk_overlap: int = 64

    retrieval_top_k: int = 5
    retrieval_hybrid_alpha: float = 0.5

    faithfulness_threshold: float = 0.5
    answer_accuracy_threshold: float = 0.5

    llm_concurrency: int = 4
    llm_max_retries: int = 2
    llm_temperature: float = 0.0
    token_budget_per_run: int = 500_000

    data_dir: Path = _REPO_ROOT / "data"
    fixtures_dir: Path = _REPO_ROOT / "contract" / "fixtures"
    prompts_dir: Path = Path(__file__).resolve().parent / "prompts"


settings = Settings()
