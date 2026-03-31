import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TransportMode, TimeType } from '../types';
import { RealDataProvider } from './RealDataProvider';

describe('RealDataProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
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

    expect(response.ok).toBe(false);
    expect(response.status).toBe(0);
    if (!response.ok) {
      expect(response.error.message).toBe('Network request failed.');
      expect(response.error.detail).toBe('network down');
    }
  });

  it('maps RFC ProblemDetail responses to structured provider errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          title: 'Invalid Parameters',
          detail: 'The value of maxTravelDuration must be positive.',
          type: 'tag:naviqore.org:invalid-parameters',
          instance: '/routing/connections?maxTravelDuration=-1',
          requestId: 'req-123',
          errors: {
            maxTravelDuration: {
              rejectedValue: -1,
              message: 'must be positive',
            },
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/problem+json' },
        }
      )
    );

    const provider = new RealDataProvider('http://localhost:8080');
    const response = await provider.getScheduleInfo();

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    if (!response.ok) {
      expect(response.error.message).toBe(
        'Invalid Parameters: The value of maxTravelDuration must be positive.'
      );
      expect(response.error.type).toBe('tag:naviqore.org:invalid-parameters');
      expect(response.error.requestId).toBe('req-123');
      expect(response.error.extras).toEqual({
        errors: {
          maxTravelDuration: {
            rejectedValue: -1,
            message: 'must be positive',
          },
        },
      });
    }
  });
});
