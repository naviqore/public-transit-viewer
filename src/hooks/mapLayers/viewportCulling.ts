import { Leg, Stop } from '../../types';

/** Axis-aligned bounding box in geographic coordinates. */
export interface GeoBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** Returns true if the point lies within the given bounds. */
export function isPointInBounds(
  lat: number,
  lng: number,
  bounds: GeoBounds
): boolean {
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lng >= bounds.west &&
    lng <= bounds.east
  );
}

/** Filters stops to only those within the given geographic bounds. */
export function filterStopsByBounds(stops: Stop[], bounds: GeoBounds): Stop[] {
  return stops.filter((s) =>
    isPointInBounds(s.coordinates.latitude, s.coordinates.longitude, bounds)
  );
}

/** Filters isoline connections to those with at least one endpoint in bounds. */
export function filterIsolinePathsByBounds(
  items: { legs: Leg[] }[],
  bounds: GeoBounds
): { legs: Leg[] }[] {
  return items.filter((item) => {
    const leg = item.legs[0];
    if (!leg) return false;
    return (
      isPointInBounds(leg.from.latitude, leg.from.longitude, bounds) ||
      isPointInBounds(leg.to.latitude, leg.to.longitude, bounds)
    );
  });
}
