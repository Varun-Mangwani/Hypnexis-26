# DEV-B — Frontend, Product and Packaging

Project: **RAG Evaluation Pipeline — Retriever and Generator Tested Apart** (Hackathon track AI-04)

You own `frontend/` and `desktop/`. Dev A owns `backend/`. Both of you share `contract/` and `docs/`.

---

## 1. Mission

Build the single-screen dashboard that makes a hard diagnosis obvious in seconds, and package it as desktop software.

Users must be able to:

1. Upload documents or type a query.
2. Watch the evaluation run with live progress.
3. Inspect retrieved text **beside** the generated answer.
4. See colour-coded scorecards: green for accurate, red for hallucinated or missing information.
5. Read the automated root cause and fix suggestion for each failure.
6. Compare runs before and after a change.

You also own the demo corpus, the hand labels for judge calibration, the report export, the pitch deck and the demo script.

---

## 2. What you own and what you must not touch

| You own | You never edit |
|---|---|
| `frontend/**`, `desktop/**` | `backend/**` |
| `data/demo/**` (documents and hand labels) | Dev A's prompts and scoring logic |

Shared, change only with Dev A's approval in a PR: `contract/**`, `docs/DECISIONS.md`.

---

## 3. Setup

```bash
cd frontend
npm install
npm run gen:types       # generates src/api/schema.d.ts from ../contract/openapi.json
npm run dev             # Vite dev server, proxies /api to http://localhost:8000
```

Until Dev A's real pipeline is ready, the backend runs with `MOCK=1` and serves fixtures from `contract/fixtures/`. You never hand-write API types. Regenerate them whenever `contract/openapi.json` changes.

Desktop window (after the build works):

```bash
npm run build
cd ../desktop
uv sync
uv run app             # starts the backend, serves the built frontend, opens a pywebview window
```

If the webview fails on a machine, open the same local URL in a normal browser as the fallback.

---

## 4. Tech stack

| Layer | Choice |
|---|---|
| Build | React, Vite, TypeScript (strict) |
| UI | Tailwind CSS, shadcn/ui, `lucide-react` icons |
| Server state | TanStack Query |
| Client state | Zustand (selected case, filters, theme) |
| Types | `openapi-typescript` generated from the contract |
| Live progress | Native `EventSource` against the SSE endpoint |
| Charts | Recharts (gauges, bars, confusion matrix) |
| Long lists | `@tanstack/react-virtual` |
| Desktop shell | `pywebview` in `desktop/` |
| Quality | ESLint, `tsc --noEmit` |

---

## 5. Folder structure (feature-based)

```
frontend/src/
  api/            generated schema.d.ts, client, query hooks, SSE hook
  features/
    corpus/       upload and corpus summary
    run/          run config, progress, summary strip
    cases/        case list, filters
    evidence/     retrieved chunks, answer, claim highlighting
    diagnosis/    verdict badge, root-cause panel, fix suggestion
    scores/       scorecards and gauges
    compare/      before/after view
    validation/   fault-injection matrix and kappa
  components/     shared UI pieces
  lib/            colour tokens, formatters
  app.tsx
desktop/
  app.py          launcher
```

Rule: a feature folder owns its components, hooks and state. Nothing imports across features except through `components/` and `api/`.

---

## 6. The screen

One screen, three columns, no navigation tabs.

**Left column (control and cases)**

- Upload area and corpus summary
- Run configuration (chunk size, top-k, number of questions) and the Run button
- Progress bar driven by SSE events
- Case list with a colour dot per verdict, filterable by verdict and question type

**Centre column (evidence)**

- Retrieved chunks on the left, with the gold chunk badged and a relevance score
- Generated answer on the right, claim by claim
- Supported claims highlighted green, unsupported claims red
- Clicking a claim scrolls to and highlights its evidence chunk

**Right column (diagnosis)**

- Three scorecards: context relevance, faithfulness, answer accuracy
- Strip showing retriever versus generator versus end-to-end results
- Root-cause panel: verdict badge, plain-language explanation, fix suggestion
- Compare button (before/after) and a link to the validation view

Every state must be designed: empty, loading (skeletons, not spinners), partial, error, and no-results.

---

## 7. Verdict colours and meaning

| Verdict | Colour | Label |
|---|---|---|
| `PASS` | Green | Accurate |
| `RETRIEVAL_MISS` | Red | Missing information (retriever) |
| `HALLUCINATION` | Red | Hallucinated (generator) |
| `BOTH_FAILED` | Red | Both failed |
| `FAILED_TO_ABSTAIN` | Red | Should have said "not answerable" |
| `CONTEXT_DISTRACTION` | Amber | Misled by noisy context |
| `PARAMETRIC_LEAK` | Grey | Unreliable question (answerable without context) |

Never rely on colour alone. Every status also gets an icon and a text label, so the dashboard works for colour-blind users and on a projector.

---

## 8. Evidence highlighting spec

- The API gives claims with `span: [start, end]` character offsets into the answer, and `supported` plus `evidence_chunk_id`.
- Render the answer by slicing on offsets. Do not search for claim text by string match.
- Overlapping or adjacent spans must still render correctly. Write one pure function `splitIntoSegments(text, claims)` and unit test it with edge cases (overlap, empty, start or end of text).
- Gold chunk gets a badge. Retrieved-but-wrong chunks are dimmed slightly, not hidden.

---

## 9. Using the contract

- Types come from `src/api/schema.d.ts`. Never edit this file.
- Build every feature against fixtures first. If you need a new field, ask Dev A to add it to a fixture and the contract, then regenerate types.
- Case detail fields you rely on: `question`, `question_type`, `retrieved[]`, `answer`, `claims[]`, `scores`, `probes`, `verdict`, `verdict_detail`, `explanation`, `fix_suggestion`.
- Endpoints you use: `POST /api/corpora`, `POST /api/runs`, `GET /api/runs/{id}/events` (SSE), `GET /api/runs/{id}`, `GET /api/runs/{id}/cases`, `GET /api/cases/{id}`, `POST /api/query`, `POST /api/runs/{id}/compare`, `GET /api/runs/{id}/validation`, `GET /api/runs/{id}/report`.

---

## 10. Optimising the UI and the AI experience

LLM runs are slow and sometimes fail. The UI must make that feel fast and trustworthy.

1. **Never block on an LLM call.** Start the run, then stream progress. The UI stays interactive the whole time.
2. **Show results as they arrive.** Add cases to the list as the SSE stream reports them.
3. **No polling.** Use the SSE stream, with automatic reconnect and a visible "reconnecting" state.
4. **Virtualise the case list.** Hundreds of rows must scroll smoothly.
5. **Memoise highlighting.** Compute segments once per case and cache them.
6. **Fetch case detail on selection**, not for every row, and prefetch the next case on hover.
7. **Debounce filters and the query box.**
8. **Code-split charts** so the first paint is fast.
9. **Explain uncertainty.** Show the verdict detail and the fix suggestion, and mark `PARAMETRIC_LEAK` cases as excluded from headline scores.
10. **Show what the run cost.** Display token and time totals from the run summary.
11. **Offline demo mode.** A "Load cached demo run" button must work with no network and no LLM.

---

## 11. Your non-UI deliverables

| Deliverable | Details |
|---|---|
| **Demo corpus** | 3 to 5 public documents (about 30 to 60 pages total) in `data/demo/`, with different styles so retrieval is genuinely hard |
| **Hand labels** | 50 to 100 cases labelled by you for judge calibration (correct / incorrect, faithful / not), used by Dev A's kappa computation |
| **Report export** | Wire the Export button to `GET /api/runs/{id}/report` |
| **Desktop packaging** | pywebview launcher, one command to start everything |
| **Pitch** | Slides and a 3-minute demo script covering problem, workflow, architecture, live demo, fault-injection proof and impact |
| **Backup** | A recorded video of the full demo |

---

## 12. AI coding assistant instructions

Paste this block into `AGENTS.md` or `CLAUDE.md` at the repo root (or `frontend/AGENTS.md`) so Claude Code, Antigravity or any agent follows it.

```
ROLE: You are working on Dev B's half (frontend/ and desktop/) of a hackathon project.

SCOPE
- Edit only frontend/ and desktop/. Never edit backend/ or contract/ without being told.
- API types are generated from contract/openapi.json. Never hand-write or edit src/api/schema.d.ts.
- Ask me about every unclear requirement until it is fully clear. Ask before fetching anything online.
- Ask me about design direction before building a new screen. Do not use old or generic UI patterns.

CODE RULES
- React, Vite, TypeScript strict, functional components and hooks only.
- Feature-based folders. A feature owns its components, hooks and state.
- No comments in code. If something needs explaining, write it to docs/ in a separate file.
- No extra lines, no dead code, no unused imports, no speculative abstractions.
- Well-maintained popular libraries are fine. Do not write what a stable library already does.
- No any, no non-null assertions, no ts-ignore.
- Design tokens for colour and spacing. No hard-coded hex values in components.

UI RULES
- Every state is designed: empty, loading (skeleton), partial, error.
- Never rely on colour alone: pair it with an icon and a text label.
- Keep all text readable from a projector (minimum 14px body).
- Keyboard navigable and visible focus states.

DONE MEANS
- npm run build, eslint and tsc --noEmit pass. Fix all errors before replying.
- Commit when a major change is complete, using: type(scope): message.

TESTING
- Minimal, hackathon-speed: a unit test for splitIntoSegments and one render test of the main screen against a fixture.

SECURITY
- Basic hygiene only: no secrets in the frontend, never render API text as raw HTML.

REPLIES
- Terse. State what changed and nothing else.
```

---

## 13. Do's and Don'ts

**Do**

- Build against fixtures first and real data second.
- Regenerate types whenever the contract changes.
- Design the empty, loading and error states for every feature.
- Pair every colour with an icon and a label.
- Test the app on the exact laptop and projector you will present from.
- Keep a cached demo run ready and a recorded backup video.
- Rebase on `main` before opening a PR.
- Tell Dev A immediately if you need a new field.

**Don't**

- Don't edit `backend/`, `contract/openapi.json` by hand, or `src/api/schema.d.ts`.
- Don't hand-write API types.
- Don't parse or string-match claim text. Use the offsets.
- Don't render API text with `dangerouslySetInnerHTML`.
- Don't poll the API when an SSE stream exists.
- Don't hard-code colours, thresholds or verdict names. Use tokens and the generated enum.
- Don't commit `node_modules/`, `.env` or built files.
- Don't push directly to `main`.
- Don't add pages or navigation. The brief is a single screen.
- Don't leave the demo dependent on live LLM calls or the internet.

---

## 14. Git workflow

1. Branch from `main` as `b/<feature>`.
2. Commit small and often.
3. Before a PR: `git fetch && git rebase origin/main`, then run the build and the smoke test.
4. Open a PR at least daily. Dev A reviews for "does it run and match the contract".
5. Squash merge. `main` must always run.

PR checklist:

- [ ] `npm run build`, ESLint and `tsc --noEmit` pass
- [ ] Types regenerated if the contract changed
- [ ] Works against fixtures (`MOCK=1`) and against the real backend
- [ ] Empty, loading and error states checked
- [ ] No secrets or large files committed

---

## 15. Phase gates

| Phase | Your tasks | Gate |
|---|---|---|
| **P0** (together) | Repo, env, contract, fixtures | Both run the stack; contract committed |
| **P1** | App shell, three-column layout, API client, mocked screen | UI shows fixture data from the real stub server |
| **P2** | Upload flow, progress stream, case list, start demo corpus | Real document uploaded, real chunks visible |
| **P3** | Scorecards, evidence highlighting | Real scores shown, colour-coded |
| **P4** | Root-cause panel, compare view | One full run end to end, no manual steps |
| **P5** | Hand labels, validation view, report export, packaging, polish | Confusion matrix and kappa shown; app launches with one command |
| **P6** (together) | Freeze, rehearsal, pitch, backup video | Demo runs offline on cached results |

Freeze features at the start of P6. After that, bug fixes only.

---

## 16. Knowledge you must be able to explain to judges

- Why retriever and generator are evaluated separately and end to end.
- What each verdict means and what the fix suggestion says to do.
- How claim-level highlighting works and where the evidence comes from.
- The three counterfactual probes (gold, retrieved, no context) at a high level.
- What fault injection and judge calibration prove.
- How the UI stays responsive while LLM calls run.

Teach Dev A the frontend at P4 in a 20-minute walkthrough, and write the key points into `docs/ARCHITECTURE.md`.
