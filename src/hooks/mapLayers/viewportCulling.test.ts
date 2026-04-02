import { describe, expect, it } from 'vitest';

import {
  filterIsolinePathsByBounds,
  filterStopsByBounds,
  GeoBounds,
  isPointInBounds,
} from './viewportCulling';
import { Leg, Stop } from '../../types';

const bounds: GeoBounds = {
  south: 46.0,
  west: 7.0,
  north: 48.0,
  east: 9.0,
};

const makeStop = (id: string, lat: number, lng: number): Stop => ({
  id,
  name: id,
  coordinates: { latitude: lat, longitude: lng },
});

const makePath = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): { legs: Leg[] } => ({
  legs: [
    {
      type: 'ROUTE',
      from: { latitude: fromLat, longitude: fromLng },
      to: { latitude: toLat, longitude: toLng },
      departureTime: '',
      arrivalTime: '',
    },
  ],
});

describe('isPointInBounds', () => {
  it('returns true for a point inside the bounds', () => {
    expect(isPointInBounds(47.0, 8.0, bounds)).toBe(true);
  });

  it('returns true for a point on the boundary', () => {
    expect(isPointInBounds(46.0, 7.0, bounds)).toBe(true);
    expect(isPointInBounds(48.0, 9.0, bounds)).toBe(true);
  });

  it('returns false for a point outside the bounds', () => {
    expect(isPointInBounds(45.0, 8.0, bounds)).toBe(false);
    expect(isPointInBounds(47.0, 10.0, bounds)).toBe(false);
  });
});

describe('filterStopsByBounds', () => {
  const inside = makeStop('a', 47.0, 8.0);
  const outside = makeStop('b', 50.0, 12.0);
  const edge = makeStop('c', 46.0, 7.0);

  it('keeps stops inside and on the edge', () => {
    const result = filterStopsByBounds([inside, outside, edge], bounds);
    expect(result).toEqual([inside, edge]);
  });

  it('returns empty array when no stops are in bounds', () => {
    expect(filterStopsByBounds([outside], bounds)).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(filterStopsByBounds([], bounds)).toEqual([]);
  });
});

describe('filterIsolinePathsByBounds', () => {
  it('keeps paths with at least one endpoint in bounds', () => {
    const inside = makePath(47, 8, 47.5, 8.5);
    const fromInside = makePath(47, 8, 50, 12);
    const toInside = makePath(50, 12, 47, 8);
    const outside = makePath(50, 12, 51, 13);

    const result = filterIsolinePathsByBounds(
      [inside, fromInside, toInside, outside],
      bounds
    );
    expect(result).toEqual([inside, fromInside, toInside]);
  });

  it('excludes paths with no legs', () => {
    const noLeg = { legs: [] as Leg[] };
    expect(filterIsolinePathsByBounds([noLeg], bounds)).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(filterIsolinePathsByBounds([], bounds)).toEqual([]);
  });
});
