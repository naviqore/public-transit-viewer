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

| ID         | Status | Title                                           | Owner      | Notes                                                                                                           |
| ---------- | ------ | ----------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| STORY-0020 | CLOSED | Remove obsolete files and fix stale story index | unassigned | Completed 2026-03-10: deleted INSTRUCTIONS.md stub; STORY-0018/0019 rows were already CLOSED in index           |
| STORY-0019 | CLOSED | Improve unit tests for utils and service layer  | unassigned | Add/extend tests for `dataUtils`, `dateUtils`, `naviqoreService`; raise coverage thresholds after               |
| STORY-0018 | CLOSED | Fix CI quality gate and pre-commit coverage gap | unassigned | Lower vitest coverage thresholds to current actuals; add `test:coverage` to pre-commit hook                     |
| STORY-0017 | CLOSED | Rename browser tab title                        | unassigned | Change `<title>` to "Naviqore \| Public Transit Viewer"                                                         |
| STORY-0016 | CLOSED | Production-ready Docker image and CI/CD         | unassigned | Multi-stage Dockerfile, PR build-check workflow, release-publish to ghcr.io                                     |
| STORY-0015 | OPEN   | Documentation and comment style cleanup         | unassigned | Remove obvious comments; add JSDoc to complex hooks, services, utilities; enforce consistent style              |
| STORY-0014 | CLOSED | Isoline map colour-mode toggle                  | unassigned | Toggle between travel-time gradient and transfer-count discrete palette; add matching legend                    |
| STORY-0013 | CLOSED | Align isoline list travel time with map         | unassigned | Fix card duration fallback so list and map always show the same minute value                                    |
| STORY-0012 | CLOSED | Reorder story index to newest-first             | unassigned | Completed 2026-03-09: reversed table row order and documented newest-first convention                           |
| STORY-0011 | CLOSED | Introduce TanStack Query incrementally          | unassigned | Descoped 2026-03-09: conflicts with context-lifted state and monitoring wrapper; no benefit at current scale    |
| STORY-0010 | CLOSED | Reduce manual layout calc CSS                   | unassigned | Descoped 2026-03-09: Layout.tsx already Tailwind-driven; one remaining calc() is semantically necessary         |
| STORY-0009 | CLOSED | Split map layer rendering helpers               | unassigned | Completed 2026-03-09: extracted stopIcons.ts and popups.ts from useMapLayers; fixed line tooltip cursor overlap |
| STORY-0008 | CLOSED | Improve service error result model              | unassigned | Completed 2026-03-06: introduced explicit provider success/failure model and propagated ProblemDetail metadata  |
| STORY-0007 | CLOSED | Enable strict typing cleanup slice              | unassigned | Completed 2026-03-06: removed local any usage in DomainContext slice and added focused tests                    |
| STORY-0006 | CLOSED | Replace custom benchmark tooltip                | unassigned | Completed 2026-03-06: replaced custom tooltip with Floating UI and added focused tests                          |
| STORY-0005 | CLOSED | Extract ErrorBoundary component                 | unassigned | Completed 2026-03-06: extracted ErrorBoundary to common component and added focused tests                       |
| STORY-0004 | CLOSED | Move Tailwind config out of HTML                | unassigned | Completed 2026-03-06: moved Tailwind config to repo files and fixed theme/spacing regressions                   |
| STORY-0003 | CLOSED | Remove index.html import map                    | unassigned | Completed 2026-03-06: removed import map, validated build/tests/dev boot                                        |
| STORY-0002 | CLOSED | Remove JetBrains .idea folder                   | unassigned | Completed 2026-03-06: removed tracked .idea files and enforced ignore rule                                      |
| STORY-0001 | CLOSED | Bootstrap story workflow and templates          | unassigned | Completed 2026-03-06: baseline, release, testing, and story workflow setup                                      |
