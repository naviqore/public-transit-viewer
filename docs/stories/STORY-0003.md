# STORY-0003: Remove index.html import map

## Status

OPEN

## Context

The app is already a Vite + npm build. Import maps in `index.html` indicate prototype loading behavior and can conflict with bundled module resolution.

## Scope

- Remove `<script type="importmap">` from `index.html`.
- Ensure app still resolves React/Leaflet dependencies via npm/Vite.

## Acceptance Criteria

- [ ] `index.html` no longer contains an import map.
- [ ] `npm run build` succeeds.
- [ ] App boots without module resolution errors.

## Implementation Notes

Do not change runtime behavior beyond module loading cleanup.

## Completion

- Date:
- Outcome:
