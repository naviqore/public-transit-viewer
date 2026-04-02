import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import StalenessIndicator from './StalenessIndicator';
import { STALENESS_THRESHOLD_MS } from '../../constants';

afterEach(cleanup);

describe('StalenessIndicator', () => {
  it('renders nothing when queriedAt is null', () => {
    const { container } = render(
      <StalenessIndicator queriedAt={null} onRefresh={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when results are fresh', () => {
    const { container } = render(
      <StalenessIndicator queriedAt={new Date()} onRefresh={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders staleness message when results are old', () => {
    const staleDate = new Date(Date.now() - STALENESS_THRESHOLD_MS - 60_000);
    render(<StalenessIndicator queriedAt={staleDate} onRefresh={vi.fn()} />);
    expect(screen.getByText(/Results from/)).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('calls onRefresh when Refresh button is clicked', () => {
    const onRefresh = vi.fn();
    const staleDate = new Date(Date.now() - STALENESS_THRESHOLD_MS - 60_000);
    render(<StalenessIndicator queriedAt={staleDate} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByText('Refresh'));
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
