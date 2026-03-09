# STORY-0015: Documentation and comment style cleanup

## Status

OPEN

## Context

A full-codebase documentation audit (2026-03-09) found no dead code or unused files —
the project is clean in that regard. However, two comment-quality issues need attention:

1. **Obvious section-divider comments** in JSX and hooks that add noise without adding
   information (e.g. `{/* Header */}`, `// 1. Initialize Map`).
2. **Missing JSDoc/TSDoc** on complex exported hooks, services, utilities, and props interfaces
   where a short high-level description would materially help IDE users and reviewers.

The goal is a consistent, minimal commenting style: remove what is obvious, add what is not.

## Scope

### Remove obvious comments (~10–15 instances across these files)

- `src/components/AboutDialog.tsx` — `/* Header / Brand */`
- `src/components/ExploreConfigDialog.tsx` — `/* Header */`, `/* Body */`, `/* Footer */`
- `src/components/Layout.tsx` — `{/* Links */}`, `{/* Dot */}` and similar structural labels
- `src/components/Map.tsx` — numbered section markers (`// 1. Initialize Map`, `// 2. Resize Observer`, etc.)
- `src/components/common/IsolineCard.tsx` — `{/* Header Row */}`, `{/* Expanded Detail View */}`
- `src/components/common/TripTimeline.tsx` — `{/* Upper Line Segment */}`, `{/* Dot */}`, `{/* Lower Line Segment */}`
- `src/contexts/DomainContext.tsx` — state-group banners (`// Server Capabilities`, `// Explore Page State`, etc.)
- `src/components/Toast.tsx` — `// Auto dismiss after 3 seconds`
- `src/components/common/StopSearch.tsx` — verbose keep-effect comment
- `src/components/common/ConnectionCard.tsx` — calculation comments restating obvious arithmetic

### Add concise JSDoc/TSDoc where the concept is non-obvious (priority order)

**High priority** — complex exported hook / class / props interface:

- `src/hooks/useMapLayers.ts` — `UseMapLayersProps` interface and `useMapLayers` function
- `src/components/Map.tsx` — `MapProps` interface
- `src/services/naviqoreService.ts` — `NaviqoreService` class
- `src/contexts/MonitoringContext.tsx` — `generateRandomRequest`, `runWorker`, `preloadStops`

**Medium priority** — non-obvious utility / algorithm / service method:

- `src/utils/dataUtils.ts` — `getLegStopTimes`
- `src/utils/dateUtils.ts` — all six exported functions
- `src/hooks/mapLayers/stopIcons.ts` — `createStopIcon`, `isValidCoordinate`
- `src/services/RealDataProvider.ts` — `fetch` private method and error-handling logic
- `src/components/monitor/PerformanceTab.tsx` — `normalizeUrlPath`, `aggregateLogs`
- `src/components/monitor/LogListTab.tsx` — `formatLogUrl`

## Acceptance Criteria

- [ ] All obvious section-divider or self-evident inline comments listed in **Scope → Remove**
      are deleted; no functional code is changed.
- [ ] Each high-priority item has a concise `/** ... */` block (≤ 5 lines) that explains the
      _concept_, not the implementation steps. Adding more than 5 lines is a signal to split
      the component instead.
- [ ] Each medium-priority item has at minimum a one-liner JSDoc sentence.
- [ ] Comment style rule applied uniformly: `/** ... */` for exported API docs, `//` for
      single-line implementation notes, no `/* */` block comments for inline usage.
- [ ] No new comments introduced that restate what variable names already say.
- [ ] `npm run check` passes with no type errors or lint warnings.
- [ ] `npm run test:run` passes (comment-only changes should not affect tests).

## Implementation Notes

- Do not rename or restructure anything in this story — pure comment changes only.
- If adding a JSDoc block would reveal that a function is too large to summarise in 5 lines,
  flag it for a future refactor story; do not refactor in this story.
- Keep each touched file's diff reviewable in isolation.

## Completion

- Date:
- Outcome:
- Descoped ACs:
