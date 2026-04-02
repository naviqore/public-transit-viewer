# STORY-0051: Fix logo not shown on GitHub Pages deployment

## Status

CLOSED

## Type

fix

## Context

The Naviqore logo (`logo.png`) is not displayed in the About dialog, the
sidebar button (desktop), or the Settings page entry (mobile) when the app is
served from a subdirectory on GitHub Pages (`/public-transit-viewer/`). All
three locations use a hardcoded absolute path (`/logo.png`) that resolves to
the domain root instead of the app's base path. Local development and Docker
deployments serve from `/`, so the paths resolve correctly there.

## Scope

- Replace hardcoded `/logo.png` references in JSX with a base-path-aware
  constant that uses `import.meta.env.BASE_URL`.
- Add a `LOGO_URL` constant in `src/constants.ts`.
- Ensure Docker and local deployments remain unaffected (both default to
  `BASE_URL = "/"`).

## Acceptance Criteria

- [x] Logo renders in the sidebar button (desktop) on GitHub Pages.
- [x] Logo renders in the About dialog on GitHub Pages.
- [x] Logo renders in the Settings/About entry (mobile) on GitHub Pages.
- [x] Logo continues to render in local dev and Docker deployments.
- [x] No new lint or CI warnings introduced.

## Implementation Notes

Vite exposes `import.meta.env.BASE_URL` which equals `/` by default and
`/public-transit-viewer/` when built with `--base /public-transit-viewer/`.
A single constant `LOGO_URL` avoids repeating the template expression.

## Completion

- Date: 2026-04-02
- Outcome: Replaced hardcoded `/logo.png` with base-path-aware `LOGO_URL` constant using `import.meta.env.BASE_URL`.
- Descoped ACs: none
