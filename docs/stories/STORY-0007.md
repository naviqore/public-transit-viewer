# STORY-0007: Enable strict typing cleanup slice

## Status

CLOSED

## Type

refactor

## Context

The project targets strict TypeScript usage, but some local `any` usage remains and weakens maintainability.

## Scope

- Verify strictness settings in `tsconfig.json` (including `noImplicitAny`).
- Replace `any` in `DomainContext` and adjacent touched types/state with explicit types.
- Keep this story to a small cleanup slice, not full-codebase migration.

## Acceptance Criteria

- [x] `noImplicitAny` is enabled (directly or via `strict`).
- [x] No `any` remains in the targeted `DomainContext` slice.
- [x] `npm run check` passes.

## Implementation Notes

Use narrow interfaces and existing domain types; do not introduce broad `unknown as` casts.

## Completion

- Date: 2026-03-06
- Outcome: Explicit `DomainContext` state types were centralized in `src/types.ts`, context typing was cleaned up, and a focused `DomainContext` test was added; `npm run test:run` and `npm run check` passed.
