import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { naviqoreService } from '../services/naviqoreService';
import { TimeType } from '../types';
import { DomainProvider, useDomain } from './DomainContext';

const DomainConsumer = () => {
  const { serverInfo, exploreState, routingState, isolineState } = useDomain();

  return (
    <>
      <span data-testid="schedule-accessibility">
        {String(serverInfo.schedule?.hasAccessibility ?? false)}
      </span>
      <span data-testid="routing-supports-bikes">
        {String(serverInfo.routing?.supportsBikes ?? false)}
      </span>
      <span data-testid="routing-time-type">{routingState.timeType}</span>
      <span data-testid="isoline-max-duration">
        {String(isolineState.maxDuration)}
      </span>
      <span data-testid="explore-stop-selected">
        {String(exploreState.selectedStop === null)}
      </span>
    </>
  );
};

describe('DomainContext', () => {
  beforeEach(() => {
    vi.spyOn(naviqoreService, 'onConfigChange').mockReturnValue(
      () => undefined
    );
    vi.spyOn(naviqoreService, 'getScheduleInfo').mockResolvedValue({
      data: {
        hasAccessibility: true,
        hasBikes: true,
        hasTravelModes: true,
        scheduleValidity: {
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        },
      },
      duration: 1,
      status: 200,
    });
    vi.spyOn(naviqoreService, 'getRoutingInfo').mockResolvedValue({
      data: {
        supportsMaxTransfers: true,
        supportsMaxTravelDuration: true,
        supportsMaxWalkDuration: true,
        supportsMinTransferDuration: true,
        supportsAccessibility: true,
        supportsBikes: true,
        supportsTravelModes: true,
      },
      duration: 1,
      status: 200,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when useDomain is used outside DomainProvider', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const ConsumerOutsideProvider = () => {
      useDomain();
      return null;
    };

    expect(() => render(<ConsumerOutsideProvider />)).toThrow(
      'useDomain must be used within a DomainProvider'
    );

    consoleErrorSpy.mockRestore();
  });

  it('exposes expected defaults and loads server info after startup fetch', async () => {
    render(
      <DomainProvider>
        <DomainConsumer />
      </DomainProvider>
    );

    expect(screen.getByTestId('routing-time-type')).toHaveTextContent(
      TimeType.DEPARTURE
    );
    expect(screen.getByTestId('isoline-max-duration')).toHaveTextContent('30');
    expect(screen.getByTestId('explore-stop-selected')).toHaveTextContent(
      'true'
    );

    await waitFor(() => {
      expect(screen.getByTestId('schedule-accessibility')).toHaveTextContent(
        'true'
      );
      expect(screen.getByTestId('routing-supports-bikes')).toHaveTextContent(
        'true'
      );
    });
  });
});
