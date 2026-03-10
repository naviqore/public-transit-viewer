# STORY-0025: Backend connectivity status indicator

## Status

IN_PROGRESS

## Context

When the frontend fails to reach the backend at startup (or after a settings
change), the UI gives no persistent visual signal beyond a transient toast.
Two additional problems follow from this:

1. The About dialog continues to show "Loading schedule info…" / "Loading
   router info…" indefinitely — the user has no way to tell that the fetch
   failed rather than simply being slow.
2. There is no ambient indicator on the chrome (logo / settings entry) that
   something is wrong, so users may be confused about why features do not work.

The fix introduces a `backendStatus` field in `DomainContext` that
distinguishes three states — **loading**, **ok**, **error** — and surfaces a
red dot badge in two places: the desktop sidebar logo and the mobile
Settings → About entry. The About dialog itself replaces the infinite
"Loading…" placeholders with an explicit "Unreachable" banner.

## Scope

- Extend `DomainContext` to track `backendStatus: 'loading' | 'ok' | 'error'`.
- Add a small red dot badge over the logo button in the desktop sidebar
  (`Layout.tsx`) when `backendStatus === 'error'`.
- Add the same red dot badge next to the About entry logo in
  `SettingsPage.tsx` (mobile) when `backendStatus === 'error'`.
- Replace the "Loading schedule info…" / "Loading router info…" fallback
  strings in `AboutDialog.tsx` with a context-aware component that shows:
  - a subtle spinner while `backendStatus === 'loading'`
  - an "Unreachable" / N/A banner when `backendStatus === 'error'`
  - real data when `backendStatus === 'ok'`
- No global blocking spinner on app start — keep the existing optimistic
  render-then-populate approach.
- Add/update unit tests for the `backendStatus` state transitions in
  `DomainContext.test.tsx`.

## Acceptance Criteria

- [ ] `DomainContext` exposes `backendStatus: 'loading' | 'ok' | 'error'`
      and sets it correctly based on the fetch outcome.
- [ ] A red dot badge (absolute-positioned, aria-labelled) appears on the
      desktop logo button when the backend is unreachable and disappears once
      the backend is reachable again.
- [ ] The same red dot badge appears on the About logo in the mobile Settings
      page when the backend is unreachable.
- [ ] The About dialog shows a brief spinner while `backendStatus === 'loading'`
      instead of the "Loading…" text, giving users a clear transient signal.
- [ ] The About dialog shows a clearly styled "Unreachable" / "N/A" state (not
      a spinner and not the existing italic grey text) for schedule and router
      sections when `backendStatus === 'error'`.
- [ ] When the backend becomes reachable again (e.g. URL changed in settings),
      `backendStatus` resets to `'loading'` and then resolves to `'ok'`.
- [ ] Unit tests cover: initial `'loading'` state, transition to `'ok'` on
      success, transition to `'error'` on fetch failure.
- [ ] `npm run ci` passes.

## Implementation Notes

- Add `backendStatus` alongside `serverInfo` in `DomainContextType`; keep the
  existing `serverInfo` shape unchanged.
- The red dot badge should be a small `<span>` (≈ 8 px) with
  `bg-red-500 rounded-full` positioned `absolute top-0 right-0` inside the
  logo button wrapper, with `aria-label="Backend unreachable"` for
  accessibility.
- Prefer `WifiOff` (lucide-react) or a plain red pill chip for the "Unreachable"
  state in AboutDialog; keep the design consistent with
  the existing `FeatureRow` chip style.
- Do not add a global blocking spinner; the existing skeleton placeholders are
  the correct pattern for a fast call.

## Completion

- Date:
- Outcome:
- Descoped ACs:
