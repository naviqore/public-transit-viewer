# Implement Existing Story

Implement `STORY-00XX`.

Follow `.github/copilot-instructions.md` for all rules. Steps:

1. Read the story file and all impacted source files.
2. Set story status to `IN_PROGRESS`.
3. Implement approved scope only; check each AC as `- [x]` when satisfied.
4. Run `npm run ci`, present results and proposed commit message.
5. Ask: _"Do you want me to commit and close the story?"_
6. On approval: `HUSKY=0 git commit` for the implementation, then a separate
   `docs(stories):` commit closing the story.
