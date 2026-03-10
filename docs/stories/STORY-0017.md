# STORY-0017: Rename browser tab title to "Naviqore | Public Transit Viewer"

## Status

CLOSED

## Type

style

## Context

The browser tab currently shows "Public Transit Viewer". Adding the product brand name
"Naviqore" as a prefix improves recognition when the tab is not in focus and aligns the
tab title with the project identity visible in the UI and repository name.

## Scope

- Change the `<title>` element in `index.html` from `Public Transit Viewer` to
  `Naviqore | Public Transit Viewer`.
- No other files need to change for this story.

## Acceptance Criteria

- [x] `index.html` `<title>` reads exactly `Naviqore | Public Transit Viewer`.
- [x] `npm run check` passes.
- [x] `npm run build` succeeds and the built `dist/index.html` contains the updated title.

## Implementation Notes

Single-line change in `index.html`. No component or TypeScript changes required.

## Completion

- Date: 2026-03-10
- Outcome: Single-line change in `index.html`. All ACs satisfied. `npm run check` and `npm run build` passed.
- Descoped ACs: none
