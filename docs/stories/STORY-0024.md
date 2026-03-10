# STORY-0024: Skip redundant backend queries on page switch

## Status

OPEN

## Context

Each feature page (Explore, Connect, Isoline) runs a `useEffect` that fires on
every mount. Because React unmounts a page component when the user navigates
away and remounts it when they return, the backend is queried again even when
the inputs (stop, date, config, …) have not changed at all.

The query inputs are already persisted in `DomainContext`
(`exploreState`, `routingState`, `isolineState`), so the existing results are
available immediately — but the pages discard them and re-fetch anyway.

The fix is to store a serialised "last-queried key" alongside the results in
each domain state slice. On mount, if the key matches the current inputs, the
page skips the fetch and renders the cached results straight away.

## Scope

- Add a `lastQueriedKey: string | null` field to each of the three domain state
  slices (`ExploreState`, `RoutingState`, `IsolineState`) in `src/types.ts`.
- Initialise each field to `null` in `DomainContext.tsx`.
- In each page, compute a deterministic key from the query inputs before
  calling the backend.
- Guard each `useEffect` fetch: if `lastQueriedKey === computedKey`, skip the
  network call.
- Store the key in domain state after a successful fetch.
- Reset `lastQueriedKey` to `null` whenever an input changes (i.e., before
  a new fetch starts), so a fresh fetch will run after that change.

## Acceptance Criteria

- [ ] AC1 — Navigating from any page and back does **not** trigger a new
      backend request when no input has changed (verifiable via network tab /
      service spy).
- [ ] AC2 — Changing any input (stop, date, config parameter) on any page
      **does** trigger a fresh backend request.
- [ ] AC3 — A failed fetch clears the key (leaves it `null`) so the next mount
      retries the query.
- [ ] AC4 — `ExploreState`, `RoutingState`, and `IsolineState` types each gain
      a `lastQueriedKey: string | null` field; all existing TypeScript usages
      compile without errors.
- [ ] AC5 — `npm run ci` passes (lint + build + tests).

## Implementation Notes

- The key can be built with `JSON.stringify` over the inputs that feed the
  query (stop id, date string, timeType, config fields). Keep it deterministic
  and cheap.
- Do **not** store the raw result objects redundantly; the existing
  `departures`, `connections`, `isolines` arrays in state already serve as the
  cache.
- No new library is required; this is a pure state-guard pattern.
- Tests: add a unit test per page (or per hook if extracted) that asserts the
  service is called exactly once across two render cycles with identical inputs,
  and twice when an input changes between cycles.

## Completion

- Date:
- Outcome:
- Descoped ACs:
