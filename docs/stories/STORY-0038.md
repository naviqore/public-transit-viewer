# STORY-0038: Show staleness indicator for cached query results

## Status

CLOSED

## Type

feat

## Context

The `lastQueriedKey` guard prevents redundant backend calls when navigating
back to a page with unchanged inputs. However, there is no feedback to the user
that the displayed results may be old (e.g., departures fetched 30 minutes
ago). For a live transit tool, stale departure boards are actively misleading.

## Scope

- Track a `queriedAt: Date | null` timestamp alongside `lastQueriedKey` in each
  page state (Explore, Connect, Isoline).
- Display a subtle staleness badge or subtitle in the panel header when results
  are older than a configurable threshold (e.g., 5 minutes), e.g.
  "Results from 12 min ago — Refresh".
- Clicking Refresh re-clears `lastQueriedKey` to trigger a fresh fetch with
  the current inputs.

## Acceptance Criteria

- [x] A staleness indicator appears in the panel header when cached results are
      older than 5 minutes.
- [x] The indicator shows a human-readable age (e.g., "12 min ago").
- [x] Clicking the refresh action clears the cache key and re-fetches.
- [x] The indicator is not shown when results are fresh or when no results exist.
- [x] No regressions in existing page tests.

## Implementation Notes

Add `queriedAt: Date | null` to `ExploreState`, `RoutingState`, and
`IsolineState`. Set it when `lastQueriedKey` is written after a successful
fetch. A small `useInterval` (or a `useMemo` checked against `Date.now()` on
each render interval) can drive the display text. Keep the threshold constant
in `constants.ts`.

## Completion

- Date: 2025-07-16
- Outcome: Implemented StalenessIndicator component with 30s refresh interval.
  Added queriedAt tracking to ExploreState, RoutingState, and IsolineState.
  Integrated into all three pages with refresh action. Added unit tests.
  Updated flushReactUpdates in ConnectPage/IsolinePage tests to use
  runOnlyPendingTimersAsync to avoid infinite interval loop.
- Descoped ACs: none
