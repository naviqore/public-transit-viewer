# STORY-0047: Stabilize release automation with strict quality gate

## Status

CLOSED

## Type

ci

## Context

Release Please updates `CHANGELOG.md`, and the repository quality gate currently fails on
`npm run format:check` because generated changelog content is not Prettier-compliant.

In addition, the GitHub Pages demo workflow can be started manually (`workflow_dispatch`) and is
also triggered on published releases. Manual runs currently fail with `actions/deploy-pages`
HTTP 404 when repository Pages settings are not enabled/configured, which creates confusion about
expected deployment behavior.

We need a clear CI strategy that keeps the warning-free quality gate strict for maintained source
files while handling release-generated artifacts in a deterministic way.

## Scope

- Define and implement a CI-safe strategy for Release Please-managed `CHANGELOG.md` formatting
  (for example: exclude generated changelog from format checks, or auto-format/persist it in
  release automation).
- Ensure `npm run check` remains strict and deterministic in CI for repository-maintained files.
- Clarify and align GitHub Pages deployment triggers (`release` and optional `workflow_dispatch`)
  with documented intent.
- Add explicit prerequisite checks/documentation for GitHub Pages enablement so manual runs fail
  with actionable guidance instead of ambiguous errors.
- Update workflow and/or README documentation so release and deploy behavior is understandable to
  maintainers.

## Acceptance Criteria

- [x] Running `npm run check` in CI is no longer blocked by Release Please-generated changelog
      formatting drift.
- [x] The chosen changelog strategy is documented with rationale in repository docs and/or workflow
      comments.
- [x] Demo deployment workflow trigger behavior is explicit (release-driven and manual behavior are
      intentionally defined, not accidental).
- [x] Manual deployment failure mode for missing Pages setup is documented with clear remediation.
- [x] The release + deploy flow is reproducible for maintainers without ad-hoc manual fixes.

## Implementation Notes

- Prefer preserving strict formatting checks for application code and configuration files.
- If `workflow_dispatch` is retained, document it as a deliberate backfill/retry mechanism.
- If `workflow_dispatch` is removed, ensure release-triggered deployment remains sufficient.
- Keep changes focused to CI/workflow/docs unless a small script is needed for determinism.

## Completion

- Date: 2026-04-02
- Outcome: Added deterministic changelog formatting strategy by excluding `CHANGELOG.md` from
  Prettier checks, documented release/deploy behavior, retained manual deploy trigger by design,
  and added a preflight Pages enablement check with actionable remediation in the deploy workflow.
- Descoped ACs:
