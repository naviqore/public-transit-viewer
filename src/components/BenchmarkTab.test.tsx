import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMonitoring } from '../contexts/MonitoringContext';
import BenchmarkTab from './BenchmarkTab';

vi.mock('../contexts/MonitoringContext', () => ({
  useMonitoring: vi.fn(),
}));

const mockedUseMonitoring = vi.mocked(useMonitoring);

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  });

  mockedUseMonitoring.mockReturnValue({
    lastResponseTime: 0,
    logs: [],
    clearLogs: vi.fn(),
    addToast: vi.fn(),
    benchmarkState: {
      isRunning: false,
      isPreloading: false,
      config: {
        concurrency: 5,
        delayMs: 100,
        timeWindowDuration: 0,
        scenario: 'real_life',
        fixedDate: '2026-03-06',
      },
      stats: {
        totalSent: 0,
        totalSuccess: 0,
        totalError: 0,
        currentRps: 0,
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        errors: [],
      },
      logs: [],
      latencyHistory: new Array(60).fill(0),
    },
    setBenchmarkConfig: vi.fn(),
    toggleBenchmark: vi.fn(),
    clearBenchmarkLogs: vi.fn(),
  });
});

describe('BenchmarkTab scenario tooltip', () => {
  it('shows and hides tooltip on hover for desktop behavior', async () => {
    render(<BenchmarkTab />);

    const trigger = screen.getAllByLabelText('Show scenario description')[0];
    fireEvent.mouseEnter(trigger);

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Simulates realistic traffic:'
    );

    fireEvent.mouseLeave(trigger);

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  it('opens and closes tooltip on repeated click for touch behavior', async () => {
    render(<BenchmarkTab />);

    const trigger = screen.getAllByLabelText('Show scenario description')[0];

    fireEvent.click(trigger);
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });
});
