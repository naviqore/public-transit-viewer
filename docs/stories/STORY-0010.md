# STORY-0010: Reduce manual layout calc CSS

## Status

CLOSED

## Context

Layout scaffolding currently depends on manual calc-based CSS. The codebase style favors utility-driven layout in components.

## Scope

- Move one layout scaffold segment from `Layout.css` into `Layout.tsx` utility classes.
- Remove corresponding manual `calc(...)` usage for that segment.

## Acceptance Criteria

- [ ] At least one core layout segment no longer depends on manual `calc(...)` in `Layout.css`.
- [ ] Desktop and mobile layout behavior remains correct.
- [ ] `npm run build` passes.

## Implementation Notes

Keep this story narrowly scoped; avoid full rewrite of layout architecture.

## Completion

- Date: 2026-03-09
- Outcome: Descoped. Reviewed codebase — `Layout.tsx` is already fully Tailwind-driven. Only one `calc()` remains in `PageStyles.css` (`left: calc(var(--nav-width-desktop) + var(--panel-width-desktop))`) and it is the semantically correct tool for the job; replacing it would require hardcoding pixel values or custom JIT tokens that are less readable. No actionable work remains.
- Descoped ACs:
  - `- [~]` At least one core layout segment no longer depends on manual `calc(...)` — descoped: the single remaining `calc()` is necessary and correct; removing it would reduce clarity.
