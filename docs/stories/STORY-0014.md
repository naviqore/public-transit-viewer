# STORY-0014: Isoline map color-mode toggle (travel time vs transfers)

## Status

CLOSED

## Context

The isoline map currently colors every stop marker and path segment using a continuous gradient
from indigo → fuchsia → amber based on **travel time** relative to `maxDuration`.
User feedback requests the ability to switch the color encoding to **number of transfers**
instead, with a matching map legend. This makes it easy to compare which reachable stops require at
most one transfer vs those that require multiple.

A toggle control should appear on the isoline as a map overlay control and the map legend should update from travel time to transfers.

## Scope

- Apply the selected color to **both** the circular stop markers and the connecting path
  segments on the map (same gradient/palette, same value source).
- When the user switches mode the map re-renders immediately (no extra fetch needed).
- No change to the list-panel card display or sorting; this is a map-only visual feature.

## Acceptance Criteria

- [x] A visible toggle (two buttons or a segmented control) labelled "Travel time" and
      "Transfers" is present in the isoline map area.
- [x] Default mode is "Travel time" — existing gradient behaviour is preserved unchanged.
- [x] Switching to "Transfers" re-colors every stop marker and path on the map.
- [x] The legend renders the correct color chips and labels for the active mode.
- [x] The stop marker tooltip in transfers mode shows transfer count (e.g. "2 transfers")
      instead of minutes.
- [x] Stops with `transfers === 0` are highlighted green/indigo consistently with the "Direct"
      chip in the legend.
- [x] Switching mode back to "Travel time" restores the gradient colors.
- [x] `npm run check` passes with no type errors.
- [x] Unit or integration tests cover the color-lookup logic (pure function mapping transfer
      count to color string).

## Implementation Notes

- Extract the color-for-stop logic into a pure utility function. This is the primary testable unit.
- Reuse `COLORS` / existing tailwind tokens for the palette to stay consistent with
  the design system.

## Completion

- Date: 2026-03-09
- Outcome: Implemented. Segmented toggle added to the isoline map overlay; color mode state
  managed in IsolinePage and propagated through Map → useMapLayers via resolver functions.
  Pure utility helpers (`getTransferColor`, `getIsolineColor`) extracted to
  `src/utils/isolineColorUtils.ts` with 11 unit tests, all green. `npm run check` passes.
  Committed: `8a03684 feat(isoline): add travel-time / transfers color-mode toggle`.
