import { act, render } from '@testing-library/react';
import { Dispatch, SetStateAction } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from 'vitest';

import { DEFAULT_QUERY_CONFIG } from '../constants';
import IsolinePage from './IsolinePage';
import { useDomain } from '../contexts/DomainContext';
import { useMonitoring } from '../contexts/MonitoringContext';
import { useSettings } from '../contexts/SettingsContext';
import { naviqoreService } from '../services/naviqoreService';
import { IsolineState, Stop, StopConnection, TimeType } from '../types';

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
    expandedStopId: null,
    ...overrides,
  };
}

const makeDomainValue = (
  isolineState: IsolineState,
  setIsolineState: Mock<Dispatch<SetStateAction<IsolineState>>>
) => ({
  exploreState: {} as any,
  setExploreState: vi.fn() as unknown as Dispatch<SetStateAction<any>>,
  routingState: {} as any,
  setRoutingState: vi.fn() as unknown as Dispatch<SetStateAction<any>>,
  isolineState,
  setIsolineState,
  serverInfo: { schedule: null, routing: null },
  backendStatus: 'ok' as const,
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(useMonitoring).mockReturnValue({
    addToast: vi.fn(),
  } as any);
  vi.mocked(useSettings).mockReturnValue({
    timezone: 'UTC',
    useStationTime: false,
    queryConfig: DEFAULT_QUERY_CONFIG,
    setQueryConfig: vi.fn(),
  } as any);
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
    vi.mocked(useDomain).mockReturnValue(
      makeDomainValue(state, vi.fn() as any)
    );

    await act(async () => {
      render(<IsolinePage />);
    });
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
    vi.mocked(useDomain).mockReturnValue(
      makeDomainValue(state, vi.fn() as any)
    );

    await act(async () => {
      render(<IsolinePage />);
    });

    await vi.runAllTimersAsync();

    expect(naviqoreService.getIsolines).not.toHaveBeenCalled();
  });

  it('calls service when lastQueriedKey is stale (inputs changed)', async () => {
    const state = makeIsolineState({ lastQueriedKey: 'stale-key' });
    vi.mocked(useDomain).mockReturnValue(
      makeDomainValue(state, vi.fn() as any)
    );

    await act(async () => {
      render(<IsolinePage />);
    });
    await vi.runAllTimersAsync();

    expect(naviqoreService.getIsolines).toHaveBeenCalledTimes(1);
  });

  it('calls service only once across two mount cycles with identical inputs', async () => {
    let isolineState = makeIsolineState({ lastQueriedKey: null });
    const setIsolineState = vi.fn((updater: SetStateAction<IsolineState>) => {
      isolineState =
        typeof updater === 'function'
          ? (updater as (prevState: IsolineState) => IsolineState)(isolineState)
          : (updater as IsolineState);
    }) as unknown as Mock<Dispatch<SetStateAction<IsolineState>>>;

    vi.mocked(useDomain).mockImplementation(() =>
      makeDomainValue(isolineState, setIsolineState)
    );

    const { unmount } = render(<IsolinePage />);
    await vi.runAllTimersAsync();
    expect(naviqoreService.getIsolines).toHaveBeenCalledTimes(1);
    expect(isolineState.lastQueriedKey).not.toBeNull();

    await act(async () => {
      unmount();
    });

    await act(async () => {
      render(<IsolinePage />);
    });
    await vi.runAllTimersAsync();
    expect(naviqoreService.getIsolines).toHaveBeenCalledTimes(1);
  });

  it('clears lastQueriedKey on fetch failure enabling retry on remount (AC3)', async () => {
    vi.spyOn(naviqoreService, 'getIsolines')
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue({ data: [], duration: 1, status: 200 });

    let isolineState = makeIsolineState({ lastQueriedKey: null });
    const setIsolineState = vi.fn((updater: SetStateAction<IsolineState>) => {
      isolineState =
        typeof updater === 'function'
          ? (updater as (prevState: IsolineState) => IsolineState)(isolineState)
          : (updater as IsolineState);
    }) as unknown as Mock<Dispatch<SetStateAction<IsolineState>>>;

    vi.mocked(useDomain).mockImplementation(() =>
      makeDomainValue(isolineState, setIsolineState)
    );

    const { unmount } = render(<IsolinePage />);
    await vi.runAllTimersAsync();
    expect(naviqoreService.getIsolines).toHaveBeenCalledTimes(1);
    expect(isolineState.lastQueriedKey).toBeNull();

    await act(async () => {
      unmount();
    });

    await act(async () => {
      render(<IsolinePage />);
    });

    await vi.runAllTimersAsync();
    expect(naviqoreService.getIsolines).toHaveBeenCalledTimes(2);
  });
});

describe('IsolinePage stale response cancellation (STORY-0026)', () => {
  it('ignores response when effect cleanup runs while fetch is in-flight', async () => {
    let resolveDeferred!: (v: {
      data: StopConnection[];
      duration: number;
      status: number;
    }) => void;
    const deferred = new Promise<{
      data: StopConnection[];
      duration: number;
      status: number;
    }>((resolve) => {
      resolveDeferred = resolve;
    });
    vi.mocked(naviqoreService.getIsolines).mockReturnValueOnce(deferred as any);

    let isolineState = makeIsolineState({ lastQueriedKey: null });
    const setIsolineState = vi.fn((updater: SetStateAction<IsolineState>) => {
      isolineState =
        typeof updater === 'function'
          ? (updater as (prevState: IsolineState) => IsolineState)(isolineState)
          : (updater as IsolineState);
    }) as unknown as Mock<Dispatch<SetStateAction<IsolineState>>>;

    vi.mocked(useDomain).mockImplementation(() =>
      makeDomainValue(isolineState, setIsolineState)
    );

    const { unmount } = render(<IsolinePage />);
    await vi.runAllTimersAsync();
    expect(naviqoreService.getIsolines).toHaveBeenCalledTimes(1);

    const callsBeforeCancel = setIsolineState.mock.calls.length;

    await act(async () => {
      unmount();
    });

    await act(async () => {
      resolveDeferred({ data: [], duration: 1, status: 200 });
      await Promise.resolve();
    });

    expect(setIsolineState.mock.calls.length).toBe(callsBeforeCancel);
  });
});
