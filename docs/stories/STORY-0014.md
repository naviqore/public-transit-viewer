# STORY-0014: Isoline map color-mode toggle (travel time vs transfers)

## Status

OPEN

## Context

The isoline map currently colors every stop marker and path segment using a continuous gradient
from indigo → fuchsia → amber based on **travel time** relative to `maxDuration`.
User feedback requests the ability to switch the color encoding to **number of transfers**
instead, with a matching legend. This makes it easy to compare which reachable stops require at
most one transfer vs those that require multiple.

A toggle control should appear on the isoline panel (or as a map overlay control) and a
compact legend should update to reflect the active mode.

## Scope

- Add a `colorMode` state (`'duration' | 'transfers'`) to `IsolinePage` (not persisted to
  `DomainContext`; reset on navigation).
- Add a two-option toggle button group (e.g. "Travel time" / "Transfers") inside the isoline
  panel header, near the existing `maxDuration` slider.
- Pass `colorMode` and `isolines` (for transfer counts) into `useMapLayers` so the hook can
  choose the right color per stop.
- For **transfer** color encoding use a discrete four-step palette:
  - 0 transfers → indigo (`#4f46e5`)
  - 1 transfer → fuchsia (`#a855f7`)
  - 2 transfers → amber (`#f59e0b`)
  - 3+ transfers → rose (`#f43f5e`)
- Apply the selected color to **both** the circular stop markers and the connecting path
  segments on the map (same gradient/palette, same value source).
- Add a compact **legend** component below the toggle (or as a map overlay chip-row) that
  shows the color steps with labels. The legend updates when the mode changes.
- When the user switches mode the map re-renders immediately (no extra fetch needed).
- No change to the list-panel card display or sorting; this is a map-only visual feature.

## Acceptance Criteria

- [ ] A visible toggle (two buttons or a segmented control) labelled "Travel time" and
      "Transfers" is present in the isoline panel.
- [ ] Default mode is "Travel time" — existing gradient behaviour is preserved unchanged.
- [ ] Switching to "Transfers" re-colors every stop marker and path on the map according to
      the discrete palette defined above.
- [ ] The legend renders the correct color chips and labels for the active mode: - Travel time: gradient bar from indigo → fuchsia → amber, labelled "0 min" → "`maxDuration` min". - Transfers: four chips labelled "Direct", "1 transfer", "2 transfers", "3+".
- [ ] The stop marker tooltip in transfers mode shows transfer count (e.g. "2 transfers")
      instead of minutes.
- [ ] Stops with `transfers === 0` are highlighted green/indigo consistently with the "Direct"
      chip in the legend.
- [ ] Switching mode back to "Travel time" restores the gradient colors.
- [ ] `npm run check` passes with no type errors.
- [ ] Unit or integration tests cover the color-lookup logic (pure function mapping transfer
      count to color string).

## Implementation Notes

- Extract the color-for-stop logic into a pure utility function (e.g.
  `getIsolineColor(value: number, mode: 'duration' | 'transfers', max: number): string`) in
  `src/utils/dataUtils.ts` or a new `src/utils/isoUtils.ts`. This is the primary testable unit.
- Extend `UseMapLayersProps` in `useMapLayers.ts` with `isolineColorMode` and
  `isolineTransferMap` (a `Map<stopId, transferCount>` built in `IsolinePage` from `isolines`).
- In `drawIsolineStops` and `drawIsolinePaths`, replace the `getGradientColor(duration, max)`
  call with the new combined utility.
- The legend component can live in `src/components/common/IsolineLegend.tsx`; keep it purely
  presentational (receives `mode` and `maxDuration` as props).
- Reuse `COLORS` / existing tailwind tokens for the discrete palette to stay consistent with
  the design system.

## Completion

- Date:
- Outcome:
