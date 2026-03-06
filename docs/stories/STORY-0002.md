# STORY-0002: Remove JetBrains .idea folder

## Status

CLOSED

## Context

The repository targets VS Code workflows. JetBrains project metadata in `.idea/` is editor-specific noise and should not be committed.

## Scope

- Remove `.idea/` from the repository.
- Add/update ignore rules so `.idea/` is not reintroduced.

## Acceptance Criteria

- [x] `.idea/` is removed from git-tracked files.
- [x] `.gitignore` includes `.idea/`.
- [x] `npm run check` still passes.

## Implementation Notes

Keep this story strictly about repository hygiene; do not combine with unrelated tooling changes.

## Completion

- Date: 2026-03-06
- Outcome: Removed tracked `.idea/` files from git, added `.idea/` ignore rule, and verified `npm run check` passes.
