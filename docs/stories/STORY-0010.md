# STORY-0010: Reduce manual layout calc CSS

## Status

OPEN

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

- Date:
- Outcome:
