import { act, render } from '@testing-library/react';
import { Dispatch, SetStateAction } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from 'vitest';

import { DEFAULT_QUERY_CONFIG } from '../constants';
import ConnectPage from './ConnectPage';
import { useDomain } from '../contexts/DomainContext';
import { useMonitoring } from '../contexts/MonitoringContext';
import { useSettings } from '../contexts/SettingsContext';
import { naviqoreService } from '../services/naviqoreService';
import { Connection, RoutingState, Stop, TimeType } from '../types';

vi.mock('../components/Map', () => ({ default: () => null }));
vi.mock('../components/QueryConfigDialog', () => ({ default: () => null }));
vi.mock('../contexts/DomainContext');
vi.mock('../contexts/MonitoringContext');
vi.mock('../contexts/SettingsContext');

const mockFromStop: Stop = {
  id: 'from-1',
  name: 'From Stop',
  coordinates: { latitude: 47.5, longitude: 8.7 },
};
const mockToStop: Stop = {
  id: 'to-1',
  name: 'To Stop',
  coordinates: { latitude: 47.6, longitude: 8.8 },
};
const DATE = '2026-01-01T12:00';

function makeRoutingState(overrides: Partial<RoutingState> = {}): RoutingState {
  return {
    fromStop: mockFromStop,
    toStop: mockToStop,
    connections: [],
    selectedConnection: null,
    date: DATE,
    timeType: TimeType.DEPARTURE,
    maxTravelDuration: undefined,
    lastQueriedKey: null,
    ...overrides,
  };
}

const makeDomainValue = (
  routingState: RoutingState,
  setRoutingState: Mock<Dispatch<SetStateAction<RoutingState>>>
) => ({
  exploreState: {} as any,
  setExploreState: vi.fn() as unknown as Dispatch<SetStateAction<any>>,
  routingState,
  setRoutingState,
  isolineState: {} as any,
  setIsolineState: vi.fn() as unknown as Dispatch<SetStateAction<any>>,
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
  vi.spyOn(naviqoreService, 'getConnections').mockResolvedValue({
    data: [],
    duration: 1,
    status: 200,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ConnectPage fetch guard (STORY-0024)', () => {
  it('calls service on mount when lastQueriedKey is null', async () => {
    const state = makeRoutingState({ lastQueriedKey: null });
    vi.mocked(useDomain).mockReturnValue(
      makeDomainValue(state, vi.fn() as any)
    );

    await act(async () => {
      render(<ConnectPage />);
    });
    await vi.runAllTimersAsync();

    expect(naviqoreService.getConnections).toHaveBeenCalledTimes(1);
  });

  it('skips service call when lastQueriedKey already matches current inputs', async () => {
    const queryKey = JSON.stringify({
      fromStopId: mockFromStop.id,
      toStopId: mockToStop.id,
      date: DATE,
      timeType: TimeType.DEPARTURE,
      queryConfig: DEFAULT_QUERY_CONFIG,
      maxTravelDuration: undefined,
    });
    const state = makeRoutingState({ lastQueriedKey: queryKey });
    vi.mocked(useDomain).mockReturnValue(
      makeDomainValue(state, vi.fn() as any)
    );

    await act(async () => {
      render(<ConnectPage />);
    });

    await vi.runAllTimersAsync();

    expect(naviqoreService.getConnections).not.toHaveBeenCalled();
  });

  it('calls service when lastQueriedKey is stale (inputs changed)', async () => {
    const state = makeRoutingState({ lastQueriedKey: 'stale-key' });
    vi.mocked(useDomain).mockReturnValue(
      makeDomainValue(state, vi.fn() as any)
    );

    await act(async () => {
      render(<ConnectPage />);
    });
    await vi.runAllTimersAsync();

    expect(naviqoreService.getConnections).toHaveBeenCalledTimes(1);
  });

  it('calls service only once across two mount cycles with identical inputs', async () => {
    let routingState = makeRoutingState({ lastQueriedKey: null });
    const setRoutingState = vi.fn((updater: SetStateAction<RoutingState>) => {
      routingState =
        typeof updater === 'function'
          ? (updater as (prevState: RoutingState) => RoutingState)(routingState)
          : (updater as RoutingState);
    }) as unknown as Mock<Dispatch<SetStateAction<RoutingState>>>;

    vi.mocked(useDomain).mockImplementation(() =>
      makeDomainValue(routingState, setRoutingState)
    );

    const { unmount } = render(<ConnectPage />);
    await vi.runAllTimersAsync();
    expect(naviqoreService.getConnections).toHaveBeenCalledTimes(1);
    expect(routingState.lastQueriedKey).not.toBeNull();
    await act(async () => {
      unmount();
    });

    await act(async () => {
      render(<ConnectPage />);
    });
    await vi.runAllTimersAsync();
    expect(naviqoreService.getConnections).toHaveBeenCalledTimes(1);
  });

  it('clears lastQueriedKey on fetch failure enabling retry on remount (AC3)', async () => {
    vi.spyOn(naviqoreService, 'getConnections')
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue({ data: [], duration: 1, status: 200 });

    let routingState = makeRoutingState({ lastQueriedKey: null });
    const setRoutingState = vi.fn((updater: SetStateAction<RoutingState>) => {
      routingState =
        typeof updater === 'function'
          ? (updater as (prevState: RoutingState) => RoutingState)(routingState)
          : (updater as RoutingState);
    }) as unknown as Mock<Dispatch<SetStateAction<RoutingState>>>;

    vi.mocked(useDomain).mockImplementation(() =>
      makeDomainValue(routingState, setRoutingState)
    );

    const { unmount } = render(<ConnectPage />);
    await vi.runAllTimersAsync();
    expect(naviqoreService.getConnections).toHaveBeenCalledTimes(1);
    expect(routingState.lastQueriedKey).toBeNull();
    await act(async () => {
      unmount();
    });

    await act(async () => {
      render(<ConnectPage />);
    });
    await vi.runAllTimersAsync();
    expect(naviqoreService.getConnections).toHaveBeenCalledTimes(2);
  });
});

describe('ConnectPage stale response cancellation (STORY-0026)', () => {
  it('ignores response when effect cleanup runs while fetch is in-flight', async () => {
    let resolveDeferred!: (v: {
      data: Connection[];
      duration: number;
      status: number;
    }) => void;
    const deferred = new Promise<{
      data: Connection[];
      duration: number;
      status: number;
    }>((resolve) => {
      resolveDeferred = resolve;
    });
    vi.mocked(naviqoreService.getConnections).mockReturnValueOnce(
      deferred as any
    );

    let routingState = makeRoutingState({ lastQueriedKey: null });
    const setRoutingState = vi.fn((updater: SetStateAction<RoutingState>) => {
      routingState =
        typeof updater === 'function'
          ? (updater as (prevState: RoutingState) => RoutingState)(routingState)
          : (updater as RoutingState);
    }) as unknown as Mock<Dispatch<SetStateAction<RoutingState>>>;

    vi.mocked(useDomain).mockImplementation(() =>
      makeDomainValue(routingState, setRoutingState)
    );

    const { unmount } = render(<ConnectPage />);
    await vi.runAllTimersAsync();
    expect(naviqoreService.getConnections).toHaveBeenCalledTimes(1);

    const callsBeforeCancel = setRoutingState.mock.calls.length;

    await act(async () => {
      unmount();
    });
    await act(async () => {
      resolveDeferred({ data: [], duration: 1, status: 200 });
      await Promise.resolve();
    });

    expect(setRoutingState.mock.calls.length).toBe(callsBeforeCancel);
  });
});
