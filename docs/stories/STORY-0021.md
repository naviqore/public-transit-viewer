# STORY-0021: Mobile fullscreen dialog pages

## Status

OPEN

## Context

On mobile, the current modal dialogs (`AboutDialog`, `QueryConfigDialog`, `ExploreConfigDialog`) feel out of place: they appear as floating cards inside a dark overlay, which is cramped on small screens. Modern native apps (iOS/Android) replace modal dialogs with fullscreen pages that slide in and have a "back" arrow in the top-left corner.

Desktop behavior must be preserved exactly: floating modal with backdrop and an × close button.

## Scope

- Introduce a shared `ResponsiveDialog` wrapper in `src/components/common/`.
- On **mobile** (viewport narrower than Tailwind's `md` breakpoint, i.e. < 768 px):
  - Render as a fullscreen, fixed overlay covering the entire viewport.
  - Show a `←` (ChevronLeft / ArrowLeft) back button in the top-left of the header bar.
  - No backdrop, no close × icon, no border radius on the outer container.
  - Slide-in animation from the bottom or right (iOS/Android convention).
- On **desktop** (≥ 768 px):
  - Preserve the current centered modal overlay with backdrop, rounded corners, × close button, and zoom-in animation.
- Replace the dialog shell (backdrop + outer container + header close/back control) in all three dialog components with `ResponsiveDialog` while keeping their form content unchanged.
- The wrapper must accept a `title` prop for the header text and an `onClose` callback used by both the × (desktop) and back (mobile) buttons.
- `body.overflow = 'hidden'` must still be applied in both modes.

## Acceptance Criteria

- [ ] A `ResponsiveDialog` component exists in `src/components/common/ResponsiveDialog.tsx`.
- [ ] On a viewport < 768 px wide, each dialog renders fullscreen (no visible backdrop or card border-radius) with an `ArrowLeft` icon button in the top-left header.
- [ ] On a viewport ≥ 768 px wide, each dialog renders as the current centered modal (dark backdrop, rounded corners, × button top-right), unchanged from today.
- [ ] Clicking the back button (mobile) calls `onClose`, identical to the × button (desktop).
- [ ] `AboutDialog`, `QueryConfigDialog`, and `ExploreConfigDialog` all use `ResponsiveDialog` for their outer shell.
- [ ] No layout regressions: existing form content, scroll behaviour, and footer buttons are unaffected.
- [ ] `npm run check` passes with no type errors or lint violations.

## Implementation Notes

- Detect viewport width via a `useMediaQuery('(max-width: 767px)')` hook (can be a small inline hook in the component or a shared hook in `src/hooks/`).
- Mobile container: `fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-slate-900 animate-in slide-in-from-bottom duration-300`.
- Desktop container: unchanged from the current dialog wrappers – `fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200`.
- Inner card on desktop: `bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800`.
- The `ResponsiveDialog` must forward `children` into the scrollable body area; the outer shell should only own the header (title + action button) and backdrop.
- Do **not** add backdrop-click-to-close on mobile (there is no backdrop).
- Keep the desktop backdrop-click-to-close behaviour available (optional `onBackdropClick` prop that defaults to `onClose`).

## Completion

- Date:
- Outcome:
- Descoped ACs:
