# AGENTS.md

Instructions for every AI coding agent working in this repository (Claude, Claude Code, Antigravity, Ollama models). Follow all rules. Rules marked NEVER have no exceptions.

## Mission

Build real-world, purpose-driven hackathon projects. Production-grade quality at hackathon speed. These rules apply to every language and stack.

## Hackathon Mode

- Before coding, confirm three things: the problem, the target user, and the core flow.
- Build the happy-path demo first. Then add features in order of demo impact.
- Cut or defer anything that does not improve the demo or the core flow.
- Keep the demo path working at all times. NEVER leave the project in a broken state between tasks.
- Provide realistic seed data so the demo never shows empty screens.
- Deploy early and keep the deployed version working.

## Workflow

1. **Clarify first.** Sort every unclear point into one of two kinds:
   - **Blocking** (changes behavior, data, architecture, or scope): ask in one numbered batch. Write no code until answered.
   - **Cosmetic** (labels, spacing, minor wording): decide, then state the assumption in one line.
2. **Ask before going online.** Any fetch (docs, APIs, assets, web search) needs the user's permission first. Installing a dependency the user has already approved needs no further permission.
3. **Plan briefly.** List the files to create or change, then implement. Touch only the files the task requires.
4. **Verify before reporting.**
   - Run build, lint and type-check. Fix every error.
   - Run the app and confirm the changed flow works end to end.
   - Report only after both pass.
5. **Stuck rule.** If the same error survives two fix attempts, stop. Report the error, what was tried, and the likely cause. NEVER loop or guess.

## Code Quality

- Write the minimum code that fully solves the task.
- NEVER leave dead code, unused imports or variables, commented-out code, debug logs, placeholder TODOs, or speculative features.
- NEVER write comments in code. Names, structure and types carry the meaning. The only exception is a directive a tool requires (for example `eslint-disable` or `# type: ignore`), and it must be as narrow as possible.
- Read existing code first. Match its conventions. Reuse before creating. NEVER duplicate logic.
- Keep functions small and single-purpose. Use early returns. Avoid deep nesting.
- Handle errors at boundaries. NEVER swallow errors silently. Validate all external input.
- Use current, stable language and framework APIs. NEVER use deprecated or legacy patterns.
- NEVER invent APIs, packages, flags, or options. If unsure, ask.

## Architecture

- Simple modular structure with feature-based folders. Each feature owns its UI, logic, data access and types.
- Code goes in `shared/` only when two or more features use it.
- Keep layers one-directional: UI, then logic, then data. No circular dependencies.
- No abstraction, pattern, or layer without a present need.
- Config and secrets come from environment variables.
- Dependencies: well-maintained, popular libraries are fine. Prefer one solid library over several. NEVER add a dependency for trivial code.

## UI and Design

- Before building any UI, ask for the design direction: style, palette, typography, references.
- Modern only. NEVER use these dated patterns:
  - heavy gradients or stacked drop shadows
  - cluttered layouts with no clear hierarchy
  - default unstyled browser or framework components
  - generic template-looking hero sections
  - emoji as icons (use a proper icon set)
  - inconsistent spacing, radii, or font sizes
- Define design tokens once (colors, type scale, spacing, radius, shadows) and use only those.
- Mobile-first and responsive.
- Accessible: semantic HTML, labelled inputs, visible focus states, AA contrast, full keyboard navigation.
- Every data view handles loading, empty and error states.
- Motion is restrained and purposeful.

## Security (basic hygiene)

- NEVER put secrets in code or git. Use `.env`, commit `.env.example`, and keep `.env` in `.gitignore`.
- Sanitize user input. Use parameterized queries. NEVER use `eval` or equivalents.
- If the project handles authentication, payments, or personal data, ask the user before implementing it.

## Testing

- Keep it minimal. Speed comes first.
- Add tests only for risky core logic or when the user asks.

## Documentation

- Maintain `docs/UNDERSTANDING.md` in plain language: architecture overview, feature map, data flow, key decisions, how to run. Update it whenever structure or behavior changes.
- Maintain a `README.md` with setup, run commands and required environment variables.

## Git

- Commit when a major change is complete (a feature, refactor, or milestone).
- Use conventional commits: `type(scope): summary`.
- NEVER commit a failing build, secrets, or generated artifacts. NEVER force push.

## Replies

- Be terse. Report what changed (file plus one line each) and any decision needed from the user.
- No preamble, recap, praise, or explanation unless asked.
- During the clarification step, questions are the whole reply.

## Context Discipline

At the start of every task, re-read **Hackathon Mode**, **Workflow**, and the NEVER rules. If context is running low, summarize progress into `docs/UNDERSTANDING.md` before continuing.
