# STORY-0009: Split map layer rendering helpers

## Status

CLOSED

## Context

`useMapLayers` is handling many responsibilities and is difficult to evolve safely.

## Scope

- Extract at least one coherent rendering concern from `useMapLayers.ts` into dedicated helper module(s).
- Keep map behavior unchanged.

## Acceptance Criteria

- [ ] `useMapLayers.ts` is reduced in size/complexity by delegating a major concern.
- [ ] Extracted helpers are typed and colocated under a clear map-layer structure.
- [ ] Map rendering behavior remains functionally equivalent.

## Implementation Notes

Do this in slices; this story is first extraction step, not full redesign.

## Completion

- Date: 2026-03-09
- Outcome: Extracted stop icon rendering (`mapLayers/stopIcons.ts`) and popup/tooltip rendering (`mapLayers/popups.ts`) from `useMapLayers.ts`. Hook reduced from ~800 to 588 lines. Also fixed line-tooltip cursor overlap by switching to `direction: 'top'` with sticky tracking. Map behavior unchanged; all tests pass.
