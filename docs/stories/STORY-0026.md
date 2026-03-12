# STORY-0026: Cancel stale fetch requests on dependency change

## Status

CLOSED

## Type

fix

## Context

`ExplorePage`, `ConnectPage`, and `IsolinePage` all fire async HTTP requests
inside `useEffect` hooks with no request cancellation. When a user rapidly
changes a stop, date, or config, multiple requests can be in-flight
simultaneously. Whichever resolves last wins and overwrites state, even if it
belongs to an older query. The `setTimeout` wrapper in `ConnectPage` and
`IsolinePage` postpones the fetch but does not cancel previous in-flight ones.

## Scope

- Add `AbortController` (or an ignore-flag) to every data-fetching `useEffect`
  in `ExplorePage`, `ConnectPage`, and `IsolinePage`.
- Ensure a superseded response never writes to React state.
- The existing `lastQueriedKey` deduplication guard is unaffected; this adds a
  second layer of correctness for rapid input changes.

## Acceptance Criteria

- [x] Changing a stop or date in quick succession does not produce a visible
      state update from a stale (earlier) response.
- [x] No TypeScript errors introduced.
- [x] Existing tests continue to pass; add or extend a test that confirms stale
      responses are ignored.

## Implementation Notes

Use an `AbortController` per `useEffect` invocation and pass `{ signal }` to
`fetch` inside `RealDataProvider`. Alternatively, use a boolean `cancelled`
flag (`let cancelled = false; return () => { cancelled = true; }`) if wiring
the signal through the provider is out of scope.

## Completion

- Date: 2026-03-12
- Outcome: Added `cancelled` boolean flag to all three data-fetching `useEffect`
  hooks (ExplorePage, ConnectPage, IsolinePage). Cleanup sets the flag; all
  state writes (`updateState`, `setLoading`, `addToast`, `setCustomBounds`) are
  guarded by `if (!cancelled)`. Added one stale-response cancellation unit test
  per page confirming that resolving a deferred promise after cleanup does not
  trigger further state updates.
- Descoped ACs: none
