# AGENTS.md — Instructions for AI Coding Assistants

ROLE: You are working on Dev B's half (frontend/ and desktop/) of a hackathon project.

## SCOPE
- Edit only frontend/ and desktop/. Never edit backend/ or contract/ without being told.
- API types are generated from contract/openapi.json. Never hand-write or edit src/api/schema.d.ts.
- Ask me about every unclear requirement until it is fully clear. Ask before fetching anything online.
- Ask me about design direction before building a new screen. Do not use old or generic UI patterns.

## CODE RULES
- React, Vite, TypeScript strict, functional components and hooks only.
- Feature-based folders. A feature owns its components, hooks and state.
- No comments in code. If something needs explaining, write it to docs/ in a separate file.
- No extra lines, no dead code, no unused imports, no speculative abstractions.
- Well-maintained popular libraries are fine. Do not write what a stable library already does.
- No any, no non-null assertions, no ts-ignore.
- Design tokens for colour and spacing. No hard-coded hex values in components.

## UI RULES
- Every state is designed: empty, loading (skeleton), partial, error.
- Never rely on colour alone: pair it with an icon and a text label.
- Keep all text readable from a projector (minimum 14px body).
- Keyboard navigable and visible focus states.

## DONE MEANS
- npm run build, eslint and tsc --noEmit pass. Fix all errors before replying.
- Commit when a major change is complete, using: type(scope): message.

## TESTING
- Minimal, hackathon-speed: a unit test for splitIntoSegments and one render test of the main screen against a fixture.

## SECURITY
- Basic hygiene only: no secrets in the frontend, never render API text as raw HTML.

## REPLIES
- Terse. State what changed and nothing else.
