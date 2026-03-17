# STORY-0023: Fix CI failures and unify the quality gate

## Status

CLOSED

## Type

ci

## Context

CI is currently broken by two independent issues, and the local/CI/pre-commit quality gates are not in sync:

1. **Timezone-dependent test failure** – `formatDisplayTime` in `dateUtils.ts` calls
   `DateTime.fromISO(isoString)` without `{ setZone: true }`. Luxon therefore converts
   the timestamp to the machine's local zone before formatting. On developer machines
   (CET = UTC+1) the test passes; on the CI runner (Ubuntu = UTC) the embedded
   `+01:00` offset is dropped and `'13:30'` is returned instead of the expected `'14:30'`.

2. **ESLint `import/order` violations** – 110+ violations exist across `src/`. Because
   the rule is set to `warn`, they never block CI. They do, however, generate GitHub
   annotation noise on every run and allow the codebase to drift away from the agreed
   import style silently.

3. **Consistency gap** – The pre-commit hook runs `npm run check && npm run test:coverage`,
   which omits the build step. The CI pipeline runs `npm run check && npm run build &&
npm run test:coverage` (= `npm run ci`). A broken production build can therefore
   silently pass pre-commit and reach the CI queue. Similarly, the agent instructions
   direct the agent to run `npm run check` and separately `npm run build`, rather than
   the single canonical `npm run ci`.

## Scope

1. **Fix the timezone bug** – Change `formatDisplayTime` to use
   `DateTime.fromISO(isoString, { setZone: true })` so the embedded offset is always
   honoured, making the function deterministic regardless of the server's local timezone.

2. **Promote `import/order` to `error`** – Update `eslint.config.js` and then
   auto-fix all existing violations with `npm run lint:fix`. This turns a silent warning
   accumulator into a hard gate.

3. **Unify the quality gate** – Change the pre-commit hook to run `npm run ci` (the
   same sequence the CI pipeline executes). Update the copilot workspace instructions
   and the frontend instructions file to state `npm run ci` as the single canonical
   command to run before any handoff.

## Acceptance Criteria

- [x] `formatDisplayTime` uses `{ setZone: true }` so the embedded ISO offset is always
      preserved; the existing test passes in any server timezone (UTC or otherwise).
- [x] `import/order` is promoted from `warn` to `error` in `eslint.config.js`.
- [x] All pre-existing `import/order` violations in `src/` and project-root files
      (`vite.config.ts`) are fixed.
- [x] The pre-commit hook (`.husky/pre-commit`) runs exactly `npm run ci`; no other
      command sequence.
- [x] `copilot-instructions.md` "Required checks before handoff" section is updated to
      specify `npm run ci` as the single canonical local check command.
- [x] `.github/instructions/frontend.instructions.md` "Workflow guardrail" section is
      updated accordingly.
- [x] `npm run ci` exits 0 locally with no errors or warnings.

## Implementation Notes

- `{ setZone: true }` tells Luxon to keep the UTC offset from the parsed string as
  the DateTime's zone instead of converting to the local zone. This is the correct
  semantic for "display the time as the station/schedule intended".
- Run `npm run lint:fix` after promoting `import/order` to `error` to auto-fix the
  majority of violations. Manually verify any that require human judgement.
- The build step in `npm run ci` (via `vite build`) completes in ~3 s locally, so it
  is not prohibitive as a pre-commit check.
- Do not change the `react-hooks/exhaustive-deps` rule level — those disable-comment
  suppressions are intentional and should remain as `warn`.

## Completion

- Date: 2026-03-10
- Outcome: All ACs satisfied. `formatDisplayTime` now uses `{ setZone: true }` for timezone-deterministic behaviour. `import/order` promoted to `error` and all violations fixed. Pre-commit hook and agent instructions unified to `npm run ci`. Added `Loader.test.tsx` to stabilise function-coverage threshold after import reordering changed module-load side effects. `npm run ci` exits 0.
- Descoped ACs: none
