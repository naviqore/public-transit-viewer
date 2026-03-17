# STORY-0030: Extract ephemeral page state out of DomainContext

## Status

CLOSED

## Type

refactor

## Context

`DomainContext` currently holds `ExploreState`, `RoutingState`, and
`IsolineState` — large objects that include both persistent cross-navigation
data (selected stops, search results) and ephemeral UI state
(`expandedTripIndex`, `lastQueriedKey`, `mapBounds`). The goal was to preserve
UI state across navigation, but the approach conflates global domain data with
page-specific transient state, causing unrelated context consumers to re-render
whenever any page updates its ephemeral fields.

## Scope

- Identify which fields in each page state are truly cross-navigation
  (selected stops, query results) vs. ephemeral (expanded index, scroll hints,
  map bounds).
- Move ephemeral fields to local component state or a lightweight page-scoped
  mechanism (e.g., `useRef`, `sessionStorage`, or React Router `state`).
- Keep cross-navigation state (selected stops, results, last queried key) in
  `DomainContext` so switching pages and back still restores context.
- Update `DomainContextType` to reflect the slimmer shape.

## Acceptance Criteria

- [x] Ephemeral UI fields (`expandedTripIndex`, `mapBounds`, `expandedStopId`)
      are no longer stored in `DomainContext`.
- [x] Switching pages and returning still restores the selected stop and last
      search results.
- [x] `DomainContext.test.tsx` tests updated and passing.
- [x] No regressions in `ExplorePage`, `ConnectPage`, or `IsolinePage` tests.

## Implementation Notes

Start with `expandedTripIndex` in `ExploreState` (pure local UI toggle) as a
pilot; replace with `useState` inside `ExplorePage`. Repeat for `mapBounds`
and `expandedStopId`. Coordinate with STORY-0029 (`updateState` memoization)
for a clean sequenced merge.

## Completion

- Date: 2026-03-13
- Outcome: Ephemeral UI fields moved to local state where appropriate; selection and restore logic improved for Explore, Isoline, and Connect pages. Map zoom/restore now matches user expectations across all pages. No ACs descoped.
- Descoped ACs: none
