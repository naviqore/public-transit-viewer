# STORY-0012: Reorder story index to newest-first

## Status

CLOSED

## Context

The story index table in `docs/stories/INDEX.md` currently lists stories in ascending order (oldest at the top, newest at the bottom). As the backlog grows, contributors and agents must scroll to the end to find the most recent or active stories. Reversing the order — newest story at the top — aligns with common backlog and changelog conventions and improves discoverability.

## Scope

- Reverse the row order of the story table in `docs/stories/INDEX.md` so that the highest-numbered story appears first.
- Update the "Selection Rule for Agents" section to reflect that agents should still pick the highest-numbered `OPEN` story (the rule stays the same, but now that story will be near the top of the table).
- Add a one-line note in the table header or status-rules section documenting the "newest first" order convention so future contributors and agents know to insert new rows at the top.
- No code changes are required; this is a pure documentation update.

## Acceptance Criteria

- [ ] The story table in `INDEX.md` is ordered newest-to-oldest (STORY-0012 first, STORY-0001 last).
- [ ] New stories must be inserted at the top of the table (documented explicitly in `INDEX.md`).
- [ ] All existing story metadata (ID, status, title, owner, notes) is preserved exactly; no data is lost or modified.
- [ ] The "Selection Rule for Agents" section still correctly states: pick the highest-numbered `OPEN` story.
- [ ] `npm run check` passes with no errors after the change (markdown/lint rules satisfied).

## Implementation Notes

- Edit only `docs/stories/INDEX.md`; no source files touched.
- Reverse the 12 data rows in the table while keeping the header row (`| ID | Status | ... |`) and the separator row (`| --- | --- | ... |`) at the top.
- Add the following sentence to the table preamble (above the table):
  `> Rows are ordered newest-first. Insert new stories at the top of the table.`

## Completion

- Date: 2026-03-09
- Outcome: Reversed INDEX.md table rows (newest-first) and added preamble documenting insert convention. Pure docs change; no code touched.
