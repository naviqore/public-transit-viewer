# STORY-0006: Replace custom benchmark tooltip

## Status

CLOSED

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

- Date: 2026-03-06
- Outcome: Replaced custom benchmark tooltip with `@floating-ui/react` and added focused tooltip interaction tests.
