# Commit Gate

Before committing, provide:

1. Summary of changed files with references.
2. AC checklist (satisfied / descoped / remaining).
3. `npm run ci` outcome, explicitly confirming warning-free output.
4. Formatting status (`npm run format:check`).
5. If closing a story: confirmation that story file and `docs/stories/INDEX.md` were both updated and formatted.
6. Proposed commit message.

Ask: _"Do you want me to commit and close the story?"_

On approval: `HUSKY=0 git commit` in a **single commit** that includes implementation, story file,
and index update. **Verify working tree is clean after commit; if index was auto-formatted,
amend the commit to include it.** See `.github/copilot-instructions.md` for full story closure and commit rules.
