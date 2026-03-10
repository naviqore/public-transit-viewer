# STORY-0020: Remove obsolete files and fix stale story index

## Status

OPEN

## Context

A routine housekeeping sweep found two things worth cleaning up:

1. **`INSTRUCTIONS.md` (repo root)** — a two-line redirect stub that has been
   superseded by `.github/copilot-instructions.md` and
   `.github/instructions/frontend.instructions.md`. It is tracked in git and
   misleads anyone who opens it looking for current guidance.

2. **`docs/stories/INDEX.md` stale rows** — STORY-0018 and STORY-0019 are both
   marked `OPEN` in the index table, but their story files and git history
   confirm they are `CLOSED`. Agents that read the index will incorrectly pick
   them up as work to do.

No application logic or build configuration is affected by either change.

## Scope

- Delete `INSTRUCTIONS.md` from the repository root.
- Update `docs/stories/INDEX.md` to change STORY-0018 and STORY-0019 from
  `OPEN` to `CLOSED`.

## Acceptance Criteria

- [ ] `INSTRUCTIONS.md` no longer exists in the repository (file deleted, change staged).
- [ ] `docs/stories/INDEX.md` shows STORY-0018 as `CLOSED`.
- [ ] `docs/stories/INDEX.md` shows STORY-0019 as `CLOSED`.
- [ ] `npm run check` passes after the changes.

## Implementation Notes

- No source file changes; `npm run check` should be fast (type-check + lint +
  format + test:run).
- Commit type: `chore(cleanup)`.

## Completion

- Date:
- Outcome:
- Descoped ACs:
