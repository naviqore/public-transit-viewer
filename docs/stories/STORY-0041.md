# STORY-0041: Unify story implementation and closure into one commit

## Status

CLOSED

## Type

docs

## Context

The current workflow requires two commits for story work: one implementation commit and one separate docs(stories) closure commit. This can split related context across commits and make history noisier for small and medium changes.

## Scope

- Update repository instructions to make story implementation and story closure a single commit by default.
- Update agent prompt templates so commit guidance consistently follows the single-commit story workflow.
- Ensure the workflow still requires index updates and formatting checks before commit.

## Acceptance Criteria

- [x] Story workflow in .github/copilot-instructions.md requires closing the story in the same implementation commit.
- [x] Prompt templates that describe story implementation/commit flow are updated to the same single-commit behavior.
- [x] The workflow still explicitly requires updating docs/stories/INDEX.md and keeping it formatted.

## Implementation Notes

Keep this as a docs/process-only change; do not alter source code or runtime behavior.

## Completion

- Date: 2026-03-31
- Outcome: Unified story implementation and closure into single commit workflow per repo best practice; updated .github/copilot-instructions.md, implement-existing-story.prompt.md, and commit-gate.prompt.md to require story file/index updates in same commit; maintains explicit formatting and index update requirements.
- Descoped ACs:
