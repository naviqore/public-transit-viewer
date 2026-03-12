# STORY-0029: Memoize updateState helpers in page components

## Status

CLOSED

## Type

perf

## Context

All three page components (`ExplorePage`, `ConnectPage`, `IsolinePage`) define
an `updateState` arrow function directly inside the component body without
`useCallback`. This means the function reference changes on every render,
causing any `useEffect` that closes over it to technically hold a stale
reference, and preventing future hook dependency tools from detecting the
omission correctly. It also triggers unnecessary re-creation of child
component props that receive the function.

## Scope

- Wrap `updateState` in `useCallback` in `ExplorePage`, `ConnectPage`, and
  `IsolinePage`, with the correct dependency (`setExploreState` /
  `setRoutingState` / `setIsolineState` — all stable setState refs).
- No behaviour change is intended; this is a correctness/perf improvement.

## Acceptance Criteria

- [x] `updateState` in each page component is wrapped in `useCallback`.
- [x] No ESLint `react-hooks/exhaustive-deps` warnings introduced.
- [x] All existing tests pass.

## Implementation Notes

`React.Dispatch` (the `setState` type) is guaranteed stable across renders, so
the `useCallback` dependency array should contain only the relevant setter.

## Completion

- Date: 2026-03-12
- Outcome: Wrapped updateState in useCallback in ExplorePage and ConnectPage; fixed infinite re-render loop in IsolinePage by moving reconstructConnection behind a ref.
- Descoped ACs: none
