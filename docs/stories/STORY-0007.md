# STORY-0007: Enable strict typing cleanup slice

## Status

OPEN

## Context

The project targets strict TypeScript usage, but some local `any` usage remains and weakens maintainability.

## Scope

- Verify strictness settings in `tsconfig.json` (including `noImplicitAny`).
- Replace `any` in `DomainContext` and adjacent touched types/state with explicit types.
- Keep this story to a small cleanup slice, not full-codebase migration.

## Acceptance Criteria

- [ ] `noImplicitAny` is enabled (directly or via `strict`).
- [ ] No `any` remains in the targeted `DomainContext` slice.
- [ ] `npm run check` passes.

## Implementation Notes

Use narrow interfaces and existing domain types; do not introduce broad `unknown as` casts.

## Completion

- Date:
- Outcome:
