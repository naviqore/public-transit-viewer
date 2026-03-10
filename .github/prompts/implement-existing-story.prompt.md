# Implement Existing Story

Implement `STORY-00XX`.

Requirements:

- Follow all repository instructions.
- Set the story status to `IN_PROGRESS` when work starts.
- Implement only approved scope and acceptance criteria.
- Add/update lean tests for changed logic.
- Run `npm run check` before committing (typecheck + lint + format + tests).

Before committing:

- Summarize what changed with file references.
- Show acceptance criteria checklist with pass/fail status.
- Show test commands run and outcomes.
- Propose one conventional commit message.
  - Keep every body line ≤ 100 characters (commitlint `body-max-line-length` rule).
- Ask once: "Do you want me to commit and close the story?"

When closing the story (after user approval):

- Check all satisfied ACs as `- [x]`; mark descoped ACs as `- [~]` with justification.
- Set story status to `CLOSED`, add completion date and outcome note.
- Update `docs/stories/INDEX.md`: change story row status from `OPEN` to `CLOSED`.
- Stage both `docs/stories/STORY-XXXX.md` and `docs/stories/INDEX.md` in a single `docs(stories):` commit.
