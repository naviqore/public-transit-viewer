import { Leg, StopTime } from '../types';

export function getLegStopTimes(leg: Leg): StopTime[] {
  const trip = leg.trip;
  if (!trip || !trip.stopTimes || trip.stopTimes.length === 0) {
    return [];
  }

  const fromId = leg.fromStop?.id;
  const toId = leg.toStop?.id;
  const depTime = leg.departureTime;
  const arrTime = leg.arrivalTime;

  let startIdx = trip.stopTimes.findIndex(
    (st) => st.stop.id === fromId && st.departureTime === depTime
  );

  if (startIdx === -1 && fromId) {
    startIdx = trip.stopTimes.findIndex((st) => st.stop.id === fromId);
  }

  let endIdx = trip.stopTimes.findIndex(
    (st) => st.stop.id === toId && st.arrivalTime === arrTime
  );

  if (endIdx === -1 && toId) {
    endIdx = trip.stopTimes.findIndex(
      (st, i) => i > startIdx && st.stop.id === toId
    );
  }

  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
    if (leg.fromStop && leg.toStop) {
      return [
        {
          stop: leg.fromStop,
          departureTime: leg.departureTime,
          arrivalTime: leg.departureTime,
        },
        {
          stop: leg.toStop,
          departureTime: leg.arrivalTime,
          arrivalTime: leg.arrivalTime,
        },
      ];
    }
    return trip.stopTimes;
  }

  return trip.stopTimes.slice(startIdx, endIdx + 1);
}
