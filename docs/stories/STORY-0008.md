# STORY-0008: Improve service error result model

## Status

CLOSED

## Type

refactor

## Context

Current data provider/service flow can normalize failures too loosely, making UI-level error handling less actionable.

## Scope

- Introduce a clearer success/error result shape for service responses.
- Propagate meaningful error metadata from provider to caller.
- Ensure monitoring/toast layer can display useful error reasons.

## Acceptance Criteria

- [x] Service call sites can distinguish success vs failure without ambiguous fallback objects.
- [x] Error payload includes enough context for user-facing logs/toasts.
- [x] Existing page behavior remains stable under successful responses.

## Implementation Notes

Keep migration incremental and avoid a large refactor in one story.

Backend error contract note:

- API failures use Spring `ProblemDetail` (`application/problem+json`) and may include
  `title`, `detail`, `type`, `instance`, `status`, `requestId`, and extension fields like
  `errors` / `violations`.
- Frontend service layer should preserve these details in a typed error model so monitoring
  and toasts can surface actionable diagnostics.

## Completion

- Date: 2026-03-06
- Outcome: Replaced ambiguous fallback provider responses with a typed success/failure result model and propagated backend ProblemDetail metadata into service errors and request logs, with focused tests for provider parsing and service-level error propagation.
