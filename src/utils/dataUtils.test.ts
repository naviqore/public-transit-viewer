import { describe, expect, it } from 'vitest';

import { Leg, Stop, StopTime } from '../types';
import { getLegStopTimes } from './dataUtils';

const makeStop = (id: string): Stop => ({
  id,
  name: `Stop ${id}`,
  coordinates: { latitude: 0, longitude: 0 },
});

const makeStopTime = (
  stopId: string,
  arrivalTime: string,
  departureTime: string
): StopTime => ({
  stop: makeStop(stopId),
  arrivalTime,
  departureTime,
});

const baseLeg: Leg = {
  type: 'ROUTE',
  from: { latitude: 0, longitude: 0 },
  to: { latitude: 0, longitude: 0 },
  departureTime: '2026-03-06T08:00:00+01:00',
  arrivalTime: '2026-03-06T09:00:00+01:00',
};

describe('getLegStopTimes', () => {
  it('returns [] when trip is undefined', () => {
    const leg: Leg = { ...baseLeg, trip: undefined };
    expect(getLegStopTimes(leg)).toEqual([]);
  });

  it('returns [] when trip.stopTimes is undefined', () => {
    const leg: Leg = {
      ...baseLeg,
      trip: {
        headSign: 'X',
        route: { id: 'r1', name: 'R1', shortName: 'R1', transportMode: 'BUS' },
        bikesAllowed: false,
        wheelchairAccessible: false,
      },
    };
    expect(getLegStopTimes(leg)).toEqual([]);
  });

  it('returns [] when trip.stopTimes is empty', () => {
    const leg: Leg = {
      ...baseLeg,
      trip: {
        headSign: 'X',
        route: { id: 'r1', name: 'R1', shortName: 'R1', transportMode: 'BUS' },
        stopTimes: [],
        bikesAllowed: false,
        wheelchairAccessible: false,
      },
    };
    expect(getLegStopTimes(leg)).toEqual([]);
  });

  it('returns correct slice on exact start+end time+stop match', () => {
    const stopTimes = [
      makeStopTime(
        'A',
        '2026-03-06T07:00:00+01:00',
        '2026-03-06T07:00:00+01:00'
      ),
      makeStopTime(
        'B',
        '2026-03-06T08:00:00+01:00',
        '2026-03-06T08:00:00+01:00'
      ),
      makeStopTime(
        'C',
        '2026-03-06T08:30:00+01:00',
        '2026-03-06T08:30:00+01:00'
      ),
      makeStopTime(
        'D',
        '2026-03-06T09:00:00+01:00',
        '2026-03-06T09:00:00+01:00'
      ),
      makeStopTime(
        'E',
        '2026-03-06T09:30:00+01:00',
        '2026-03-06T09:30:00+01:00'
      ),
    ];
    const leg: Leg = {
      ...baseLeg,
      fromStop: makeStop('B'),
      toStop: makeStop('D'),
      departureTime: '2026-03-06T08:00:00+01:00',
      arrivalTime: '2026-03-06T09:00:00+01:00',
      trip: {
        headSign: 'X',
        route: { id: 'r1', name: 'R1', shortName: 'R1', transportMode: 'BUS' },
        stopTimes,
        bikesAllowed: false,
        wheelchairAccessible: false,
      },
    };

    const result = getLegStopTimes(leg);
    expect(result).toHaveLength(3);
    expect(result[0].stop.id).toBe('B');
    expect(result[1].stop.id).toBe('C');
    expect(result[2].stop.id).toBe('D');
  });

  it('falls back to stop-id-only match when times do not match', () => {
    const stopTimes = [
      makeStopTime(
        'A',
        '2026-03-06T07:00:00+01:00',
        '2026-03-06T07:01:00+01:00'
      ),
      makeStopTime(
        'B',
        '2026-03-06T08:01:00+01:00',
        '2026-03-06T08:02:00+01:00'
      ),
      makeStopTime(
        'C',
        '2026-03-06T08:30:00+01:00',
        '2026-03-06T08:31:00+01:00'
      ),
      makeStopTime(
        'D',
        '2026-03-06T09:01:00+01:00',
        '2026-03-06T09:02:00+01:00'
      ),
    ];
    const leg: Leg = {
      ...baseLeg,
      fromStop: makeStop('B'),
      toStop: makeStop('D'),
      // Times deliberately mismatched from stopTimes to force fallback
      departureTime: '2026-03-06T08:00:00+01:00',
      arrivalTime: '2026-03-06T09:00:00+01:00',
      trip: {
        headSign: 'X',
        route: { id: 'r1', name: 'R1', shortName: 'R1', transportMode: 'BUS' },
        stopTimes,
        bikesAllowed: false,
        wheelchairAccessible: false,
      },
    };

    const result = getLegStopTimes(leg);
    expect(result).toHaveLength(3);
    expect(result[0].stop.id).toBe('B');
    expect(result[1].stop.id).toBe('C');
    expect(result[2].stop.id).toBe('D');
  });

  it('returns synthetic two-stop array when startIdx is -1 and fromStop/toStop are available', () => {
    // Stop IDs not present in trip at all → no match possible
    const stopTimes = [
      makeStopTime(
        'X',
        '2026-03-06T07:00:00+01:00',
        '2026-03-06T07:00:00+01:00'
      ),
      makeStopTime(
        'Y',
        '2026-03-06T08:00:00+01:00',
        '2026-03-06T08:00:00+01:00'
      ),
    ];
    const leg: Leg = {
      ...baseLeg,
      fromStop: makeStop('B'),
      toStop: makeStop('D'),
      departureTime: '2026-03-06T08:00:00+01:00',
      arrivalTime: '2026-03-06T09:00:00+01:00',
      trip: {
        headSign: 'X',
        route: { id: 'r1', name: 'R1', shortName: 'R1', transportMode: 'BUS' },
        stopTimes,
        bikesAllowed: false,
        wheelchairAccessible: false,
      },
    };

    const result = getLegStopTimes(leg);
    expect(result).toHaveLength(2);
    expect(result[0].stop.id).toBe('B');
    expect(result[0].departureTime).toBe('2026-03-06T08:00:00+01:00');
    expect(result[1].stop.id).toBe('D');
    expect(result[1].arrivalTime).toBe('2026-03-06T09:00:00+01:00');
  });

  it('returns synthetic two-stop array when endIdx is -1 and fromStop/toStop are available', () => {
    // Start stop is found, end stop is not in the trip
    const stopTimes = [
      makeStopTime(
        'B',
        '2026-03-06T08:00:00+01:00',
        '2026-03-06T08:00:00+01:00'
      ),
      makeStopTime(
        'C',
        '2026-03-06T08:30:00+01:00',
        '2026-03-06T08:30:00+01:00'
      ),
    ];
    const leg: Leg = {
      ...baseLeg,
      fromStop: makeStop('B'),
      toStop: makeStop('D'),
      departureTime: '2026-03-06T08:00:00+01:00',
      arrivalTime: '2026-03-06T09:00:00+01:00',
      trip: {
        headSign: 'X',
        route: { id: 'r1', name: 'R1', shortName: 'R1', transportMode: 'BUS' },
        stopTimes,
        bikesAllowed: false,
        wheelchairAccessible: false,
      },
    };

    const result = getLegStopTimes(leg);
    expect(result).toHaveLength(2);
    expect(result[0].stop.id).toBe('B');
    expect(result[1].stop.id).toBe('D');
  });

  it('returns full stopTimes when startIdx is -1 and no fromStop/toStop available', () => {
    const stopTimes = [
      makeStopTime(
        'X',
        '2026-03-06T07:00:00+01:00',
        '2026-03-06T07:00:00+01:00'
      ),
      makeStopTime(
        'Y',
        '2026-03-06T08:00:00+01:00',
        '2026-03-06T08:00:00+01:00'
      ),
      makeStopTime(
        'Z',
        '2026-03-06T09:00:00+01:00',
        '2026-03-06T09:00:00+01:00'
      ),
    ];
    const leg: Leg = {
      ...baseLeg,
      // No fromStop / toStop → fallback returns full list
      departureTime: '2026-03-06T08:00:00+01:00',
      arrivalTime: '2026-03-06T09:00:00+01:00',
      trip: {
        headSign: 'X',
        route: { id: 'r1', name: 'R1', shortName: 'R1', transportMode: 'BUS' },
        stopTimes,
        bikesAllowed: false,
        wheelchairAccessible: false,
      },
    };

    const result = getLegStopTimes(leg);
    expect(result).toHaveLength(3);
    expect(result).toBe(stopTimes);
  });
});
