# STORY-0033: Improve ErrorBoundary error surfacing and reset

## Status

OPEN

## Type

fix

## Context

`ErrorBoundary` catches unhandled render errors but:

1. The caught `error` is not stored in state, so the fallback UI cannot show
   any useful detail about what went wrong.
2. Only a full page reload is offered as recovery; an in-place "Try again"
   reset (calling `setState({ hasError: false })`) would recover from transient
   errors without losing session state.
3. `this.props` is re-assigned in the constructor — a no-op since React already
   sets `this.props` — leaving misleading code.

## Scope

- Store the caught `Error` in `ErrorBoundaryState` and display its `message`
  in the fallback UI (collapsed/details section is fine).
- Add a "Try again" button that resets `hasError` to `false`, allowing React
  to attempt re-render before falling back to "Refresh".
- Remove the redundant `this.props = props` constructor assignment.

## Acceptance Criteria

- [ ] The fallback UI shows the error message (not just a generic string).
- [ ] A "Try again" button resets the boundary and re-renders children.
- [ ] The redundant `this.props` assignment is removed.
- [ ] `ErrorBoundary.test.tsx` covers: (a) renders children normally,
      (b) shows fallback with error message on throw,
      (c) "Try again" resets and re-renders children.

## Implementation Notes

Add `error: Error | null` to `ErrorBoundaryState`. Update
`getDerivedStateFromError` to accept its `error: Error` argument and store it.
The `componentDidCatch` can keep its `console.error` call.

## Completion

- Date:
- Outcome:
- Descoped ACs:
