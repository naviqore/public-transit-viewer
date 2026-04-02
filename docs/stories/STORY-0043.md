# STORY-0043: Use random stop endpoint for benchmark stop pool

## Status

CLOSED

## Type

refactor

## Context

The backend now exposes a `GET /schedule/stops/random` endpoint that returns a single random stop.
The current benchmark implementation seeds its stop pool by autocompleting hardcoded Swiss city
names (`SEED_CITIES`) and falling back to a nearest-stops query from the default map center. This
approach is fragile, backend-specific, and unnecessarily complex. With the new random stop endpoint,
the benchmark can fetch stops on demand without any hardcoded data or geographic workarounds.

## Scope

- Add `getRandomStop()` to the data provider interface, real provider, mock provider, and service
  facade.
- Replace the `preloadStops` logic (autocomplete seed cities + nearest-stops fallback) in
  `useBenchmark` with on-demand calls to `getRandomStop()`.
- Remove `SEED_CITIES`, `DEFAULT_MAP_CENTER` import, and the nearest-stops fallback from the
  benchmark hook.
- Remove the `isPreloading` state since stop fetching is no longer a discrete preload phase.
- Update `BenchmarkTab` to remove the preloading UI guard.
- Update existing tests to reflect the simplified flow.

## Acceptance Criteria

- [x] `IDataProvider` has a `getRandomStop()` method returning `ProviderResult<Stop>`.
- [x] `RealDataProvider` calls `GET /schedule/stops/random`.
- [x] `MockDataProvider` returns a random mock stop.
- [x] `NaviqoreService` exposes `getRandomStop()` with logging.
- [x] `useBenchmark` fetches two random stops per request instead of drawing from a preloaded pool.
- [x] `SEED_CITIES` constant and nearest-stops fallback are removed from `useBenchmark`.
- [x] `isPreloading` state and its UI handling are removed.
- [x] Benchmark still functions correctly (start, stop, stats, logs).
- [x] `npm run ci` passes warning-free.

## Implementation Notes

- Each benchmark request should call `getRandomStop()` twice (source and target) and retry if the
  same stop is returned for both.
- Keep error handling lean: if random stop fetch fails, log the error and skip the iteration.
- The preload button/spinner in `BenchmarkTab` becomes unnecessary and can be removed.

## Completion

- Date: 2026-04-02
- Outcome: Replaced preloaded stop pool with on-demand random stop endpoint; removed SEED_CITIES, DEFAULT_MAP_CENTER import, isPreloading state, and preload UI.
- Descoped ACs: none
