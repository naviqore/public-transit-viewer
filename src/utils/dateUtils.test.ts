import { describe, expect, it } from 'vitest';

import { getDayDifference, inputDateToIso } from './dateUtils';

describe('dateUtils', () => {
  it('converts local input date to ISO in the target zone', () => {
    const iso = inputDateToIso('2026-03-06T12:15', 'Europe/Zurich');
    expect(iso).toContain('2026-03-06T12:15');
    expect(iso.endsWith('Z')).toBe(false);
  });

  it('computes day differences in a given timezone', () => {
    const diff = getDayDifference(
      '2026-03-07T01:00:00+01:00',
      '2026-03-06T21:00:00+01:00',
      'Europe/Zurich'
    );
    expect(diff).toBe(1);
  });
});
