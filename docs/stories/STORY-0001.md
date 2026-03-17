# STORY-0001: Bootstrap story workflow and templates

## Status

CLOSED

## Type

chore

## Context

This story bootstrapped the repository from a Python/Streamlit-oriented setup into a production-ready Vite + React + TypeScript frontend workflow, with quality gates, release automation, and an agent-friendly story process.

## Scope

- Establish the React/Vite/TypeScript project baseline and remove legacy Python app packaging/runtime files.
- Add modern quality tooling and scripts (typecheck, lint, format, tests, CI-friendly check command).
- Add lean modern test baseline (`Vitest` + Testing Library + `jsdom`) and initial tests.
- Add Conventional Commits enforcement and Release Please workflows.
- Add local story management docs (`docs/stories/INDEX.md`, template, and starter story files).
- Add/align AI instructions for architecture, coding style, minimal documentation, and story-first workflow with review gates.

## Acceptance Criteria

- [x] Frontend baseline is Vite + React + TypeScript with runnable scripts in `package.json`.
- [x] Legacy Python/Streamlit project files are removed from active runtime path.
- [x] Quality pipeline exists locally (`npm run check`) and in CI workflows.
- [x] Test stack is configured (`vitest.config.ts`, `src/test/setup.ts`) with initial tests passing.
- [x] Conventional commit checks are enforced locally/CI (`commitlint`, Husky, workflow).
- [x] Release Please workflow is configured for automated release parsing.
- [x] Story docs/process are present and usable by agents.
- [x] Agent workflow requires story-first planning, user review before implementation for new features, lean acceptance-criteria testing, and commit approval gate.

## Implementation Notes

- Scope covered multiple setup commits over the migration window; this story records final baseline state.
- Existing lint warning baseline remains and is intentionally tracked as follow-up work, not a blocker for setup completion.

## Completion

- Date: 2026-03-06
- Outcome: Full project bootstrap completed. Repository now uses a modern frontend toolchain with deterministic story-driven agent workflow, release automation, and lean testing standards.
