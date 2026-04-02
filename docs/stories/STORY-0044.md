# STORY-0044: Persist benchmark state across tab and page navigation

## Status

CLOSED

## Type

fix

## Context

The benchmark engine lives inside the `useBenchmark` hook, which is instantiated by
`BenchmarkTab`. When the user switches away from the benchmark tab or navigates to another
page, `BenchmarkTab` unmounts — destroying all state and refs. A running benchmark silently
dies, and returning to the tab shows a fresh "not running" state. There is no mechanism to
prevent starting a second benchmark or to reconnect to an already-running one.

## Scope

- Extract benchmark state into a `BenchmarkContext` provider mounted in `Providers.tsx`.
- `useBenchmark` becomes a thin consumer of that context.
- `BenchmarkTab` always reflects the true running/stopped state regardless of mount lifecycle.
- Only one benchmark can run at a time (enforced at the context level).

## Acceptance Criteria

- [x] Benchmark state (isRunning, stats, logs, config, latencyHistory) survives tab switches
      and page navigation.
- [x] A running benchmark continues executing when `BenchmarkTab` is unmounted.
- [x] Returning to the benchmark tab shows the correct running state and accumulated stats.
- [x] The play/stop button correctly reflects whether a benchmark is active.
- [x] Only one benchmark instance can run at a time.
- [x] Existing `BenchmarkTab.test.tsx` tests pass.
- [x] `npm run ci` passes warning-free.

## Implementation Notes

- Move the core benchmark engine (refs, workers, stats interval) into a context provider.
- The context provider lives above the router so it is never unmounted during navigation.
- `useBenchmark` returns the same `UseBenchmarkReturn` interface — minimises UI changes.
- Keep `BenchmarkTab` purely presentational; it consumes context state.

## Completion

- Date: 2026-04-02
- Outcome: Extracted benchmark engine into BenchmarkContext provider mounted in
  Providers.tsx. useBenchmark is now a thin context consumer. State persists
  across tab/page navigation. Single instance enforced at context level.
- Descoped ACs: none
