# STORY-0004: Move Tailwind config out of HTML

## Status

OPEN

## Context

Tailwind is already integrated through `@tailwindcss/vite`. Configuration should live in a root config file, not inline in `index.html`.

## Scope

- Remove Tailwind CDN/config script usage from `index.html`.
- Add a root Tailwind config file (`tailwind.config.ts` or `.js`) if needed.
- Keep `src/styles.css` directives aligned with plugin-based usage.

## Acceptance Criteria

- [ ] No Tailwind CDN/config script remains in `index.html`.
- [ ] Tailwind config is repository-based (root config file) if customization is required.
- [ ] Existing styles render correctly after `npm run build`.

## Implementation Notes

Keep CSS changes minimal and targeted to plugin compatibility.

## Completion

- Date:
- Outcome:
