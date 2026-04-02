# STORY-0037: Use formatDisplayTime for map popup timestamps

## Status

CLOSED

## Type

fix

## Context

`src/hooks/mapLayers/popups.ts` formats stop timestamps using raw
`Date.toLocaleTimeString('en-GB', { timeZone: timezone })` instead of the
app's canonical `formatDisplayTime(iso, timezone, useStationTime)` utility
(backed by Luxon). This means map popup times diverge from sidebar card times
when the `useStationTime` setting is enabled: popups always convert to the
user's timezone, while cards correctly show the station-embedded offset.

## Scope

- Thread `useStationTime: boolean` through `PopupOptions` in `popups.ts`.
- Replace the `toLocaleTimeString` call with `formatDisplayTime` from
  `../../utils/dateUtils`.
- Pass `useStationTime` from `useMapLayers` (which already receives `timezone`
  from `MapComponent`).

## Acceptance Criteria

- [x] Map popup times match sidebar card times for the same stop/departure in
      all combinations of `useStationTime` (on/off) and timezone settings.
- [x] `PopupOptions` includes a `useStationTime` field.
- [x] No other visual or functional changes.
- [~] Existing tests pass; add a unit test to `popups` if feasible.

## Implementation Notes

`useMapLayers` already receives `timezone` and `darkMode` from `MapComponent`.
Add `useStationTime` alongside those and plumb it through to `bindRichStopPopup`
calls. `useSettings` should not be called inside the hook module directly —
keep data flow explicit via props.

## Completion

- Date: 2026-03-31
- Outcome: Replaced toLocaleTimeString with formatDisplayTime in popups.ts; threaded useStationTime through PopupOptions, useMapLayers, and MapComponent.
- Descoped ACs: Popup unit test descoped — popups.ts generates HTML strings for Leaflet tooltips which are not straightforward to unit test without DOM integration; behaviour is covered by the existing page-level tests.
