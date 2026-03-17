# STORY-0035: Fix dynamically generated Tailwind classes in BenchmarkTab

## Status

OPEN

## Type

fix

## Context

`BenchmarkTab.tsx` builds Tailwind class strings at runtime using string
manipulation on a `color` prop (e.g.
`color.replace('text-', 'bg-').replace('600', '50')`,
`border-${color.split('-')[1]}-200`). Tailwind JIT cannot statically analyse
these expressions and will not include the generated class names in the
production CSS bundle, causing the selected-scenario highlight style to render
unstyled in production builds.

## Scope

- Replace the dynamic class construction in `ScenarioButton` with a static
  lookup map (e.g., `Record<BenchmarkScenario, { active: string; border: string }>`)
  that maps each scenario value to its full, static Tailwind class strings.
- Ensure the map covers all values of `BenchmarkScenario`.

## Acceptance Criteria

- [ ] All Tailwind classes for scenario button highlight states are statically
      present in source (no runtime string manipulation to form class names).
- [ ] Production build (`npm run build`) renders scenario button highlight
      styles correctly.
- [ ] No visual regression from the current design.
- [ ] Existing `BenchmarkTab.test.tsx` tests pass.

## Implementation Notes

Tailwind's safelist in `tailwind.config.js` is an alternative but couples
config to implementation detail. The static-map approach is preferred as it
keeps style decisions collocated with the component.

## Completion

- Date:
- Outcome:
- Descoped ACs:
