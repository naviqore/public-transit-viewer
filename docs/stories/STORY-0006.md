# STORY-0006: Replace custom benchmark tooltip

## Status

OPEN

## Context

`PortalTooltip` in `src/components/BenchmarkTab.tsx` is custom position/portal logic with high maintenance cost.

## Scope

- Replace `PortalTooltip` implementation with a lightweight library-backed tooltip solution.
- Apply replacement only in `BenchmarkTab.tsx` for this story.

## Acceptance Criteria

- [ ] Custom `PortalTooltip` logic is removed from `BenchmarkTab.tsx`.
- [ ] Tooltip behavior remains usable on desktop and mobile.
- [ ] `npm run check` and `npm run build` pass.

## Implementation Notes

Prefer `@floating-ui/react` or Radix Tooltip. Keep API simple and avoid design changes.

## Completion

- Date:
- Outcome:
