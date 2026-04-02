# STORY-0052: Widen desktop dialogs

## Status

CLOSED

## Type

style

## Context

The desktop dialogs (About, Query Options, Explore Options) use `max-w-sm` (384px), which feels
narrow on typical desktop screens. Widening them slightly improves readability without affecting
mobile, which uses a fullscreen layout.

## Scope

- Increase the desktop dialog `max-w` in `ResponsiveDialog` from `max-w-sm` to `max-w-md`.
- Mobile layout is unaffected (fullscreen).

## Acceptance Criteria

- [x] Desktop dialog panel is wider than before (max-w-md, 448px).
- [x] Mobile fullscreen layout is unchanged.

## Implementation Notes

Single class change in `ResponsiveDialog.tsx`.

## Completion

- Date: 2026-04-02
- Outcome: Changed `max-w-sm` to `max-w-md` in ResponsiveDialog desktop branch.
- Descoped ACs:
