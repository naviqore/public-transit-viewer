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

| ID         | Type     | Status | Title                                                         | Owner      | Notes                                                                                                               |
| ---------- | -------- | ------ | ------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| STORY-0038 | feat     | OPEN   | Show staleness indicator for cached query results             | unassigned |                                                                                                                     |
| STORY-0037 | fix      | OPEN   | Use formatDisplayTime for map popup timestamps                | unassigned |                                                                                                                     |
| STORY-0036 | refactor | OPEN   | Centralise map tile layer URLs in constants                   | unassigned |                                                                                                                     |
| STORY-0035 | fix      | OPEN   | Fix dynamically generated Tailwind classes in BenchmarkTab    | unassigned |                                                                                                                     |
| STORY-0034 | fix      | OPEN   | Surface non-404 autocomplete errors instead of silencing them | unassigned |                                                                                                                     |
| STORY-0033 | fix      | OPEN   | Improve ErrorBoundary error surfacing and reset               | unassigned |                                                                                                                     |
| STORY-0032 | fix      | OPEN   | Make benchmark seed stops backend-agnostic                    | unassigned |                                                                                                                     |
| STORY-0031 | refactor | OPEN   | Extract benchmark engine out of MonitoringContext             | unassigned |                                                                                                                     |
| STORY-0030 | refactor | OPEN   | Extract ephemeral page state out of DomainContext             | unassigned |                                                                                                                     |
| STORY-0029 | perf     | OPEN   | Memoize updateState helpers in page components                | unassigned |                                                                                                                     |
| STORY-0028 | fix      | CLOSED | Fix compiler errors and missing useEffect deps in IsolinePage | 2026-03-12 | CSS import type error fixed via vite-env.d.ts; useEffect dep arrays fully corrected                                 |
| STORY-0027 | refactor | CLOSED | Tighten Route.transportMode to the TransportMode enum         | unassigned | 2026-03-12                                                                                                          |
| STORY-0026 | fix      | CLOSED | Cancel stale fetch requests on dependency change              | unassigned | 2026-03-12 — cancelled flag guards all state writes in three pages; stale-response tests added                      |
| STORY-0025 | feat     | CLOSED | Backend connectivity status indicator                         | unassigned | Red dot badge on desktop logo + mobile About entry when backend unreachable; fix infinite "Loading…" in AboutDialog |
| STORY-0024 | perf     | CLOSED | Skip redundant backend queries on page switch                 | unassigned | Completed 2026-03-10: lastQueriedKey guard + map bounds + selection + scroll restore across all three pages         |
| STORY-0023 | ci       | CLOSED | Fix CI failures and unify the quality gate                    | unassigned | Fix timezone bug in dateUtils; promote import/order to error; unify pre-commit, CI, and agent instructions          |
| STORY-0022 | fix      | CLOSED | Improve toast error messages for backend failures             | unassigned | Extend error dismiss to 6 s; strip raw metadata from details; add contextual page-level toasts for each feature     |
| STORY-0021 | feat     | CLOSED | Mobile fullscreen dialog pages                                | unassigned | Replace modal dialogs with fullscreen pages + back button on mobile; keep desktop modals unchanged                  |
| STORY-0020 | chore    | CLOSED | Remove obsolete files and fix stale story index               | unassigned | Completed 2026-03-10: deleted INSTRUCTIONS.md stub; STORY-0018/0019 rows were already CLOSED in index               |
| STORY-0019 | test     | CLOSED | Improve unit tests for utils and service layer                | unassigned | Add/extend tests for `dataUtils`, `dateUtils`, `naviqoreService`; raise coverage thresholds after                   |
| STORY-0018 | ci       | CLOSED | Fix CI quality gate and pre-commit coverage gap               | unassigned | Lower vitest coverage thresholds to current actuals; add `test:coverage` to pre-commit hook                         |
| STORY-0017 | style    | CLOSED | Rename browser tab title                                      | unassigned | Change `<title>` to "Naviqore \| Public Transit Viewer"                                                             |
| STORY-0016 | ci       | CLOSED | Production-ready Docker image and CI/CD                       | unassigned | Multi-stage Dockerfile, PR build-check workflow, release-publish to ghcr.io                                         |
| STORY-0015 | docs     | CLOSED | Documentation and comment style cleanup                       | unassigned | Remove obvious comments; add JSDoc to complex hooks, services, utilities; enforce consistent style                  |
| STORY-0014 | feat     | CLOSED | Isoline map colour-mode toggle                                | unassigned | Toggle between travel-time gradient and transfer-count discrete palette; add matching legend                        |
| STORY-0013 | fix      | CLOSED | Align isoline list travel time with map                       | unassigned | Fix card duration fallback so list and map always show the same minute value                                        |
| STORY-0012 | chore    | CLOSED | Reorder story index to newest-first                           | unassigned | Completed 2026-03-09: reversed table row order and documented newest-first convention                               |
| STORY-0011 | refactor | CLOSED | Introduce TanStack Query incrementally                        | unassigned | Descoped 2026-03-09: conflicts with context-lifted state and monitoring wrapper; no benefit at current scale        |
| STORY-0010 | style    | CLOSED | Reduce manual layout calc CSS                                 | unassigned | Descoped 2026-03-09: Layout.tsx already Tailwind-driven; one remaining calc() is semantically necessary             |
| STORY-0009 | refactor | CLOSED | Split map layer rendering helpers                             | unassigned | Completed 2026-03-09: extracted stopIcons.ts and popups.ts from useMapLayers; fixed line tooltip cursor overlap     |
| STORY-0008 | refactor | CLOSED | Improve service error result model                            | unassigned | Completed 2026-03-06: introduced explicit provider success/failure model and propagated ProblemDetail metadata      |
| STORY-0007 | refactor | CLOSED | Enable strict typing cleanup slice                            | unassigned | Completed 2026-03-06: removed local any usage in DomainContext slice and added focused tests                        |
| STORY-0006 | refactor | CLOSED | Replace custom benchmark tooltip                              | unassigned | Completed 2026-03-06: replaced custom tooltip with Floating UI and added focused tests                              |
| STORY-0005 | refactor | CLOSED | Extract ErrorBoundary component                               | unassigned | Completed 2026-03-06: extracted ErrorBoundary to common component and added focused tests                           |
| STORY-0004 | refactor | CLOSED | Move Tailwind config out of HTML                              | unassigned | Completed 2026-03-06: moved Tailwind config to repo files and fixed theme/spacing regressions                       |
| STORY-0003 | chore    | CLOSED | Remove index.html import map                                  | unassigned | Completed 2026-03-06: removed import map, validated build/tests/dev boot                                            |
| STORY-0002 | chore    | CLOSED | Remove JetBrains .idea folder                                 | unassigned | Completed 2026-03-06: removed tracked .idea files and enforced ignore rule                                          |
| STORY-0001 | chore    | CLOSED | Bootstrap story workflow and templates                        | unassigned | Completed 2026-03-06: baseline, release, testing, and story workflow setup                                          |
