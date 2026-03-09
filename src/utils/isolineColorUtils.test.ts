import { describe, it, expect } from 'vitest';

import {
  getTransferColor,
  getIsolineColor,
  TRANSFER_COLORS,
} from './isolineColorUtils';

describe('getTransferColor', () => {
  it('returns green for 0 transfers (direct)', () => {
    expect(getTransferColor(0)).toBe(TRANSFER_COLORS[0]);
  });

  it('returns indigo for 1 transfer', () => {
    expect(getTransferColor(1)).toBe(TRANSFER_COLORS[1]);
  });

  it('returns fuchsia for 2 transfers', () => {
    expect(getTransferColor(2)).toBe(TRANSFER_COLORS[2]);
  });

  it('returns amber fallback for 3 transfers', () => {
    expect(getTransferColor(3)).toBe('#f59e0b');
  });

  it('returns amber fallback for 10+ transfers', () => {
    expect(getTransferColor(10)).toBe('#f59e0b');
  });

  it('direct connection color differs from 1-transfer color', () => {
    expect(getTransferColor(0)).not.toBe(getTransferColor(1));
  });
});

describe('getIsolineColor — travelTime mode', () => {
  it('delegates to the gradient and returns an rgb() string', () => {
    const color = getIsolineColor('travelTime', 30, 60, 0);
    expect(color).toMatch(/^rgb\(/);
  });

  it('returns a different color for different durations', () => {
    const near = getIsolineColor('travelTime', 5, 60, 0);
    const far = getIsolineColor('travelTime', 55, 60, 0);
    expect(near).not.toBe(far);
  });

  it('ignores transfer count in travelTime mode', () => {
    const a = getIsolineColor('travelTime', 30, 60, 0);
    const b = getIsolineColor('travelTime', 30, 60, 5);
    expect(a).toBe(b);
  });
});

describe('getIsolineColor — transfers mode', () => {
  it('uses transfer palette and ignores duration', () => {
    const slow = getIsolineColor('transfers', 5, 60, 0);
    const fast = getIsolineColor('transfers', 50, 60, 0);
    expect(slow).toBe(fast); // same 0-transfer color regardless of duration
    expect(slow).toBe(TRANSFER_COLORS[0]);
  });

  it('maps each transfer bucket to a distinct color', () => {
    expect(getIsolineColor('transfers', 0, 60, 0)).toBe(TRANSFER_COLORS[0]);
    expect(getIsolineColor('transfers', 0, 60, 1)).toBe(TRANSFER_COLORS[1]);
    expect(getIsolineColor('transfers', 0, 60, 2)).toBe(TRANSFER_COLORS[2]);
    expect(getIsolineColor('transfers', 0, 60, 3)).toBe('#f59e0b');
  });
});
