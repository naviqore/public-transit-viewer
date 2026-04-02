# STORY-0050: Lock mock settings when controlled by mode or environment

## Status

CLOSED

## Type

fix

## Context

The settings UI allows changes that should be blocked under two conditions:

- when mock data mode is enabled, API endpoint remains editable
- when mock data mode is fixed by environment variables, users can still toggle the setting

Environment-controlled values are authoritative and must remain visible but non-overridable.

## Scope

- Make API endpoint input non-editable while mock data mode is enabled.
- Keep mock mode toggle visible but non-interactive when configured as fixed via environment.
- Ensure locked/fixed state is clearly reflected in the UI.

## Acceptance Criteria

- [x] When mock mode is enabled, API endpoint is visible and non-editable.
- [x] When mock mode is fixed via environment, toggle is visible and cannot be changed.
- [x] Fixed-by-environment settings cannot be overridden through normal UI interactions.
- [x] Relevant UI/state tests cover locked behavior for endpoint and mock-mode toggle.

## Implementation Notes

- Preserve existing settings architecture and source-of-truth semantics.
- Avoid hiding controls; display them as disabled/read-only with clear state cues.

## Completion

- Date: 2026-04-02
- Outcome: API endpoint locks when mock mode is on; mock toggle shows as locked with env badge when ENABLE_MOCK_DATA is set; 6 focused tests added.
- Descoped ACs:
