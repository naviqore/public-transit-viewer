# Implement Existing Story

Implement `STORY-00XX`.

Follow `.github/copilot-instructions.md` for all rules. Steps:

1. Read the story file and all impacted source files.
2. Set story status to `IN_PROGRESS`.
3. Implement approved scope only; check each AC as `- [x]` when satisfied.
   To descope an AC (`- [~]`), ask the user for explicit approval first — one ask per AC.
4. Use the story's `Type` field as the conventional commit type (e.g. `fix(scope): ...`).
5. Run `npm run ci`, ensure output is warning-free (not only error-free), and verify formatting with `npm run format:check`.
6. When closing the story, update `docs/stories/INDEX.md` and keep it formatted.
7. Ask: _"Do you want me to commit and close the story?"_
8. On approval: `HUSKY=0 git commit` for the implementation, then a separate
   `docs(stories):` commit closing the story.
