# STORY-0032: Make benchmark seed stops backend-agnostic

## Status

CLOSED

## Type

fix

## Context

The benchmark engine in `MonitoringContext` preloads stop pools by
autocompleting a hardcoded list of Swiss city names (`SEED_CITIES`). Because
the app is a generic viewer for any Naviqore-compatible transit backend, a
non-Swiss backend will return empty results for these queries, producing a
zero-stop pool and rendering the benchmark useless without any error message.

## Scope

- Replace or supplement `SEED_CITIES` with a backend-agnostic strategy for
  populating the stop pool (e.g., querying `/schedule/stops/nearest` from a
  configurable set of coordinates, or using whatever stops the backend exposes
  via a generic listing endpoint if available).
- As a simpler fallback: accept a configurable list of seed terms via the
  benchmark config UI (editable in `BenchmarkConfigPanel` or `SettingsPage`).
- Show a clear warning in the benchmark UI when the stop pool is empty after
  preloading.

## Acceptance Criteria

- [x] Benchmark preloading does not rely solely on hardcoded Swiss city names.
- [x] When the stop pool is empty after preloading, the benchmark UI displays
      a visible warning and does not silently start with 0 stops.
- [x] A non-Swiss backend with valid stops can run the benchmark successfully.
- [x] Existing tests pass.

## Implementation Notes

The least-invasive fix is to add a fallback: if city autocomplete returns fewer
than N stops total, surface a warning in the benchmark log and disable the
Start button. A follow-up can add configurable seed inputs.

## Completion

- Date: 2026-03-31
- Outcome: Added nearest-stops fallback from default map center when autocomplete seed cities return no stops; clear error message when pool remains empty.
- Descoped ACs: none
