# STORY-0013: Align isoline list travel time with map

## Status

CLOSED

## Context

The isoline page shows stop cards in a sorted list (left panel) and colored markers on the map.
Both surfaces display a travel-time duration in minutes, but they can show different values for the
same stop because they read from different sources:

- **Map marker/tooltip** – uses `connectingLeg.duration` which was overwritten during post-processing
  to `totalDurationSeconds = (arrivalTime – queryStartTime) / 1000`.
- **`IsolineCard`** – uses `item.connection?.duration`, which is the same value, **but** the
  conditional is a truthy check (`?`). When `connection.duration === 0` the card falls back to
  `leg.arrivalTime – leg.departureTime` (the connecting-leg span only), which is a different number.
  When `connection` is `null` altogether, the same leg-span fallback applies.

Additionally, the API's `StopConnection` already carries authoritative `departureTime` and
`arrivalTime` fields on the root object (not the nested connection). Using those directly —
`iso.arrivalTime – iso.departureTime` — gives the actual transit time excluding query-start waiting
time, which is the more intuitive "travel time" from the user's perspective and is already the
value the backend intended.

The goal is to make the list card and the map marker tooltip always show exactly the same travel
duration, derived from the same computation.

## Scope

- Compute travel time **once** per `StopConnection` from `iso.arrivalTime – iso.departureTime`
  (the root-level StopConnection fields, not the nested connection or leg fields).
- Store this canonical value on `iso.connectingLeg.duration` (already used for sorting and
  map gradient colour), **and** ensure `iso.connection.duration` holds the same value so that
  `IsolineCard` reads the correct number.
- Fix the `IsolineCard` duration fallback to use `Math.round(item.connectingLeg.duration / 60)`
  when `connection.duration` is `null`, `undefined`, or `0`, instead of computing
  `leg.arrivalTime – leg.departureTime`.
- No change to sorting order (already sorts by `connection.duration` descending) or gradient
  colour logic — only the source value changes when it was previously mismatched.
- No visual redesign; only the displayed minute value needs correcting.

## Acceptance Criteria

- [ ] For every displayed stop, the minute value shown in the `IsolineCard` badge equals the
      minute value shown in the map marker tooltip for that same stop.
- [ ] The travel time is computed as
      `Math.round((new Date(iso.arrivalTime) – new Date(iso.departureTime)) / 60000)` → converted
      to seconds for storage, consistently for both DEPARTURE and ARRIVAL `TimeType`.
- [ ] When `connection.duration` is `0` or nullish, `IsolineCard` falls back to
      `connectingLeg.duration / 60` (not the leg arrival/departure time difference).
- [ ] The sorted order of the list is unchanged (furthest stop first).
- [ ] Not anymore needed methods and helpers are removed.
- [ ] `npm run check` passes with no type errors.
- [ ] Unit tests are added or updated in `IsolinePage` or a related util to cover the duration
      derivation for both `TimeType.DEPARTURE` and `TimeType.ARRIVAL`.

## Implementation Notes

- The canonical fix point is in the `processedIsolines` map inside the `useEffect` of
  `IsolinePage.tsx`. Change `totalDurationSeconds` to
  `(new Date(iso.arrivalTime).getTime() – new Date(iso.departureTime).getTime()) / 1000`.
  Remove the `TimeType` branching and the "fix for 0 duration" guard — the raw
  `arrivalTime – departureTime` is always valid and never negative.
- In `IsolineCard.tsx`, change the fallback branch to read
  `Math.round((item.connectingLeg.duration ?? 0) / 60)` instead of computing the difference
  from `leg.arrivalTime` and `leg.departureTime`.
- The map layer's `drawIsolineStops` already reads `connectingLeg.duration`; no change needed
  there once the upstream value is correct.

## Completion

- Date: 2026-03-09
- Outcome: Fixed. Duration now computed as `arrivalTime – departureTime` for all TimeTypes; IsolineCard fallback updated to use `connectingLeg.duration`. Map and list always show identical minute values. 7 unit tests added.
