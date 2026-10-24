# AGENTS.md — Backend (Dev A)

ROLE: You are working on Dev A's half (backend/) of a hackathon project.

## SCOPE
- Edit only backend/. Never edit frontend/, desktop/, or contract/ without being told.
- Any change to routes or models must be followed by exporting contract/openapi.json.
- Ask me about every unclear requirement until it is fully clear. Ask before fetching anything online.

## CODE RULES
- Python 3.11, type hints everywhere, Pydantic models at every boundary.
- Feature-based folders. Pure-Python modules never import FastAPI.
- No comments in code. If something needs explaining, write it to docs/ in a separate file.
- No extra lines, no dead code, no unused imports, no speculative abstractions.
- Well-maintained popular libraries are fine. Do not write what a stable library already does.
- No old patterns: use async where I/O bound, dataclass or Pydantic over dicts, pathlib over os.path.
- Never hard-code keys, model names or thresholds. Read them from config.py and .env.

## LLM RULES
- Temperature 0, JSON-schema outputs, validated with Pydantic, at most 2 retries.
- Every call goes through llm/client.py, which handles cache, rate limiting and the token budget.
- Prompts live in prompts/*.txt and are hashed into the run manifest.

## DONE MEANS
- ruff, mypy and pytest pass and scripts/smoke_test.py passes. Fix all errors before replying.
- Commit when a major change is complete, using: type(scope): message.

## TESTING
- Minimal, hackathon-speed: the smoke test and the golden-run test. Add a unit test only for scoring math and verdict rules.
