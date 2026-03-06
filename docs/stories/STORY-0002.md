# STORY-0002: Remove JetBrains .idea folder

## Status

OPEN

## Context

The repository targets VS Code workflows. JetBrains project metadata in `.idea/` is editor-specific noise and should not be committed.

## Scope

- Remove `.idea/` from the repository.
- Add/update ignore rules so `.idea/` is not reintroduced.

## Acceptance Criteria

- [ ] `.idea/` is removed from git-tracked files.
- [ ] `.gitignore` includes `.idea/`.
- [ ] `npm run check` still passes.

## Implementation Notes

Keep this story strictly about repository hygiene; do not combine with unrelated tooling changes.

## Completion

- Date:
- Outcome:
