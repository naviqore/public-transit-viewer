# STORY-0038: Show staleness indicator for cached query results

## Status

OPEN

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

- [ ] A staleness indicator appears in the panel header when cached results are
      older than 5 minutes.
- [ ] The indicator shows a human-readable age (e.g., "12 min ago").
- [ ] Clicking the refresh action clears the cache key and re-fetches.
- [ ] The indicator is not shown when results are fresh or when no results exist.
- [ ] No regressions in existing page tests.

## Implementation Notes

Add `queriedAt: Date | null` to `ExploreState`, `RoutingState`, and
`IsolineState`. Set it when `lastQueriedKey` is written after a successful
fetch. A small `useInterval` (or a `useMemo` checked against `Date.now()` on
each render interval) can drive the display text. Keep the threshold constant
in `constants.ts`.

## Completion

- Date:
- Outcome:
- Descoped ACs:
