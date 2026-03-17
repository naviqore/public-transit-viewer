import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_EXPLORE_CONFIG } from '../constants';
import ExplorePage from './ExplorePage';
import { useDomain } from '../contexts/DomainContext';
import { useMonitoring } from '../contexts/MonitoringContext';
import { useSettings } from '../contexts/SettingsContext';
import { naviqoreService } from '../services/naviqoreService';
import { ExploreState, Stop, StopDeparture, TimeType } from '../types';

vi.mock('../components/Map', () => ({ default: () => null }));
vi.mock('../components/ExploreConfigDialog', () => ({ default: () => null }));
vi.mock('../contexts/DomainContext');
vi.mock('../contexts/MonitoringContext');
vi.mock('../contexts/SettingsContext');

const mockStop: Stop = {
  id: 'stop-1',
  name: 'Test Stop',
  coordinates: { latitude: 47.5, longitude: 8.7 },
};
const DATE = '2026-01-01T12:00';

function makeExploreState(overrides: Partial<ExploreState> = {}): ExploreState {
  return {
    selectedStop: mockStop,
    departures: [],
    nearbyStops: [],
    date: DATE,
    config: DEFAULT_EXPLORE_CONFIG,
    lastQueriedKey: null,
    expandedTripIndex: null,
    ...overrides,
  };
}

const makeDomainValue = (
  exploreState: ExploreState,
  setExploreState: ReturnType<typeof vi.fn>
) => ({
  exploreState,
  setExploreState,
  routingState: {} as never,
  setRoutingState: vi.fn(),
  isolineState: {} as never,
  setIsolineState: vi.fn(),
  serverInfo: { schedule: null, routing: null },
  backendStatus: 'ok' as const,
});

beforeEach(() => {
  vi.mocked(useMonitoring).mockReturnValue({
    addToast: vi.fn(),
  } as never);
  vi.mocked(useSettings).mockReturnValue({
    timezone: 'UTC',
    useStationTime: false,
  } as never);
  vi.spyOn(naviqoreService, 'getStopDepartures').mockResolvedValue({
    data: [],
    duration: 1,
    status: 200,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ExplorePage fetch guard (STORY-0024)', () => {
  it('calls service on mount when lastQueriedKey is null', async () => {
    const state = makeExploreState({ lastQueriedKey: null });
    vi.mocked(useDomain).mockReturnValue(makeDomainValue(state, vi.fn()));

    render(<ExplorePage />);

    await waitFor(() =>
      expect(naviqoreService.getStopDepartures).toHaveBeenCalledTimes(1)
    );
  });

  it('skips service call when lastQueriedKey already matches current inputs', async () => {
    const queryKey = JSON.stringify({
      stopId: mockStop.id,
      date: DATE,
      timeType: TimeType.DEPARTURE,
      config: DEFAULT_EXPLORE_CONFIG,
    });
    const state = makeExploreState({ lastQueriedKey: queryKey });
    vi.mocked(useDomain).mockReturnValue(makeDomainValue(state, vi.fn()));

    render(<ExplorePage />);

    await new Promise((r) => setTimeout(r, 50));
    expect(naviqoreService.getStopDepartures).not.toHaveBeenCalled();
  });

  it('calls service when lastQueriedKey is stale (inputs changed)', async () => {
    const state = makeExploreState({ lastQueriedKey: 'stale-key' });
    vi.mocked(useDomain).mockReturnValue(makeDomainValue(state, vi.fn()));

    render(<ExplorePage />);

    await waitFor(() =>
      expect(naviqoreService.getStopDepartures).toHaveBeenCalledTimes(1)
    );
  });

  it('calls service only once across two mount cycles with identical inputs', async () => {
    let exploreState = makeExploreState({ lastQueriedKey: null });
    const setExploreState = vi.fn((updater: unknown) => {
      exploreState =
        typeof updater === 'function'
          ? updater(exploreState)
          : { ...exploreState, ...(updater as Partial<ExploreState>) };
    });
    vi.mocked(useDomain).mockImplementation(() =>
      makeDomainValue(exploreState, setExploreState)
    );

    const { unmount } = render(<ExplorePage />);
    await waitFor(() =>
      expect(naviqoreService.getStopDepartures).toHaveBeenCalledTimes(1)
    );

    // After successful fetch, lastQueriedKey should be set
    expect(exploreState.lastQueriedKey).not.toBeNull();
    unmount();

    // Second mount with same inputs — key matches, service skipped
    render(<ExplorePage />);
    await new Promise((r) => setTimeout(r, 50));
    expect(naviqoreService.getStopDepartures).toHaveBeenCalledTimes(1);
  });

  it('clears lastQueriedKey on fetch failure enabling retry on remount (AC3)', async () => {
    vi.spyOn(naviqoreService, 'getStopDepartures')
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue({ data: [], duration: 1, status: 200 });

    let exploreState = makeExploreState({ lastQueriedKey: null });
    const setExploreState = vi.fn((updater: unknown) => {
      exploreState =
        typeof updater === 'function'
          ? updater(exploreState)
          : { ...exploreState, ...(updater as Partial<ExploreState>) };
    });
    vi.mocked(useDomain).mockImplementation(() =>
      makeDomainValue(exploreState, setExploreState)
    );

    const { unmount } = render(<ExplorePage />);
    await waitFor(() =>
      expect(naviqoreService.getStopDepartures).toHaveBeenCalledTimes(1)
    );

    // After failure, key stays null
    expect(exploreState.lastQueriedKey).toBeNull();
    unmount();

    // Second mount — key is null → service retried
    render(<ExplorePage />);
    await waitFor(() =>
      expect(naviqoreService.getStopDepartures).toHaveBeenCalledTimes(2)
    );
  });
});

describe('ExplorePage stale response cancellation (STORY-0026)', () => {
  it('ignores response when effect cleanup runs before fetch resolves', async () => {
    let resolveDeferred!: (v: {
      data: StopDeparture[];
      duration: number;
      status: number;
    }) => void;
    const deferred = new Promise<{
      data: StopDeparture[];
      duration: number;
      status: number;
    }>((resolve) => {
      resolveDeferred = resolve;
    });
    vi.mocked(naviqoreService.getStopDepartures).mockReturnValueOnce(
      deferred as never
    );

    let exploreState = makeExploreState({ lastQueriedKey: null });
    const setExploreState = vi.fn((updater: unknown) => {
      exploreState =
        typeof updater === 'function'
          ? updater(exploreState)
          : { ...exploreState, ...(updater as Partial<ExploreState>) };
    });
    vi.mocked(useDomain).mockImplementation(() =>
      makeDomainValue(exploreState, setExploreState)
    );

    const { unmount } = render(<ExplorePage />);
    // Wait for service to be invoked (fetch in-flight, deferred not yet resolved)
    await waitFor(() =>
      expect(naviqoreService.getStopDepartures).toHaveBeenCalledTimes(1)
    );

    const callsBeforeCancel = setExploreState.mock.calls.length;

    // Simulate dep change: cleanup runs → cancelled = true
    unmount();

    // Resolve the stale response
    await act(async () => {
      resolveDeferred({ data: [], duration: 1, status: 200 });
      await Promise.resolve();
    });

    // No new calls to setExploreState should have happened after cancel
    expect(setExploreState.mock.calls.length).toBe(callsBeforeCancel);
  });
});
