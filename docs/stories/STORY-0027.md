# STORY-0027: Tighten Route.transportMode to the TransportMode enum

## Status

IN_PROGRESS

## Type

refactor

## Context

`Route.transportMode` in `src/types.ts` is typed as `string` with an inline
comment listing valid values, while `TransportMode` enum already exists in the
same file. The loose type allows invalid strings to propagate silently through
`TRANSPORT_COLORS` lookups, `TransportIcon` rendering, and `QueryConfig.travelModes`
filtering without any compiler error.

## Scope

- Change `Route.transportMode` from `string` to `TransportMode`.
- Fix any downstream compile errors that surface (likely runtime-only today).
- The `transportModeDescription?: string` field is unrelated and stays as-is.

## Acceptance Criteria

- [x] `Route.transportMode` is typed as `TransportMode` (not `string`).
- [x] `npm run typecheck` passes with no new errors.
- [x] No runtime behaviour changes; existing tests pass.

## Implementation Notes

After the type change, the compiler will flag any place where a raw string is
assigned to `transportMode` (e.g., from API JSON response). Those sites should
cast via `as TransportMode` or validate through a helper. Favour a narrow cast
at the single deserialization boundary rather than widening the type.

## Completion

- Date:
- Outcome:
- Descoped ACs:
