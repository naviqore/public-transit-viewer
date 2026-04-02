# STORY-0045: Modernize map selection highlighting and leg interaction

## Status

CLOSED

## Type

style

## Context

When selecting a connection leg on the map, the selected polyline receives a Tailwind
`drop-shadow-md` CSS class. Because Leaflet renders polylines as SVG `<path>` elements, the CSS
`filter: drop-shadow()` produces a visible rectangular bounding box around the entire trip path.
Additionally, the browser's default focus outline on interactive SVG elements adds another
rectangular border when clicking polylines. The selection model also lacked interactivity: clicking
connections or legs on the map had no effect, and selecting a leg did not visually distinguish it
from the rest of the connection.

Modern mapping applications (Google Maps, Apple Maps, Citymapper) dim non-selected parts and
highlight only the active segment. The fix must apply consistently across all map variants:
Explore, Connect, and Isoline pages.

## Scope

- Remove `className: 'drop-shadow-md'` from selected polylines in `useMapLayers.ts`.
- Remove browser focus outline on `.leaflet-interactive` elements via CSS.
- When a leg is selected, highlight only that leg at full opacity/weight while dimming the rest
  of the connection (reduced opacity and thinner weight).
- Show intermediate stops only for the selected leg (not the entire connection).
- Enable clicking connections on the map to select them (expands in the list).
- Enable clicking a leg of a selected connection on the map to select and expand that leg.
- Sync map-triggered leg selection with the ConnectionCard expanded state.
- Apply consistently to all map pages (Explore, Connect, Isoline).

## Acceptance Criteria

- [x] No CSS `className` or browser focus outline is applied to selected polylines.
- [x] When a leg is selected, only the selected leg renders at full opacity; other legs are dimmed.
- [x] Intermediate stops are shown only for the selected leg, not the full connection.
- [x] Clicking a connection polyline on the map selects it and expands it in the list.
- [x] Clicking a leg of a selected connection on the map selects and expands that leg.
- [x] Selection highlight is visually consistent across Explore, Connect, and Isoline map pages.

## Implementation Notes

- Removed `drop-shadow-md` className from selected polylines.
- Added `.leaflet-interactive:focus { outline: none; }` in `styles.css`.
- `drawConnection` accepts `selectedLegIndex` — active leg renders at opacity 1.0 / weight 6,
  non-selected legs dim to opacity 0.25 / weight 3.
- `drawTripStops` only renders intermediate stops for the selected leg; other legs show endpoints
  only.
- `drawConnection` accepts `onLegClick` callback — each leg polyline in the selected connection
  gets a transparent click area that fires `onLegClick(leg, legIndex)`.
- Click areas use `opacity: 0` + `pointerEvents: 'all'` instead of `color: 'transparent'` to
  ensure SVG pointer events fire correctly.
- `MapProps` gained `selectedLegIndex` and `onLegClick` props.
- `ConnectionCard` accepts external `selectedLegIndex` to sync expanded state from map clicks.
- ConnectPage wires `selectedLegIndex` state through map and list, toggling on repeated clicks.

## Completion

- Date: 2026-04-02
- Outcome: Replaced bounding-box selection with modern leg-level highlighting; added
  bidirectional map-list leg selection; dimmed non-active legs; intermediate stops scoped to
  selected leg only.
- Descoped ACs: none
