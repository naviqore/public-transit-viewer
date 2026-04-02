# STORY-0049: Harden GitHub Pages deployment action runtime compatibility

## Status

CLOSED

## Type

build

## Context

GitHub Pages deployment currently succeeds but emits Node.js 20 deprecation warnings for
`actions/deploy-pages@v4`.

Deployment workflow should be hardened for Node 24 runtime transition so releases remain stable
as runner defaults change.

## Scope

- Update the GitHub Pages deployment workflow configuration to eliminate Node 20 deprecation
  warnings for deploy-pages.
- Keep deployment behavior and published artifact output unchanged.

## Acceptance Criteria

- [x] Deploy workflow runs without Node.js 20 deprecation warnings related to deploy-pages.
- [x] Deployment still publishes the same expected site artifact to GitHub Pages.
- [x] Any temporary runtime compatibility setting is documented inline in workflow config.

## Implementation Notes

- Prefer action version upgrades that explicitly support Node 24 runtime.
- If no upgrade path exists yet, use explicit runtime opt-in and record removal follow-up.

## Completion

- Date: 2026-04-02
- Outcome: Upgraded deploy-pages v4→v5 in gh-pages.yml for Node 24 runtime compatibility.
- Descoped ACs:
