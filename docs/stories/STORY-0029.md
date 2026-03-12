# STORY-0029: Memoize updateState helpers in page components

## Status

OPEN

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

- [ ] `updateState` in each page component is wrapped in `useCallback`.
- [ ] No ESLint `react-hooks/exhaustive-deps` warnings introduced.
- [ ] All existing tests pass.

## Implementation Notes

`React.Dispatch` (the `setState` type) is guaranteed stable across renders, so
the `useCallback` dependency array should contain only the relevant setter.

## Completion

- Date:
- Outcome:
- Descoped ACs:
