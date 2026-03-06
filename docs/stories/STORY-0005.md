# STORY-0005: Extract ErrorBoundary component

## Status

OPEN

## Context

`ErrorBoundary` is currently embedded in `App.tsx`. Moving it into `src/components/common/` improves reusability and keeps `App.tsx` focused on composition.

## Scope

- Create `src/components/common/ErrorBoundary.tsx`.
- Move existing boundary logic from `App.tsx` into the new component.
- Update `App.tsx` imports and usage.

## Acceptance Criteria

- [ ] `App.tsx` no longer contains inline `ErrorBoundary` class/component implementation.
- [ ] New `ErrorBoundary` component preserves existing fallback behavior.
- [ ] `npm run check` passes.

## Implementation Notes

No behavior redesign in this story; extraction only.

## Completion

- Date:
- Outcome:
