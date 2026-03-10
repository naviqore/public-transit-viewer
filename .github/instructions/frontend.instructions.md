---
applyTo: 'src/**/*.{ts,tsx,css}'
description: 'Frontend implementation guidance for React/TypeScript code in this repository'
---

# Frontend Implementation Notes

- Favor composition over deeply nested components.
- Keep UI state local unless multiple pages/features need it.
- Use existing utility functions (`src/utils`) before adding new helpers.
- Validate date/time handling with timezone-aware helpers in `src/utils/dateUtils.ts`.
- Keep map interactions deterministic: avoid hidden side effects in render paths.
- For monitoring/benchmark screens, optimize for responsiveness under frequent updates.
- Follow SOLID, DRY, and KISS when adding or refactoring frontend code.
- Keep code documentation minimal; prefer self-explanatory names and structure.
- Use inline comments only for non-obvious intent or constraints.
- Keep components small and single-purpose:
  - split when a component owns unrelated responsibilities
  - extract reusable UI primitives into `src/components/common`
  - extract shared behavior into hooks in `src/hooks`
- Prefer pure utility functions for transformation logic; avoid embedding complex transforms in JSX.
- Keep effects focused: one concern per `useEffect` where practical.
- Keep props explicit and narrowly typed; avoid large opaque prop objects.

When changing behavior:

- Update unit tests for utility/service logic first.
- Then update component behavior and snapshot expectations only if needed.

Testing conventions for frontend work:

- Use `Vitest` and Testing Library as the default.
- For UI tests, assert visible behavior and interactions (not class names or internal state).
- Keep tests deterministic: mock time/network where needed.
- Keep tests small and story-scoped; avoid broad end-to-end style tests in unit suites.
- For story-driven work, validate changed acceptance criteria with lean tests before asking for commit approval.
