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

| ID         | Status | Title                                  | Owner      | Notes                                                                      |
| ---------- | ------ | -------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| STORY-0001 | CLOSED | Bootstrap story workflow and templates | unassigned | Completed 2026-03-06: baseline, release, testing, and story workflow setup |
| STORY-0002 | OPEN   | Remove JetBrains .idea folder          | unassigned | Repo hygiene cleanup                                                       |
| STORY-0003 | OPEN   | Remove index.html import map           | unassigned | Use bundled npm imports                                                    |
| STORY-0004 | OPEN   | Move Tailwind config out of HTML       | unassigned | Root Tailwind config file                                                  |
| STORY-0005 | OPEN   | Extract ErrorBoundary component        | unassigned | Move from App.tsx                                                          |
| STORY-0006 | OPEN   | Replace custom benchmark tooltip       | unassigned | Use Floating UI or Radix                                                   |
| STORY-0007 | OPEN   | Enable strict typing cleanup slice     | unassigned | Remove local any usage                                                     |
| STORY-0008 | OPEN   | Improve service error result model     | unassigned | Propagate actionable errors                                                |
| STORY-0009 | OPEN   | Split map layer rendering helpers      | unassigned | Break up useMapLayers hook                                                 |
| STORY-0010 | OPEN   | Reduce manual layout calc CSS          | unassigned | Move scaffolding to TSX                                                    |
| STORY-0011 | OPEN   | Introduce TanStack Query incrementally | unassigned | Migrate one fetch flow                                                     |
