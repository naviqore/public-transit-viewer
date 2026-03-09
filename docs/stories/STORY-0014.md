# STORY-0014: Isoline map color-mode toggle (travel time vs transfers)

## Status

IN_PROGRESS

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

- [ ] A visible toggle (two buttons or a segmented control) labelled "Travel time" and
      "Transfers" is present in the isoline map area.
- [ ] Default mode is "Travel time" — existing gradient behaviour is preserved unchanged.
- [ ] Switching to "Transfers" re-colors every stop marker and path on the map.
- [ ] The legend renders the correct color chips and labels for the active mode.
- [ ] The stop marker tooltip in transfers mode shows transfer count (e.g. "2 transfers")
      instead of minutes.
- [ ] Stops with `transfers === 0` are highlighted green/indigo consistently with the "Direct"
      chip in the legend.
- [ ] Switching mode back to "Travel time" restores the gradient colors.
- [ ] `npm run check` passes with no type errors.
- [ ] Unit or integration tests cover the color-lookup logic (pure function mapping transfer
      count to color string).

## Implementation Notes

- Extract the color-for-stop logic into a pure utility function. This is the primary testable unit.
- Reuse `COLORS` / existing tailwind tokens for the palette to stay consistent with
  the design system.

## Completion

- Date:
- Outcome:
