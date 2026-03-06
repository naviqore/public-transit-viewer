import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ErrorBoundary from './ErrorBoundary';

const ThrowError = () => {
  throw new Error('boom');
};

describe('ErrorBoundary', () => {
  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('shows fallback UI when a child throws', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(
      screen.getByRole('heading', { name: 'Something went wrong.' })
    ).toBeInTheDocument();
    expect(screen.getByText('Please refresh the page.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
