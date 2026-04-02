# STORY-0031: Extract benchmark engine out of MonitoringContext

## Status

CLOSED

## Type

refactor

## Context

`MonitoringContext.tsx` is responsible for two distinct concerns:

1. Request logging and toast notifications (lightweight, core to all pages).
2. The entire benchmark engine: worker concurrency, stop preloading, Gaussian
   latency, stats rolling window, log buffering, and scenario management.

The benchmark logic is a self-contained subsystem (~250 LOC) mixed into the
monitoring context, making the file large and hard to reason about. Any
consumer of `useMonitoring()` gets the full benchmark API surfaced in its type.

## Scope

- Extract benchmark state, logic, and types into a dedicated
  `useBenchmark` hook (or a separate `BenchmarkContext` if cross-component
  sharing is needed).
- `MonitoringContext` retains: `logs`, `clearLogs`, `addToast`,
  `lastResponseTime`.
- Benchmark state is consumed only by `BenchmarkTab` and
  `SystemMonitorPage`/`SystemMonitorPanel`.
- Update `MonitoringContextType` to remove all benchmark fields.

## Acceptance Criteria

- [x] `MonitoringContext.tsx` no longer contains benchmark worker/stats logic.
- [x] A `useBenchmark` hook (or equivalent) owns benchmark state and is used
      by `BenchmarkTab`.
- [x] `useMonitoring()` type no longer exposes `benchmarkState`,
      `setBenchmarkConfig`, `toggleBenchmark`, `clearBenchmarkLogs`.
- [x] `BenchmarkTab.test.tsx` and `MonitoringContext.test.ts` tests pass.
- [x] No user-visible behaviour changes.

## Implementation Notes

Shared state needed by both the benchmark worker loop and the UI
(`serverInfo`, `naviqoreService`) can be passed as arguments to the hook or
accessed directly (service is a module-level singleton; `serverInfo` can come
from `useDomain()`).

## Completion

- Date: 2026-03-31
- Outcome: Extracted all benchmark state, logic, and types into useBenchmark hook. MonitoringContext now only owns logs, toasts, and lastResponseTime.
- Descoped ACs: none
