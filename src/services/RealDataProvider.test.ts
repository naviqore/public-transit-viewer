import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TransportMode, TimeType } from '../types';
import { RealDataProvider } from './RealDataProvider';

describe('RealDataProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('converts minute-based routing query config values to seconds', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const provider = new RealDataProvider('http://localhost:8080');

    await provider.getConnections(
      'from-stop',
      'to-stop',
      '2026-03-06T12:00:00+01:00',
      TimeType.DEPARTURE,
      {
        bikeAllowed: false,
        wheelchairAccessible: false,
        travelModes: [TransportMode.RAIL],
        maxWalkDuration: 10,
        minTransferDuration: 4,
        maxTravelDuration: 90,
        timeWindowDuration: 30,
      }
    );

    const firstCallUrl = fetchSpy.mock.calls[0]?.[0];
    expect(typeof firstCallUrl).toBe('string');

    const parsed = new URL(String(firstCallUrl));
    expect(parsed.searchParams.get('maxWalkDuration')).toBe('600');
    expect(parsed.searchParams.get('minTransferDuration')).toBe('240');
    expect(parsed.searchParams.get('maxTravelDuration')).toBe('5400');
    expect(parsed.searchParams.get('timeWindowDuration')).toBe('1800');
  });

  it('returns a safe network-error response when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

    const provider = new RealDataProvider('http://localhost:8080');
    const response = await provider.getScheduleInfo();

    expect(response.status).toBe(0);
    expect(response.error).toBe('Network Error');
  });
});
