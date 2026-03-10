# STORY-0003: Remove index.html import map

## Status

CLOSED

## Type

chore

## Context

The app is already a Vite + npm build. Import maps in `index.html` indicate prototype loading behavior and can conflict with bundled module resolution.

## Scope

- Remove `<script type="importmap">` from `index.html`.
- Ensure app still resolves React/Leaflet dependencies via npm/Vite.

## Acceptance Criteria

- [x] `index.html` no longer contains an import map.
- [x] `npm run build` succeeds.
- [x] App boots without module resolution errors.

## Implementation Notes

Do not change runtime behavior beyond module loading cleanup.

## Completion

- Date: 2026-03-06
- Outcome: Removed `index.html` import map and verified build/tests/dev boot via npm/Vite module resolution.
