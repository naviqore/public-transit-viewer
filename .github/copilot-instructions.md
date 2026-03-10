# Copilot Workspace Instructions

This repository is a production Vite + React + TypeScript frontend.

## Engineering priorities

- Keep changes minimal, focused, and easy to review.
- Preserve strict typing. Do not introduce `any` unless absolutely unavoidable.
- Prefer explicit, descriptive naming over comments.
- Keep documentation minimal and practical; document intent/decisions, not obvious code behavior.
- Add inline comments only when logic is not self-explanatory.
- Keep component and hook logic separated when a block becomes hard to read.
- Avoid broad refactors unless the task explicitly asks for them.
- Follow SOLID principles in architecture decisions.
- Keep implementations DRY and KISS.
- Keep components small and focused; extract reusable logic into hooks/utils/services when repeated.
- Maintain separation of concerns:
  - UI rendering in components
  - orchestration/state in hooks/contexts
  - I/O and API calls in `src/services`
  - pure transforms/formatting in `src/utils`

## Quality gate

`npm run ci` is the single canonical gate — typecheck → lint → format → build → tests with
coverage. Identical locally (pre-commit hook) and in remote CI.

- **Humans:** `git commit` triggers the gate automatically via the pre-commit hook.
- **Agents:** run `npm run ci` to validate and surface results, then commit with
  `HUSKY=0 git commit` to avoid re-running the same gate (intentional deduplication, not a
  bypass). Use a terminal timeout of at least 120 s for `npm run ci`.
- Add or update tests for changed business logic (`src/services`, `src/utils`, important hooks).

## Test stack

- `Vitest` + `@testing-library/react` + `jsdom` + `@testing-library/jest-dom`.
- Co-locate tests as `*.test.ts` / `*.test.tsx` near source files.
- Reuse shared setup from `src/test/setup.ts`.
- Keep tests focused on behavior and business logic, not implementation details.
- Prefer small, fast unit tests; add integration tests only when multiple parts interact.

## Project conventions

- React function components and hooks only.
- Co-locate tests as `*.test.ts` or `*.test.tsx` near source files.
- Use Prettier defaults from `.prettierrc` and lint rules from `eslint.config.js`.
- Use existing app architecture: contexts in `src/contexts`, API access in `src/services`, reusable UI in `src/components/common`.

## AI-agent workflow in this repository

- Start by reading the impacted files and existing patterns.
- Explain assumptions when requirements are ambiguous.
- Prefer incremental commits/patches over one massive rewrite.
- If changing docs or setup, keep `README.md`, `.github/`, and scripts in sync.
- Reusable chat prompt templates are stored in `.github/prompts/*.prompt.md`.

## Commit and Release Workflow

- This repository uses Conventional Commits and Release Please.
- Commit format: `<type>(<scope>): <subject>`.
- Allowed commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Use `!` or `BREAKING CHANGE:` footer for breaking changes.
- Keep commits atomic and focused to improve changelog quality.
- Every commit body line must be ≤ 100 characters (`body-max-line-length` commitlint rule).
- Releases are managed by `.github/workflows/release-please.yml` and parsed from commit history.
- Keep git author identity as the user's configured name/email.
- For commits created by an AI agent, add a commit-message trailer for transparency: `Generated-by: GitHub Copilot (<actual model name>)`.

Examples:

- `feat(explore): add stop scope selector`
- `fix(map): prevent map jump during stop swap`
- `chore(ci): add commitlint workflow`

## Story Workflow (Agent-Friendly)

- Use `docs/stories/INDEX.md` as the local source of truth for story status in this repo.
- Story IDs must be sequential (`STORY-0001`, `STORY-0002`, ...).
- Always pick the highest-numbered story marked `OPEN` unless explicitly directed otherwise.
- Story-first rule for new features:
  - if no story exists, write/update story docs first and stop for user review before implementation
  - do not start coding a new feature until the user approves the story text
- Acceptance criteria (AC) notation:
  - `- [ ]` — not yet done; **blocks closure**
  - `- [x]` — satisfied and verified during implementation
  - `- [~]` — intentionally descoped or deferred; **must** include a written justification in the Completion section
  - An agent must never check `- [x]` without having actually satisfied the criterion.
  - An agent must never mark `- [~]` without asking the user for explicit approval for each individual AC being descoped.
- For each implementation PR/commit series:
  - reference the story ID in commit scope or footer (example: `Refs: STORY-0007`)
  - set status to `IN_PROGRESS` when implementation starts
  - check each AC as `- [x]` in the story file **as it is satisfied** during implementation
  - run `npm run ci` (see Quality gate), present results, proposed commit message, and ask once:
    _"Do you want me to commit and close the story?"_
  - wait for explicit user approval before committing
  - on approval: `HUSKY=0 git commit` for the implementation commit
  - then a separate `docs(stories):` commit: set status `CLOSED`, change the story row in
    `docs/stories/INDEX.md` to `CLOSED`, add completion date and short outcome note
  - a story may only be closed when every AC is either `- [x]` or `- [~]`; if any `- [ ]`
    remain, ask the user whether to satisfy, descope (`- [~]`), or block closure
