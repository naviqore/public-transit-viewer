# Commit Gate

Before committing, provide:

1. Acceptance criteria checklist with what passed.
2. Lean test evidence (`npm run check` outcome).
3. Proposed conventional commit message.
   - Every body line must be ≤ 100 characters.

Then ask exactly:
"Do you want me to commit and close the story?"

Wait for explicit user approval before committing.

After committing the implementation:

- Check all satisfied ACs as `- [x]`; mark descoped as `- [~]` with justification.
- Set story status to `CLOSED`, add completion date and short outcome note.
- Update `docs/stories/INDEX.md`: change story row status to `CLOSED`.
- Stage both `docs/stories/STORY-XXXX.md` and `docs/stories/INDEX.md` in a separate `docs(stories):` commit.
