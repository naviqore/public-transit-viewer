import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Notification } from '../types';
import Toast from './Toast';

const makeNotification = (
  type: Notification['type'],
  overrides: Partial<Notification> = {}
): Notification => ({
  id: 'test-id',
  type,
  message: 'Test message',
  ...overrides,
});

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders message and optional details', () => {
    const onDismiss = vi.fn();
    render(
      <Toast
        notification={makeNotification('info', { details: 'extra info' })}
        onDismiss={onDismiss}
      />
    );
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('extra info')).toBeInTheDocument();
  });

  it('calls onDismiss after 3 s for non-error types', () => {
    const onDismiss = vi.fn();
    render(
      <Toast notification={makeNotification('success')} onDismiss={onDismiss} />
    );
    vi.advanceTimersByTime(2999);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onDismiss).toHaveBeenCalledWith('test-id');
  });

  it('calls onDismiss after 6 s for error type', () => {
    const onDismiss = vi.fn();
    render(
      <Toast notification={makeNotification('error')} onDismiss={onDismiss} />
    );
    vi.advanceTimersByTime(5999);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onDismiss).toHaveBeenCalledWith('test-id');
  });

  it('does not dismiss early for warning type (3 s)', () => {
    const onDismiss = vi.fn();
    render(
      <Toast notification={makeNotification('warning')} onDismiss={onDismiss} />
    );
    vi.advanceTimersByTime(3000);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('calls onDismiss when X button is clicked', () => {
    const onDismiss = vi.fn();
    render(
      <Toast notification={makeNotification('info')} onDismiss={onDismiss} />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onDismiss).toHaveBeenCalledWith('test-id');
  });
});
