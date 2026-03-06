# STORY-0009: Split map layer rendering helpers

## Status

OPEN

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

- Date:
- Outcome:
