import { describe, expect, it } from 'vitest';

import {
  formatDisplayTime,
  getDayDifference,
  inputDateToIso,
} from './dateUtils';

describe('dateUtils', () => {
  describe('inputDateToIso', () => {
    it('converts local input date to ISO in the target zone', () => {
      const iso = inputDateToIso('2026-03-06T12:15', 'Europe/Zurich');
      expect(iso).toContain('2026-03-06T12:15');
      expect(iso.endsWith('Z')).toBe(false);
    });

    it('round-trips: parsing and reformatting yields the same wall-clock time', () => {
      const input = '2026-07-15T14:30';
      const zone = 'Europe/Zurich';
      const iso = inputDateToIso(input, zone);
      // The ISO string must preserve wall-clock hour and minute
      expect(iso).toContain('14:30');
      expect(iso).toBeTruthy();
    });
  });

  describe('getDayDifference', () => {
    it('returns 0 for the same calendar day', () => {
      const diff = getDayDifference(
        '2026-03-06T10:00:00+01:00',
        '2026-03-06T08:00:00+01:00',
        'Europe/Zurich'
      );
      expect(diff).toBe(0);
    });

    it('returns 1 for the next calendar day', () => {
      const diff = getDayDifference(
        '2026-03-07T01:00:00+01:00',
        '2026-03-06T21:00:00+01:00',
        'Europe/Zurich'
      );
      expect(diff).toBe(1);
    });

    it('returns 1 for a cross-midnight case expressed as UTC (timezone-aware)', () => {
      // 2026-03-06T23:30Z is 2026-03-07T00:30+01:00 in Europe/Zurich → next day
      const diff = getDayDifference(
        '2026-03-06T23:30:00Z',
        '2026-03-06T08:00:00Z',
        'Europe/Zurich'
      );
      expect(diff).toBe(1);
    });

    it('returns -1 for a date earlier than the reference', () => {
      const diff = getDayDifference(
        '2026-03-05T10:00:00+01:00',
        '2026-03-06T10:00:00+01:00',
        'Europe/Zurich'
      );
      expect(diff).toBe(-1);
    });
  });

  describe('formatDisplayTime', () => {
    const isoWithOffset = '2026-03-06T14:30:00+01:00';

    it('returns HH:mm from the embedded offset when useStationTime is true', () => {
      const result = formatDisplayTime(isoWithOffset, 'America/New_York', true);
      expect(result).toBe('14:30');
    });

    it('converts to the target zone when useStationTime is false', () => {
      // +01:00 → UTC is 13:30; UTC → America/New_York (EST = UTC-5) → 08:30
      const result = formatDisplayTime(
        isoWithOffset,
        'America/New_York',
        false
      );
      expect(result).toBe('08:30');
    });

    it('returns the same time when targetZone matches the offset', () => {
      const result = formatDisplayTime(isoWithOffset, 'Europe/Zurich', false);
      expect(result).toBe('14:30');
    });
  });
});
