# STORY-0037: Use formatDisplayTime for map popup timestamps

## Status

OPEN

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

- [ ] Map popup times match sidebar card times for the same stop/departure in
      all combinations of `useStationTime` (on/off) and timezone settings.
- [ ] `PopupOptions` includes a `useStationTime` field.
- [ ] No other visual or functional changes.
- [ ] Existing tests pass; add a unit test to `popups` if feasible.

## Implementation Notes

`useMapLayers` already receives `timezone` and `darkMode` from `MapComponent`.
Add `useStationTime` alongside those and plumb it through to `bindRichStopPopup`
calls. `useSettings` should not be called inside the hook module directly —
keep data flow explicit via props.

## Completion

- Date:
- Outcome:
- Descoped ACs:
