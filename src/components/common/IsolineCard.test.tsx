import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import IsolineCard from './IsolineCard';
import { StopConnection } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Mirrors the canonical formula now used in IsolinePage.processedIsolines. */
function computeTravelDurationSeconds(
  departureTime: string,
  arrivalTime: string
): number {
  return (
    (new Date(arrivalTime).getTime() - new Date(departureTime).getTime()) / 1000
  );
}

const BASE_STOP: StopConnection['stop'] = {
  id: 'stop-1',
  name: 'Test Stop',
  coordinates: { latitude: 47.3, longitude: 8.5 },
};

const BASE_LEG: StopConnection['connectingLeg'] = {
  type: 'ROUTE',
  from: { latitude: 47.3, longitude: 8.5 },
  to: { latitude: 47.4, longitude: 8.6 },
  fromStop: BASE_STOP,
  toStop: BASE_STOP,
  departureTime: '2026-01-01T10:00:00Z',
  arrivalTime: '2026-01-01T10:30:00Z',
  duration: 1800, // 30 min in seconds (set by IsolinePage post-processing)
  trip: undefined,
};

function makeItem(overrides: Partial<StopConnection> = {}): StopConnection {
  return {
    stop: BASE_STOP,
    departureTime: '2026-01-01T10:00:00Z',
    arrivalTime: '2026-01-01T10:30:00Z',
    transfers: 0,
    connectingLeg: BASE_LEG,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Duration derivation formula tests (STORY-0013 acceptance criterion)
// ---------------------------------------------------------------------------

describe('computeTravelDurationSeconds', () => {
  it('returns correct duration for a 30-minute trip (DEPARTURE scenario)', () => {
    const dep = '2026-01-01T10:00:00Z';
    const arr = '2026-01-01T10:30:00Z';
    expect(computeTravelDurationSeconds(dep, arr)).toBe(1800);
    expect(Math.round(computeTravelDurationSeconds(dep, arr) / 60)).toBe(30);
  });

  it('returns correct duration for a 45-minute trip (ARRIVAL scenario)', () => {
    // Under ARRIVAL time-type the query time differs, but the formula is identical
    const dep = '2026-01-01T09:00:00Z';
    const arr = '2026-01-01T09:45:00Z';
    expect(computeTravelDurationSeconds(dep, arr)).toBe(2700);
    expect(Math.round(computeTravelDurationSeconds(dep, arr) / 60)).toBe(45);
  });

  it('uses arrivalTime − departureTime regardless of TimeType', () => {
    // DEPARTURE: queryStart is dep; ARRIVAL: queryStart is arr.
    // Both old branches would yield different results when using queryStart.
    // The new formula always yields arrivalTime − departureTime.
    const dep = '2026-01-01T08:00:00Z';
    const arr = '2026-01-01T08:20:00Z';
    const result = computeTravelDurationSeconds(dep, arr);
    expect(result).toBe(1200); // 20 min
  });
});

// ---------------------------------------------------------------------------
// IsolineCard rendering tests
// ---------------------------------------------------------------------------

describe('IsolineCard duration display', () => {
  it('shows minutes from connection.duration when present and non-zero', () => {
    const item = makeItem({
      connection: {
        duration: 1800, // 30 min
        legs: [],
        transfers: 0,
      },
      connectingLeg: { ...BASE_LEG, duration: 999 }, // different — must NOT be used
    });

    render(
      <IsolineCard
        id="iso-stop-1"
        item={item}
        isHighlighted={false}
        isExpanded={false}
        onToggle={vi.fn()}
        formatTime={(s) => s}
      />
    );

    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('falls back to connectingLeg.duration when connection.duration is 0', () => {
    const item = makeItem({
      connection: {
        duration: 0, // triggers old bug — should now fall back
        legs: [],
        transfers: 0,
      },
      connectingLeg: { ...BASE_LEG, duration: 1500 }, // 25 min
    });

    render(
      <IsolineCard
        id="iso-stop-2"
        item={item}
        isHighlighted={false}
        isExpanded={false}
        onToggle={vi.fn()}
        formatTime={(s) => s}
      />
    );

    expect(screen.getByText('25 min')).toBeInTheDocument();
  });

  it('falls back to connectingLeg.duration when connection is null', () => {
    const item = makeItem({
      connection: null,
      connectingLeg: { ...BASE_LEG, duration: 3600 }, // 60 min
    });

    render(
      <IsolineCard
        id="iso-stop-3"
        item={item}
        isHighlighted={false}
        isExpanded={false}
        onToggle={vi.fn()}
        formatTime={(s) => s}
      />
    );

    expect(screen.getByText('60 min')).toBeInTheDocument();
  });

  it('falls back to connectingLeg.duration when connection is undefined', () => {
    const item = makeItem({
      connection: undefined,
      connectingLeg: { ...BASE_LEG, duration: 900 }, // 15 min
    });

    render(
      <IsolineCard
        id="iso-stop-4"
        item={item}
        isHighlighted={false}
        isExpanded={false}
        onToggle={vi.fn()}
        formatTime={(s) => s}
      />
    );

    expect(screen.getByText('15 min')).toBeInTheDocument();
  });
});
