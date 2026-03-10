# STORY-0022: Improve toast error messages for backend failures

## Status

OPEN

## Context

The current toast notification system fires for every HTTP 4xx/5xx and network failure, which is good, but the messages it shows are too generic to be actionable:

- The title is always `"Network Request Failed"` or `"API Error 422"` — no context about what the user was doing.
- The `details` line shows raw backend metadata (`requestId=xxx type=…`) or raw request URLs — developer noise rather than user-readable text.
- Error toasts auto-dismiss in 3 seconds, which is often too short to read both the title and the details line.
- All three feature pages (`ConnectPage`, `ExplorePage`, `IsolinePage`) catch API errors with a plain `console.error(e)` and silently clear their result list — the auto-toast from the service subscriber is the sole user signal, and it gives no page context.

The goal is to make the toast layer genuinely informative: tell the user what they were trying to do and why it failed, in plain language, without exposing internal HTTP plumbing.

## Scope

1. **Longer auto-dismiss for error toasts** — extend the `Toast` component's timeout from 3 s to 6 s when `notification.type === 'error'`.
2. **Human-readable details** — update the auto-toast logic in `MonitoringContext` to derive the `details` field from `log.error` (the backend `ProblemDetail` message) when available, and fall back to a plain "The server could not complete the request." rather than exposing the raw URL or metadata tags.
3. **Contextual page-level error toasts** — in each feature page, add an `addToast` call inside the `catch` block (in addition to the existing auto-toast) with a descriptive message matching the operation:
   - `ConnectPage` fetch: `"Could not load connections"` / details from the caught error message.
   - `ExplorePage` departures fetch: `"Could not load departures"` / details from the caught error message.
   - `IsolinePage` isolines fetch: `"Could not load isolines"` / details from the caught error message.
   - `ExplorePage` map click (nearest stops): `"Could not find nearby stops"` / details from the caught error message.

   This gives the auto-toast a human label to complement the per-page toast, and keeps both non-redundant by focusing on different information (the auto-toast captures HTTP-level facts; the page toast captures intent/context).

   > Note: suppress the page-level toast when the user simply cleared the inputs (null stop) — only fire it when an actual API call was attempted.

4. **Strip raw metadata from `details`** — the helper that builds `details` for the auto-toast (`log.error`) currently produces strings like `"No routes found requestId=abc-123 type=http://…"`. Strip the `requestId=` and `type=` suffixes before showing them to users (they belong in the console/log, not in a UI notification). The `RequestLog` keeps the full string for the system-monitor log panel; only sanitise the version shown in the toast.

## Acceptance Criteria

- [ ] Error toasts auto-dismiss after **6 seconds** (not 3); success/warning/info remain at 3 s.
- [ ] The auto-toast `details` field never shows a raw URL or `requestId=` / `type=` metadata suffix.
- [ ] `ConnectPage` shows a toast with message `"Could not load connections"` when the connections API call fails.
- [ ] `ExplorePage` shows a toast with message `"Could not load departures"` when the departures API call fails.
- [ ] `IsolinePage` shows a toast with message `"Could not load isolines"` when the isolines API call fails.
- [ ] `ExplorePage` map click shows a toast with message `"Could not find nearby stops"` when the nearest-stops call fails.
- [ ] No toast is shown on pages when a search is not yet active (e.g., no stop selected, inputs empty).
- [ ] `npm run check` passes with no type errors or lint violations.

## Implementation Notes

- To vary dismiss time by type, pass a `duration` prop (or derive it from `notification.type`) in `Toast.tsx` and use it in the `useEffect` timer:
  ```tsx
  const duration = notification.type === 'error' ? 6000 : 3000;
  ```
- For detail sanitisation, add a small `sanitiseToastDetail` utility next to the existing `toLogErrorMessage` helper in `MonitoringContext.tsx` (or as a pure private function). Strip trailing ` requestId=…` and ` type=…` segments using a regex replace.
- Page-level `addToast` calls should use `useMonitoring()` — the hook is already available in the app.
- Extract the caught error's human message with the existing `ServiceRequestError.message` (which already contains the backend `ProblemDetail.message`).
- Add/update unit tests for any changed utility logic (`sanitiseToastDetail` if extracted to utils) and for the Toast component (duration variation).

## Completion

- Date:
- Outcome:
- Descoped ACs:
