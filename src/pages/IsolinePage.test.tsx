import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_QUERY_CONFIG } from '../constants';
import IsolinePage from './IsolinePage';
import { useDomain } from '../contexts/DomainContext';
import { useMonitoring } from '../contexts/MonitoringContext';
import { useSettings } from '../contexts/SettingsContext';
import { naviqoreService } from '../services/naviqoreService';
import { IsolineState, Stop, TimeType } from '../types';

vi.mock('../components/Map', () => ({ default: () => null }));
vi.mock('../components/QueryConfigDialog', () => ({ default: () => null }));
vi.mock('../contexts/DomainContext');
vi.mock('../contexts/MonitoringContext');
vi.mock('../contexts/SettingsContext');

const mockStop: Stop = {
  id: 'center-1',
  name: 'Center Stop',
  coordinates: { latitude: 47.5, longitude: 8.7 },
};
const DATE = '2026-01-01T12:00';

function makeIsolineState(overrides: Partial<IsolineState> = {}): IsolineState {
  return {
    centerStop: mockStop,
    isolines: [],
    maxDuration: 30,
    date: DATE,
    lastQueriedKey: null,
    mapBounds: null,
    expandedStopId: null,
    ...overrides,
  };
}

const makeDomainValue = (
  isolineState: IsolineState,
  setIsolineState: ReturnType<typeof vi.fn>
) => ({
  exploreState: {} as never,
  setExploreState: vi.fn(),
  routingState: {} as never,
  setRoutingState: vi.fn(),
  isolineState,
  setIsolineState,
  serverInfo: { schedule: null, routing: null },
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(useMonitoring).mockReturnValue({
    addToast: vi.fn(),
  } as never);
  vi.mocked(useSettings).mockReturnValue({
    timezone: 'UTC',
    useStationTime: false,
    queryConfig: DEFAULT_QUERY_CONFIG,
    setQueryConfig: vi.fn(),
  } as never);
  vi.spyOn(naviqoreService, 'getIsolines').mockResolvedValue({
    data: [],
    duration: 1,
    status: 200,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('IsolinePage fetch guard (STORY-0024)', () => {
  it('calls service on mount when lastQueriedKey is null', async () => {
    const state = makeIsolineState({ lastQueriedKey: null });
    vi.mocked(useDomain).mockReturnValue(makeDomainValue(state, vi.fn()));

    render(<IsolinePage />);
    await vi.runAllTimersAsync();

    expect(naviqoreService.getIsolines).toHaveBeenCalledTimes(1);
  });

  it('skips service call when lastQueriedKey already matches current inputs', async () => {
    const queryKey = JSON.stringify({
      centerStopId: mockStop.id,
      date: DATE,
      timeType: TimeType.DEPARTURE,
      maxDuration: 30,
      queryConfig: DEFAULT_QUERY_CONFIG,
    });
    const state = makeIsolineState({ lastQueriedKey: queryKey });
    vi.mocked(useDomain).mockReturnValue(makeDomainValue(state, vi.fn()));

    render(<IsolinePage />);
    await vi.runAllTimersAsync();

    expect(naviqoreService.getIsolines).not.toHaveBeenCalled();
  });

  it('calls service when lastQueriedKey is stale (inputs changed)', async () => {
    const state = makeIsolineState({ lastQueriedKey: 'stale-key' });
    vi.mocked(useDomain).mockReturnValue(makeDomainValue(state, vi.fn()));

    render(<IsolinePage />);
    await vi.runAllTimersAsync();

    expect(naviqoreService.getIsolines).toHaveBeenCalledTimes(1);
  });

  it('calls service only once across two mount cycles with identical inputs', async () => {
    let isolineState = makeIsolineState({ lastQueriedKey: null });
    const setIsolineState = vi.fn((updater: unknown) => {
      isolineState =
        typeof updater === 'function'
          ? updater(isolineState)
          : { ...isolineState, ...(updater as Partial<IsolineState>) };
    });
    vi.mocked(useDomain).mockImplementation(() =>
      makeDomainValue(isolineState, setIsolineState)
    );

    const { unmount } = render(<IsolinePage />);
    await vi.runAllTimersAsync();
    expect(naviqoreService.getIsolines).toHaveBeenCalledTimes(1);
    expect(isolineState.lastQueriedKey).not.toBeNull();
    unmount();

    // Second mount — key matches, service skipped
    render(<IsolinePage />);
    await vi.runAllTimersAsync();
    expect(naviqoreService.getIsolines).toHaveBeenCalledTimes(1);
  });

  it('clears lastQueriedKey on fetch failure enabling retry on remount (AC3)', async () => {
    vi.spyOn(naviqoreService, 'getIsolines')
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue({ data: [], duration: 1, status: 200 });

    let isolineState = makeIsolineState({ lastQueriedKey: null });
    const setIsolineState = vi.fn((updater: unknown) => {
      isolineState =
        typeof updater === 'function'
          ? updater(isolineState)
          : { ...isolineState, ...(updater as Partial<IsolineState>) };
    });
    vi.mocked(useDomain).mockImplementation(() =>
      makeDomainValue(isolineState, setIsolineState)
    );

    const { unmount } = render(<IsolinePage />);
    await vi.runAllTimersAsync();
    expect(naviqoreService.getIsolines).toHaveBeenCalledTimes(1);
    expect(isolineState.lastQueriedKey).toBeNull();
    unmount();

    // Second mount — key is null → retry
    render(<IsolinePage />);
    await vi.runAllTimersAsync();
    expect(naviqoreService.getIsolines).toHaveBeenCalledTimes(2);
  });
});
