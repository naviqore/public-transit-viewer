import { getGradientColor } from '../constants';

export type IsolineColorMode = 'travelTime' | 'transfers';

/** Discrete color palette for transfer count buckets. */
export const TRANSFER_COLORS: Record<number, string> = {
  0: '#10b981', // green  — direct connection
  1: '#4f46e5', // indigo — one transfer
  2: '#d946ef', // fuchsia — two transfers
};

const TRANSFER_FALLBACK = '#f59e0b'; // amber — three or more transfers

/** Maps a raw transfer count to a display color. */
export function getTransferColor(transfers: number): string {
  return TRANSFER_COLORS[transfers] ?? TRANSFER_FALLBACK;
}

/**
 * Returns the color for an isoline stop or path segment based on the active
 * color mode. Pure function — suitable for direct unit testing.
 */
export function getIsolineColor(
  mode: IsolineColorMode,
  durationMin: number,
  maxDuration: number,
  transfers: number
): string {
  return mode === 'transfers'
    ? getTransferColor(transfers)
    : getGradientColor(durationMin, maxDuration);
}
