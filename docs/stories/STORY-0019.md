# STORY-0019: Improve unit test coverage for pure utilities and service layer

## Status

CLOSED

## Type

test

## Context

STORY-0018 reset the coverage thresholds to match current actuals, unblocking CI.
Now we should progressively raise those thresholds by adding high-value, low-maintenance tests.

Three files stand out as ideal candidates:

| File                              | Current coverage | Why it is a good target                                                                                     |
| --------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/utils/dataUtils.ts`          | 0 %              | Pure function (`getLegStopTimes`) with multiple branching paths; no rendering, no I/O                       |
| `src/utils/dateUtils.ts`          | ~52 %            | Pure/deterministic helpers; uncovered branches in `getDayDifference` and `formatDisplayTime`                |
| `src/services/naviqoreService.ts` | ~48 %            | Facade class; `formatParams`, mode-switching, subscriber lifecycle, and error path testable without network |

These are exactly the kinds of tests that catch real regressions — logic bugs, edge-case silences —
without tying tests to DOM structure or Leaflet internals.

## Scope

- Add `src/utils/dataUtils.test.ts` covering all branches of `getLegStopTimes`.
- Extend `src/utils/dateUtils.test.ts` to cover `getDayDifference`, uncovered `formatDisplayTime` branches, and `inputDateToIso`.
- Add `src/services/naviqoreService.test.ts` (or extend the existing file) covering:
  - `formatParams` query string construction (arrays, nulls, undefineds)
  - `setMockMode` / `setBaseUrl` toggling
  - subscriber add/remove lifecycle (`subscribe`, `onConfigChange`)
  - `execute` error path (network failure → throws `ServiceRequestError`)
- After adding tests, raise thresholds in `vitest.config.ts` to the new measured floor (with 1 pp headroom).
- No changes to application logic.

## Acceptance Criteria

- [x] `src/utils/dataUtils.test.ts` exists and tests all major branches of `getLegStopTimes`:
  - trip is missing/empty → returns `[]`
  - exact start+end index match → returns correct slice
  - fallback to stop-id-only match (no time match)
  - `startIdx === -1` or `endIdx === -1` with fromStop/toStop available → returns synthetic two-stop array
  - `startIdx === -1` with no fromStop/toStop → returns full `stopTimes`
- [x] `dateUtils.test.ts` is extended to cover:
  - `getDayDifference` with same day, next day, and cross-midnight timezone cases
  - `formatDisplayTime` with `useStationTime = false` (zone conversion branch)
  - `inputDateToIso` round-trip
- [x] `naviqoreService.test.ts` is extended (or a focused new file added) to cover:
  - `setMockMode(true)` → provider switches, config listeners notified, log entry emitted
  - `setBaseUrl` with same URL → no listener notification (idempotent guard)
  - `subscribe` unsubscribe → subsequent calls don't reach removed listener
  - `onConfigChange` unsubscribe behaves symmetrically
  - `getScheduleInfo` with mocked provider throwing → `execute` catches and rethrows `ServiceRequestError`
- [x] `npm run test:coverage` passes with updated thresholds after new tests land.
- [x] No test uses snapshot testing, broad DOM assertions, or mocks internal implementation details
      (prefer testing observable outputs and thrown errors).

## Implementation Notes

- For `naviqoreService.ts` tests: the class is a singleton export (`naviqoreService`). Reset state
  between tests using `setMockMode(false)` / `setBaseUrl(API_BASE_URL)` in `afterEach`.
- `getLegStopTimes` is a pure function — no mocking needed, construct minimal `Leg` fixtures inline.
- For `dateUtils` timezone tests: use a fixed IANA zone (`'Europe/Zurich'`) and hardcoded ISO strings
  to make assertions deterministic regardless of where tests run.
- After all tests pass, run `npm run test:coverage` to read the new actuals, then update thresholds
  in `vitest.config.ts` (floor = measured − 1 pp, rounded down to nearest integer).

## Completion

- Date: 2026-03-10
- Outcome: All ACs satisfied. Added 8 tests for `getLegStopTimes`, 7 tests extending `dateUtils`, and 8 tests extending `naviqoreService`. Coverage thresholds raised to lines/stmts 21 %, functions 51 %, branches 67 %. Committed as `abfa498`.
- Descoped ACs: none
