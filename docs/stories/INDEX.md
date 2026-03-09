# Story Index

Use this file as the local agent-readable backlog. Keep IDs sequential and never reuse IDs.

## Status Rules

- `OPEN`: ready for implementation
- `IN_PROGRESS`: currently being implemented
- `CLOSED`: completed and merged

## Selection Rule for Agents

- Pick the highest-numbered story with status `OPEN`.
- When work starts, set status to `IN_PROGRESS`.
- When done, set status to `CLOSED` and add completion date + short outcome.

## Stories

> Rows are ordered newest-first. Insert new stories at the top of the table.

| ID         | Status | Title                                  | Owner      | Notes                                                                                                           |
| ---------- | ------ | -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| STORY-0012 | CLOSED | Reorder story index to newest-first    | unassigned | Completed 2026-03-09: reversed table row order and documented newest-first convention                           |
| STORY-0011 | OPEN   | Introduce TanStack Query incrementally | unassigned | Migrate one fetch flow                                                                                          |
| STORY-0010 | OPEN   | Reduce manual layout calc CSS          | unassigned | Move scaffolding to TSX                                                                                         |
| STORY-0009 | CLOSED | Split map layer rendering helpers      | unassigned | Completed 2026-03-09: extracted stopIcons.ts and popups.ts from useMapLayers; fixed line tooltip cursor overlap |
| STORY-0008 | CLOSED | Improve service error result model     | unassigned | Completed 2026-03-06: introduced explicit provider success/failure model and propagated ProblemDetail metadata  |
| STORY-0007 | CLOSED | Enable strict typing cleanup slice     | unassigned | Completed 2026-03-06: removed local any usage in DomainContext slice and added focused tests                    |
| STORY-0006 | CLOSED | Replace custom benchmark tooltip       | unassigned | Completed 2026-03-06: replaced custom tooltip with Floating UI and added focused tests                          |
| STORY-0005 | CLOSED | Extract ErrorBoundary component        | unassigned | Completed 2026-03-06: extracted ErrorBoundary to common component and added focused tests                       |
| STORY-0004 | CLOSED | Move Tailwind config out of HTML       | unassigned | Completed 2026-03-06: moved Tailwind config to repo files and fixed theme/spacing regressions                   |
| STORY-0003 | CLOSED | Remove index.html import map           | unassigned | Completed 2026-03-06: removed import map, validated build/tests/dev boot                                        |
| STORY-0002 | CLOSED | Remove JetBrains .idea folder          | unassigned | Completed 2026-03-06: removed tracked .idea files and enforced ignore rule                                      |
| STORY-0001 | CLOSED | Bootstrap story workflow and templates | unassigned | Completed 2026-03-06: baseline, release, testing, and story workflow setup                                      |
