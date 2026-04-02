# STORY-0046: Deploy demo to GitHub Pages with mock data after release

## Status

CLOSED

## Type

ci

## Context

The app has a fully self-contained mock data provider that requires no backend. Combined with
the existing `HashRouter` (no SPA routing issues) and runtime env injection via `public/env.js`,
the app can be deployed as a static site on GitHub Pages to serve as a live demo.

## Scope

- Add a GitHub Actions workflow (`.github/workflows/gh-pages.yml`) that triggers after a
  Release Please release (on push of a release tag or after the release-please workflow).
- The workflow builds the Vite app with `VITE_ENABLE_MOCK_DATA=true` and
  `VITE_DISABLE_BENCHMARK=true`, sets the correct `base` path for the repository, and deploys
  the `dist/` output to GitHub Pages.
- Generate a `public/env.js` in the build step that sets `VITE_ENABLE_MOCK_DATA` to `"true"` and
  `VITE_DISABLE_BENCHMARK` to `"true"` at runtime, so the deployed app always starts in mock
  mode with the benchmark tab hidden.
- Set the Vite `base` path dynamically (e.g. via `--base` CLI flag or environment variable) so
  assets resolve correctly under `https://<org>.github.io/<repo>/`.

## Acceptance Criteria

- [x] A workflow file `.github/workflows/gh-pages.yml` exists and is syntactically valid.
- [x] The workflow triggers on a new release (e.g. after `release-please` creates a release or on
      release published event).
- [x] The build uses `VITE_ENABLE_MOCK_DATA=true` and `VITE_DISABLE_BENCHMARK=true`.
- [x] The Vite `base` path is configured for the repository's GitHub Pages URL.
- [x] The workflow deploys the built `dist/` to GitHub Pages using the
      `actions/deploy-pages` action (or equivalent).
- [x] `public/env.js` in the deployed build sets mock mode and disables benchmark at runtime.
- [x] No changes to application source code are required (CI-only story).

## Implementation Notes

- Use `actions/upload-pages-artifact` + `actions/deploy-pages` for the deployment (modern
  GitHub Pages approach with `id-token: write` permission).
- Vite supports `--base` CLI flag: `vite build --base /public-transit-viewer/`.
- The runtime `env.js` override ensures the deployed app always starts in mock mode regardless
  of build-time env, matching the Docker entrypoint pattern already in the project.
- The repository must have GitHub Pages enabled (source: GitHub Actions) in the repo settings —
  this is a manual step outside the scope of this story.

## Completion

- Date: 2026-04-02
- Outcome: Added gh-pages.yml workflow triggered on release; builds with mock data and deploys to GitHub Pages. Rewrote README.md to match backend service style.
- Descoped ACs: none
