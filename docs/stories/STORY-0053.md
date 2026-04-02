# STORY-0053: Show real app version in About dialog

## Status

CLOSED

## Type

fix

## Context

The About dialog hardcodes `v1.0.0` in the version string. The real version lives in
`package.json` and should be injected at build time via Vite's `define` config so it is correct
in local dev, Docker, and GitHub Pages deployments.

## Scope

- Inject `package.json` version into the build via `vite.config.ts` define.
- Export an `APP_VERSION` constant from `src/constants.ts`.
- Replace the hardcoded `v1.0.0` in `AboutDialog.tsx` with the constant.

## Acceptance Criteria

- [x] About dialog shows the version from `package.json` (currently `2.0.1`).
- [x] Version is correct in local dev, Docker build, and GitHub Pages build.
- [x] No hardcoded version string remains in `AboutDialog.tsx`.

## Implementation Notes

Use `vite.config.ts` `define` to inject `__APP_VERSION__` at build time. Declare the global in
`vite-env.d.ts`.

## Completion

- Date: 2026-04-02
- Outcome: Injected `__APP_VERSION__` via Vite define; exported `APP_VERSION` constant; removed hardcoded string.
- Descoped ACs:
