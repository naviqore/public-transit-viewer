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

## Required checks before handoff

- Run `npm run check` for every non-trivial change.
- Run `npm run build` when changing build/tooling/runtime behavior.
- Add or update tests for changed business logic (`src/services`, `src/utils`, important hooks).

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

## Commit and Release Workflow

- This repository uses Conventional Commits and Release Please.
- Commit format: `<type>(<scope>): <subject>`.
- Allowed commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Use `!` or `BREAKING CHANGE:` footer for breaking changes.
- Keep commits atomic and focused to improve changelog quality.
- Releases are managed by `.github/workflows/release-please.yml` and parsed from commit history.
- Keep git author identity as the user's configured name/email.
- For commits created by an AI agent, add a commit-message trailer for transparency: `Generated-by: GitHub Copilot (GPT-5.3-Codex)`.

Examples:

- `feat(explore): add stop scope selector`
- `fix(map): prevent map jump during stop swap`
- `chore(ci): add commitlint workflow`

## Story Workflow (Agent-Friendly)

- Use `docs/stories/INDEX.md` as the local source of truth for story status in this repo.
- Story IDs must be sequential (`STORY-0001`, `STORY-0002`, ...).
- Always pick the highest-numbered story marked `OPEN` unless explicitly directed otherwise.
- For each implementation PR/commit series:
  - reference the story ID in commit scope or footer (example: `Refs: STORY-0007`)
  - update story status from `OPEN` to `CLOSED` when completed
  - add completion date and short outcome note
