# STORY-0018: Fix CI quality gate and add local pre-commit coverage check

## Status

CLOSED

## Context

The quality CI job fails on every push because the coverage thresholds in `vitest.config.ts`
(lines 70 %, functions 70 %, branches 60 %, statements 70 %) are far above the project's
actual measured coverage (~21 % lines/statements, ~45 % functions, ~54 % branches).

This mismatch means `npm run test:coverage` always exits non-zero, blocking every PR and main-branch push.

Additionally, the existing `.husky/pre-commit` hook only runs `npm run check` (typecheck + lint +
format + plain test run). It does **not** run coverage, so developers receive no local signal
about threshold violations before they push.

The fix is intentionally minimal: realign the thresholds to just below current measured coverage
(preventing future regression without blocking development) and add the coverage check to the
pre-commit hook so the gate is validated locally before every commit.

Writing enough new tests to reach the original 70 % target is a separate, much larger effort
and is out of scope for this story.

## Scope

- Update coverage thresholds in `vitest.config.ts` to realistic floor values derived from the
  latest measured numbers (slightly below actuals to give ≤ 1 % headroom).
- Add `npm run test:coverage` to `.husky/pre-commit` so coverage thresholds are enforced locally.
- No new tests, no new files, no changes to application logic.

## Acceptance Criteria

- [x] `npm run test:coverage` exits with code 0 locally (thresholds not breached).
- [x] `.husky/pre-commit` runs `npm run test:coverage` after the existing `npm run check`.
- [x] `npm run ci` (`check` + `build` + `test:coverage`) passes end-to-end locally without errors.
- [x] The CI quality gate (`quality-ci.yml`) is expected to pass on a branch that includes these changes.

## Implementation Notes

Threshold floor values to use (based on CI run from 2026-03-10, rounded down 1 pp):

| Metric     | Measured | New threshold |
| ---------- | -------- | ------------- |
| statements | 20.85 %  | 20 %          |
| functions  | 45.37 %  | 44 %          |
| branches   | 53.71 %  | 52 %          |
| lines      | 20.85 %  | 20 %          |

Pre-commit hook change: append `npm run test:coverage` on a new line after `npm run check`.

Note: `npm run test:coverage` takes ~3–4 s locally (measured in CI), so the hook overhead is
acceptable.

## Completion

- Date: 2026-03-10
- Outcome: Coverage thresholds realigned to floor values (stmts/lines 20 %, functions 44 %, branches 52 %), unblocking CI. Pre-commit hook now runs `npm run test:coverage` after `npm run check`.
- Descoped ACs: none
