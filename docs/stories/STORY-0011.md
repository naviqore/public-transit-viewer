# STORY-0011: Introduce TanStack Query incrementally

## Status

CLOSED

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

- Date: 2026-03-09
- Outcome: Descoped. Reviewed fetch architecture — the manual `useEffect` + `loading` state + `naviqoreService` pattern is clean and consistent at current scale. TanStack Query conflicts with: (1) domain state lifted into `DomainContext` as source of truth, (2) the `naviqoreService` monitoring wrapper that tracks per-request timing/metadata. Fetches are imperatively user-triggered (not polling/background), so stale-while-revalidate and cache deduplication provide no benefit. Revisit if the app grows to 10+ independent fetch endpoints.
- Descoped ACs:
  - `- [~]` Query client initialized at app root — descoped: adds ~13 KB dependency with no net benefit at current scale.
  - `- [~]` One existing fetch flow migrated — descoped: conflicts with context-lifted state architecture and monitoring wrapper.
  - `- [~]` Monitoring/logging behavior remains compatible — descoped: compatibility cannot be guaranteed without invasive wrapping.
