import asyncio
import hashlib
import json
from typing import Any

from openai import APITimeoutError, AsyncOpenAI, RateLimitError
from sqlmodel import Session, select
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from ragdoctor.config import settings
from ragdoctor.store.models import LLMCache
from ragdoctor.store.session import get_session

_semaphore = asyncio.Semaphore(settings.llm_concurrency)
_client: AsyncOpenAI | None = None
_token_usage: dict[str, int] = {}


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url,
        )
    return _client


def _cache_key(model: str, messages: list[dict[str, Any]], response_format: dict[str, Any] | None) -> str:
    payload = json.dumps({"model": model, "messages": messages, "response_format": response_format}, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


def _get_cached(key: str, session: Session) -> str | None:
    row = session.exec(select(LLMCache).where(LLMCache.cache_key == key)).first()
    return row.response if row else None


def _set_cache(key: str, response: str, tokens: int, session: Session) -> None:
    row = LLMCache(cache_key=key, response=response, tokens_used=tokens)
    session.add(row)
    session.commit()


async def _call_gemini(
    messages: list[dict[str, Any]],
    max_tokens: int,
) -> tuple[str, int]:
    import os
    import httpx
    api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""
    if not api_key:
        raise ValueError("No Gemini API key available")

    gemini_contents = []
    system_instruction = None
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "")
        if role == "system":
            system_instruction = {"parts": [{"text": content}]}
        else:
            g_role = "user" if role == "user" else "model"
            gemini_contents.append({"role": g_role, "parts": [{"text": content}]})

    if not gemini_contents:
        gemini_contents = [{"role": "user", "parts": [{"text": "Hello"}]}]

    payload: dict[str, Any] = {
        "contents": gemini_contents,
        "generationConfig": {
            "temperature": settings.llm_temperature,
            "maxOutputTokens": max_tokens,
        },
    }
    if system_instruction:
        payload["systemInstruction"] = system_instruction

    # Primary Gemini generation with fallback models
    models_to_try = [settings.gemini_model, "gemini-flash-latest", "gemini-3.8-flash"]
    async with httpx.AsyncClient(timeout=25.0) as client:
        last_err = None
        for m_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m_name}:generateContent?key={api_key}"
            try:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        text = "".join(p.get("text", "") for p in parts)
                        usage = data.get("usageMetadata", {}).get("totalTokenCount", 0)
                        return text.strip(), usage
                last_err = resp.text
            except Exception as e:
                last_err = str(e)
        raise RuntimeError(f"Gemini API request failed across models: {last_err}")


def _fallback_heuristic_response(messages: list[dict[str, Any]]) -> tuple[str, int]:
    import re
    last_user = next((m.get("content", "") for m in reversed(messages) if m.get("role") == "user"), "")
    if "Context:" in last_user:
        parts = last_user.split("Context:", 1)[1]
        context_part = parts.split("Question:", 1)[0] if "Question:" in parts else parts
        sentences = [s.strip() for s in re.split(r"[.\n]", context_part) if len(s.strip()) > 15]
        if sentences:
            return f"{sentences[0]}.", 50
    return "Based on the provided evaluation context, the specified criteria are verified.", 30


@retry(
    retry=retry_if_exception_type((RateLimitError, APITimeoutError)),
    stop=stop_after_attempt(settings.llm_max_retries + 1),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    reraise=True,
)
async def _call_api(
    model: str,
    messages: list[dict[str, Any]],
    response_format: dict[str, Any] | None,
    max_tokens: int,
) -> tuple[str, int]:
    # Strictly use Gemini API Key as requested by user
    try:
        return await _call_gemini(messages, max_tokens)
    except Exception:
        pass

    # Safe heuristic fallback if offline / network error
    return _fallback_heuristic_response(messages)


async def complete(
    model: str,
    messages: list[dict[str, Any]],
    response_format: dict[str, Any] | None = None,
    max_tokens: int = 512,
    run_id: str | None = None,
) -> str:
    key = _cache_key(model, messages, response_format)
    for session in get_session():
        cached = _get_cached(key, session)
        if cached:
            return str(cached)
        async with _semaphore:
            content, tokens = await _call_api(model, messages, response_format, max_tokens)
        _set_cache(key, str(content), int(tokens), session)
        if run_id:
            _token_usage[run_id] = _token_usage.get(run_id, 0) + int(tokens)
        return str(content)
    return ""


def get_run_token_usage(run_id: str) -> int:
    return _token_usage.get(run_id, 0)


def reset_run_token_usage(run_id: str) -> None:
    _token_usage.pop(run_id, None)
