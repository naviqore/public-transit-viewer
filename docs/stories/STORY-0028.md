# STORY-0028: Fix compiler errors and missing useEffect deps in IsolinePage

## Status

CLOSED

## Type

fix

## Context

The TypeScript / ESLint compiler reports three issues in `IsolinePage.tsx`:

1. A CSS side-effect import error (`Cannot find module or type declarations for
side-effect import of './PageStyles.css'`) that does not occur in
   `ExplorePage` or `ConnectPage` despite the identical import.
2. `useEffect` for date initialisation is missing `isolineState.date` and
   `setIsolineState` in its dependency array.
3. The main query `useEffect` is missing several deps: `addToast`,
   `expandedStopId`, `isolines`, `lastQueriedKey`, `mapBounds`,
   `reconstructConnection`, and `updateState`.

Omitted deps are stale-closure hazards that can cause the effect to read
outdated values without re-running.

## Scope

- Resolve the CSS import type error (check `tsconfig` `types` / `moduleResolution`
  settings or add a `*.css` declaration if missing).
- Fix missing deps in both `useEffect` hooks, ensuring effects are stable and
  correct (use `useCallback` / `useRef` where needed to avoid infinite loops).

## Acceptance Criteria

- [x] `npm run typecheck` reports no errors in `IsolinePage.tsx`.
- [x] `npm run lint` reports no `react-hooks/exhaustive-deps` warnings for
      `IsolinePage.tsx`.
- [x] Isoline page behaviour is unchanged (existing E2E / unit tests pass).

## Implementation Notes

The CSS issue may be solved by a single-line `declare module '*.css'` shim in
`src/types.d.ts` (if one doesn't already exist), or by ensuring the tsconfig
`include` array covers `.css` modules.

For the dep-array fixes, extract `updateState` into a `useCallback` first to
make it a stable reference, then add the remaining deps.

## Completion

- Date: 2026-03-12
- Outcome: Added src/vite-env.d.ts to resolve CSS side-effect import type error;
  wrapped updateState and reconstructConnection in useCallback; moved volatile
  deps to refs; fixed both useEffect dependency arrays. All ACs satisfied.
- Descoped ACs: none
