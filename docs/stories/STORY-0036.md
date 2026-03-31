# STORY-0036: Centralise map tile layer URLs in constants

## Status

CLOSED

## Type

refactor

## Context

The CartoCDN tile layer URLs for light and dark map themes are duplicated
between `Map.tsx` (initialization effect) and the dark-mode switch effect
within the same file. If the tile provider needs to change (e.g., attribution
update, different CDN), both places must be updated in sync. Moving them to
`constants.ts` creates a single source of truth.

## Scope

- Define `MAP_TILE_URL_LIGHT` and `MAP_TILE_URL_DARK` (and the attribution
  string) in `src/constants.ts`.
- Replace all string literals in `Map.tsx` with the constants.

## Acceptance Criteria

- [x] Tile URLs appear exactly once in the source tree (in `constants.ts`).
- [x] `Map.tsx` references only the named constants.
- [x] Map renders correctly in both light and dark modes.
- [x] No existing tests broken.

## Implementation Notes

This is a pure constant extraction with no logic change.

## Completion

- Date: 2026-03-31
- Outcome: Extracted tile URLs and attribution to constants.ts; Map.tsx now references only named constants.
- Descoped ACs: none
