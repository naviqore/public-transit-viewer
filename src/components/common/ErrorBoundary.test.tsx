import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ErrorBoundary from './ErrorBoundary';

const ThrowError = () => {
  throw new Error('boom');
};

let shouldThrow = true;
const ConditionalThrow = () => {
  if (shouldThrow) throw new Error('conditional boom');
  return <div>Recovered content</div>;
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

  it('shows fallback with error message on throw', () => {
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
    expect(screen.getByText('boom')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Try again' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('"Try again" resets and re-renders children', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    shouldThrow = true;

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    expect(
      screen.getByRole('heading', { name: 'Something went wrong.' })
    ).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Recovered content')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Something went wrong.' })
    ).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
