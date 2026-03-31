# STORY-0040: Enforce warning-free quality gate and agent workflow

## Status

IN_PROGRESS

## Type

ci

## Context

Running the canonical quality gate currently produces warnings, which weakens confidence in automated checks and can let avoidable issues accumulate. We need a state-of-the-art, warning-free standard where quality checks fail on warnings and agent guidance explicitly requires warning remediation.

## Scope

- Audit the current quality gate output to identify warning sources.
- Update scripts and/or lint/tool configuration so warnings are treated as failures in the canonical gate.
- Update agent-facing instructions and prompts so warnings are always handled as blocking quality issues.
- Keep docs and workflow guidance aligned with the updated warning policy.

## Acceptance Criteria

- [x] Running npm run ci exits with a non-zero code if lint warnings are present.
- [x] The repository guidance for agents explicitly treats warnings as blocking and requires fixing them before commit approval.
- [x] Existing warning sources in the current gate run are resolved or intentionally converted into failing checks with a documented rationale.
- [x] Updated workflow guidance remains consistent across relevant instruction files and prompts.

## Implementation Notes

Prefer explicit tooling settings (for example, ESLint max-warnings 0) over implicit conventions.

## Completion

- Date:
- Outcome:
- Descoped ACs:
