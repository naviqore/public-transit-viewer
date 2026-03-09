import { DateTime } from 'luxon';

/** Returns all IANA timezone identifiers supported by the browser's Intl API, falling back to UTC. */
export const getAllTimezones = (): string[] => {
  const intlWithSupportedValues = Intl as typeof Intl & {
    supportedValuesOf?: (key: 'timeZone') => string[];
  };

  if (intlWithSupportedValues.supportedValuesOf) {
    return intlWithSupportedValues.supportedValuesOf('timeZone');
  }
  return ['UTC'];
};

/** Returns the local timezone identifier from the browser's Intl API. */
export const getLocalTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/** Formats an ISO timestamp for display; uses station-embedded offset when `useStationTime` is true, otherwise converts to `targetZone`. */
export const formatDisplayTime = (
  isoString: string,
  targetZone: string,
  useStationTime: boolean
): string => {
  const dt = DateTime.fromISO(isoString);

  if (useStationTime) {
    return dt.toFormat('HH:mm');
  } else {
    return dt.setZone(targetZone).toFormat('HH:mm');
  }
};

/** Converts a local datetime-string from a `<input type="datetime-local">` to a timezone-aware ISO string in `targetZone`. */
export const inputDateToIso = (
  localDateStr: string,
  targetZone: string
): string => {
  return (
    DateTime.fromISO(localDateStr, { zone: targetZone }).toISO() ||
    new Date().toISOString()
  );
};

/** Returns the current local time formatted for `<input type="datetime-local">` in the user's selected `targetZone`. */
export const getCurrentInputTime = (targetZone: string): string => {
  return DateTime.now().setZone(targetZone).toFormat("yyyy-MM-dd'T'HH:mm");
};

/**
 * Calculate day difference respecting the target timezone logic.
 */
export const getDayDifference = (
  isoDate: string,
  referenceIsoDate: string,
  targetZone: string
): number => {
  const start = DateTime.fromISO(referenceIsoDate)
    .setZone(targetZone)
    .startOf('day');
  const current = DateTime.fromISO(isoDate).setZone(targetZone).startOf('day');
  const diff = current.diff(start, 'days');
  return Math.round(diff.days);
};
