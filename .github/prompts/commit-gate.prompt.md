# Commit Gate

Before committing, provide:

1. Summary of changed files with references.
2. AC checklist (satisfied / descoped / remaining).
3. `npm run ci` outcome.
4. Proposed commit message.

Ask: _"Do you want me to commit and close the story?"_

On approval: `HUSKY=0 git commit` for the implementation, then a separate
`docs(stories):` commit closing the story. See `.github/copilot-instructions.md`
for full story closure and commit rules.
