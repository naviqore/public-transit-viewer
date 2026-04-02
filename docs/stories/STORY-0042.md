# STORY-0042: Optimise isoline map rendering performance

## Status

CLOSED

## Type

perf

## Context

When the isoline API returns a large result set (hundreds to ~1000 stops), the map becomes
noticeably slow — both during the initial render and when the user pans or zooms. The root causes
are:

1. **No Canvas renderer** — Leaflet defaults to SVG, which creates a DOM element per shape. With
   1000+ circle markers and polylines this overwhelms the browser layout engine.
2. **No viewport culling** — every circle marker and polyline is added to the map regardless of
   whether it's within the visible viewport.
3. **Full clear-and-redraw** — `layerGroup.clearLayers()` followed by re-adding every layer runs
   on every dependency change in the `useMapLayers` effect, causing expensive reflows.
4. **Tooltips bound eagerly** — a Leaflet tooltip DOM element is created for every non-dimmed
   circle marker, even off-screen ones.

These issues compound at high zoom levels where the DOM contains many off-screen elements that
still participate in hit-testing and layout.

## Scope

- Switch isoline circle markers and polylines to the Leaflet **Canvas renderer** (built-in,
  no extra dependency).
- Implement **viewport culling** so only markers/polylines within (or near) the visible bounds
  are added to the layer group.
- Listen to `moveend` / `zoomend` events with a short debounce to incrementally update the
  visible set without a full clear-and-redraw.
- Defer tooltip binding to on-demand (e.g. on hover/click) rather than pre-creating tooltip DOM
  for every marker.
- Apply these optimisations to the isoline variant; the default (routing) variant typically has
  far fewer elements and can remain unchanged.

## Acceptance Criteria

- [x] Isoline circle markers use the Leaflet Canvas renderer instead of SVG.
- [x] Isoline polylines use the Leaflet Canvas renderer instead of SVG.
- [x] Only markers and polylines within (or near) the current viewport are added to the map;
      off-screen elements are removed or not created.
- [x] Panning and zooming triggers a debounced viewport-cull update rather than a full
      clear-and-redraw of all isoline layers.
- [x] Tooltips for non-highlighted isoline stops are created lazily (on hover) rather than
      eagerly for every marker.
- [x] The highlighted isoline stop marker and its permanent tooltip still render correctly.
- [x] Isoline colour-mode toggle (travel time / transfers) still works correctly.
- [x] No new runtime dependencies are added (Canvas renderer is built into Leaflet).
- [x] Existing map tests continue to pass; add or extend tests for viewport-culling logic.
- [x] `npm run ci` passes with zero warnings.

## Implementation Notes

- `L.canvas()` can be passed as the `renderer` option to `L.circleMarker()` and `L.polyline()`.
  A single shared `L.canvas()` instance should be reused for all isoline layers.
- Viewport culling can use `map.getBounds().pad(0.2)` (20 % buffer) and
  `bounds.contains([lat, lng])` to test inclusion.
- The `moveend` event fires after both pan and zoom; a 100–150 ms debounce avoids excessive
  redraws during animated zooms (e.g. `flyTo`).
- Consider storing the full isoline dataset in a ref and only drawing the visible subset into the
  layer group, so the effect dependency array no longer triggers on viewport changes.
- Keep the default (routing) variant rendering unchanged — its element count is low enough that
  the current approach is fine.

## Completion

- Date: 2026-03-31
- Outcome: Switched isoline layers to Canvas renderer, added viewport culling with 20% padding,
  debounced moveend listener (150ms), and lazy tooltip binding on hover. Isoline rendering is
  now in a dedicated layer group and effect, independent from the main layer rendering. Added 9
  pure-function tests for viewport-culling logic in viewportCulling.test.ts.
- Descoped ACs: none
