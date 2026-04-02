# STORY-0048: Update CI actions for Node 24 runtime compatibility

## Status

CLOSED

## Type

ci

## Context

Current GitHub Actions pipeline emits Node.js 20 deprecation warnings in CI for
`actions/setup-node@v4` and `actions/upload-artifact@v4`.

GitHub announced JavaScript actions moving to Node 24 by default, so CI workflow definitions
must be updated to avoid compatibility risks.

## Scope

- Update CI workflow actions and/or runtime opts to remove Node 20 deprecation warnings for
  setup-node and upload-artifact.
- Keep workflow behavior unchanged beyond runtime compatibility hardening.

## Acceptance Criteria

- [x] CI workflow runs without Node.js 20 deprecation warnings related to setup-node.
- [x] CI workflow runs without Node.js 20 deprecation warnings related to upload-artifact.
- [x] CI workflow changes are documented in workflow comments or notes when a temporary compatibility
      flag is used.

## Implementation Notes

- Prefer upgrading actions to versions that declare Node 24 compatibility where available.
- If action updates are blocked, use explicit Node 24 runtime opt-in and document why.

## Completion

- Date: 2026-04-02
- Outcome: Upgraded setup-node v4→v6 and upload-pages-artifact v3→v4 in gh-pages.yml; all CI workflows now use Node 24-compatible action versions.
- Descoped ACs:
