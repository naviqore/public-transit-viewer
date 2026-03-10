# New Story

I want to: `<description>`.

Do not implement code yet.

First steps:

- Infer the story type from the description:
  - `feat` — new user-visible capability
  - `fix` — corrects broken or incorrect behavior
  - `style` — visual/cosmetic only, no logic change
  - `refactor` — internal restructuring, no behavior change
  - `perf` — measurable performance improvement
  - `test` — test coverage or quality improvement
  - `chore` — tooling, config, dependencies, cleanup
  - `build` — build system or packaging changes
  - `ci` — CI/CD pipeline changes
  - `docs` — documentation only
- Create a new story in `docs/stories/` using `docs/stories/STORY_TEMPLATE.md`.
- Set the `Type` field to the inferred type (single value, no alternatives).
- Update `docs/stories/INDEX.md` with the next sequential ID and type (insert at the top).
- Keep the story small, reviewable, and testable.
- Write acceptance criteria appropriate to the type.

Then:

- Stop and ask for review/approval of the story text.
- Only after approval, commit the story and updated index following the
  commit guidelines in `.github/copilot-instructions.md`.
