# STORY-0039: Stabilize Leaflet map rendering across all map pages

## Status

IN_PROGRESS

## Type

fix

## Context

Users report that maps on Connections, Explore, and Isolines flicker, zoom unexpectedly, and fail to render stops/lines. The browser console shows a Leaflet runtime error:

`Cannot read properties of undefined (reading '_leaflet_pos')`

The stack trace points to `invalidateSize` being triggered during a `ResizeObserver` callback in `Map.tsx`, suggesting map pane position is accessed before Leaflet internals are ready or after teardown.

## Scope

- Reproduce and isolate the rendering failure in shared map behavior used by Connections, Explore, and Isolines pages.
- Fix the resize/invalidation flow so Leaflet map state remains valid during mount, resize, and unmount transitions.
- Ensure map overlays (stops, route lines, isolines) render reliably after the fix.
- Add or update focused tests for the corrected map lifecycle behavior.

## Acceptance Criteria

- [x] Connections map renders stable tiles and overlays (stops/lines) without flicker or runaway zoom behavior.
- [x] Explore map renders stable tiles and overlays (stops/lines) without flicker or runaway zoom behavior.
- [x] Isolines map renders stable isoline layers and stops without flicker or runaway zoom behavior.
- [x] The Leaflet error `Cannot read properties of undefined (reading '_leaflet_pos')` no longer occurs during normal resize/layout changes.
- [x] Existing map interactions (pan/zoom, selection popups, viewport updates) remain functional across all three pages.
- [x] Automated tests cover the fixed lifecycle/resize behavior and pass in `npm run ci`.

## Implementation Notes

- Prefer a defensive, lifecycle-safe approach in shared map logic rather than page-specific workarounds.
- Keep the fix minimal and avoid unrelated map refactors.

## Completion

- Date:
- Outcome:
- Descoped ACs:
