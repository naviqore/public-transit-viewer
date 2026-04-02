# STORY-0034: Surface non-404 autocomplete errors instead of silencing them

## Status

CLOSED

## Type

fix

## Context

`RealDataProvider.fetch()` contains a special-case for paths that include
`autocomplete`: when the HTTP response is not OK, it returns a fake success
`{ ok: true, data: [], status: 200 }` regardless of the status code.

This was intended to handle the expected 404 from "no results", but it also
silently swallows server errors (401, 403, 500, 503) that the user should know
about. A misconfigured backend or authentication failure becomes invisible.

## Scope

- Narrow the autocomplete silent-success path to HTTP 404 only.
- Allow all other non-OK status codes (`4xx` except 404, `5xx`) to propagate
  as `ProviderFailureResponse` so the service layer can log and toast them.

## Acceptance Criteria

- [x] A 404 from the autocomplete endpoint still yields an empty result array
      with no error toast.
- [x] A 500 or 401 from the autocomplete endpoint surfaces as an error (toasted
      or logged) rather than an empty result.
- [x] `RealDataProvider.test.ts` covers the 404 (silent) and 500 (error) cases.

## Implementation Notes

Change the guard from `path.includes('autocomplete')` to
`response.status === 404` (or add a specific status check) before returning
the fake success payload.

## Completion

- Date: 2026-03-31
- Outcome: Narrowed autocomplete silent-success path to HTTP 404 only; added tests for 404 and 500 cases.
- Descoped ACs: none
