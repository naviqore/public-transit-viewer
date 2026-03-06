# STORY-0011: Introduce TanStack Query incrementally

## Status

OPEN

## Context

Data fetching is currently hand-managed in multiple pages/contexts. TanStack Query can reduce boilerplate and improve caching/retry behavior.

## Scope

- Add TanStack Query setup (`QueryClientProvider`) to app providers.
- Migrate one low-risk fetch flow (for example schedule/routing capability fetch) to Query.

## Acceptance Criteria

- [ ] Query client is initialized once at app root/provider level.
- [ ] One existing fetch flow is migrated and working.
- [ ] Existing monitoring/logging behavior remains compatible.

## Implementation Notes

This story is an adoption foothold only; migrate additional flows in later stories.

## Completion

- Date:
- Outcome:
