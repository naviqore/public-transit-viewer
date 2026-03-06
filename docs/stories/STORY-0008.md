# STORY-0008: Improve service error result model

## Status

OPEN

## Context

Current data provider/service flow can normalize failures too loosely, making UI-level error handling less actionable.

## Scope

- Introduce a clearer success/error result shape for service responses.
- Propagate meaningful error metadata from provider to caller.
- Ensure monitoring/toast layer can display useful error reasons.

## Acceptance Criteria

- [ ] Service call sites can distinguish success vs failure without ambiguous fallback objects.
- [ ] Error payload includes enough context for user-facing logs/toasts.
- [ ] Existing page behavior remains stable under successful responses.

## Implementation Notes

Keep migration incremental and avoid a large refactor in one story.

## Completion

- Date:
- Outcome:
