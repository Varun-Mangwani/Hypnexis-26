import os

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture
def mock_env(monkeypatch):
    monkeypatch.setenv("MOCK", "1")
    monkeypatch.setenv("LLM_API_KEY", "test-key")


@pytest.mark.asyncio
async def test_api_corpora_mock(mock_env):
    os.environ["MOCK"] = "1"
    from ragdoctor.api.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        import io
        content = b"test document content for RAG evaluation"
        response = await client.post(
            "/api/corpora",
            files={"file": ("test.txt", io.BytesIO(content), "text/plain")},
        )
    assert response.status_code == 200
    data = response.json()
    assert "corpus_id" in data
    assert "chunk_count" in data


@pytest.mark.asyncio
async def test_api_runs_mock(mock_env):
    os.environ["MOCK"] = "1"
    from ragdoctor.api.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/runs",
            json={"corpus_id": "corp_demo_001", "num_questions": 5},
        )
    assert response.status_code == 200
    data = response.json()
    assert "run_id" in data
    assert data["status"] in ("pending", "running", "complete")


@pytest.mark.asyncio
async def test_api_cases_mock(mock_env):
    os.environ["MOCK"] = "1"
    from ragdoctor.api.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/runs/run_demo_001/cases")
    assert response.status_code == 200
    cases = response.json()
    assert isinstance(cases, list)
    assert len(cases) > 0
    case = cases[0]
    assert "id" in case
    assert "verdict" in case
    assert "gold_chunk_ids" in case
    assert "probes" in case
    assert "claims" in case
    assert "fix_suggestion" in case


@pytest.mark.asyncio
async def test_api_validation_mock(mock_env):
    os.environ["MOCK"] = "1"
    from ragdoctor.api.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/runs/run_demo_001/validation")
    assert response.status_code == 200
    data = response.json()
    assert "confusion_matrix" in data
    assert "judge_kappa" in data
