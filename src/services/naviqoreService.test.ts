import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RequestLog } from '../types';
import { naviqoreService } from './naviqoreService';

describe('naviqoreService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    naviqoreService.setMockMode(false);
    naviqoreService.setBaseUrl('http://localhost:8080');
  });

  afterEach(() => {
    naviqoreService.setMockMode(false);
    naviqoreService.setBaseUrl('http://localhost:8080');
  });

  it('throws actionable errors and exposes details to request logs', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          title: 'Invalid Parameters',
          detail: 'Validation failed for one or more parameters.',
          type: 'tag:naviqore.org:invalid-parameters',
          requestId: 'req-456',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/problem+json' },
        }
      )
    );

    const logs: RequestLog[] = [];
    const unsubscribe = naviqoreService.subscribe((log) => logs.push(log));

    await expect(naviqoreService.getScheduleInfo()).rejects.toThrow(
      'Invalid Parameters: Validation failed for one or more parameters. (requestId=req-456)'
    );

    unsubscribe();

    expect(logs.length).toBeGreaterThan(0);
    const lastLog = logs[logs.length - 1];
    expect(lastLog.status).toBe(400);
    expect(lastLog.error).toContain(
      'Invalid Parameters: Validation failed for one or more parameters.'
    );
    expect(lastLog.error).toContain('requestId=req-456');
    expect(lastLog.error).toContain('type=tag:naviqore.org:invalid-parameters');
  });

  it('setMockMode(true) switches provider, notifies config listeners, and emits a log', () => {
    const logs: RequestLog[] = [];
    const unsubLogs = naviqoreService.subscribe((log) => logs.push(log));
    let configCalls = 0;
    const unsubConfig = naviqoreService.onConfigChange(() => configCalls++);

    naviqoreService.setMockMode(true);

    unsubLogs();
    unsubConfig();

    expect(logs).toHaveLength(1);
    expect(logs[0].error).toContain('Switched to Mock Mode');
    expect(configCalls).toBe(1);
  });

  it('setMockMode is idempotent: calling with same value does not notify listeners', () => {
    let configCalls = 0;
    const unsubConfig = naviqoreService.onConfigChange(() => configCalls++);

    // Already false from beforeEach, calling false again → no-op
    naviqoreService.setMockMode(false);

    unsubConfig();
    expect(configCalls).toBe(0);
  });

  it('setBaseUrl with the same URL does not notify config listeners', () => {
    let configCalls = 0;
    const unsubConfig = naviqoreService.onConfigChange(() => configCalls++);

    // beforeEach already set to http://localhost:8080
    naviqoreService.setBaseUrl('http://localhost:8080');

    unsubConfig();
    expect(configCalls).toBe(0);
  });

  it('setBaseUrl with a new URL notifies config listeners', () => {
    let configCalls = 0;
    const unsubConfig = naviqoreService.onConfigChange(() => configCalls++);

    naviqoreService.setBaseUrl('http://other-host:9090');

    unsubConfig();
    expect(configCalls).toBe(1);
  });

  it('subscribe: unsubscribed listener no longer receives log events', () => {
    const received: RequestLog[] = [];
    const unsubscribe = naviqoreService.subscribe((log) => received.push(log));

    // Toggle mock mode on → emits one log entry
    naviqoreService.setMockMode(true);
    expect(received).toHaveLength(1);

    unsubscribe();

    // Toggle back → must NOT reach removed listener
    naviqoreService.setMockMode(false);
    expect(received).toHaveLength(1);
  });

  it('onConfigChange: unsubscribed listener no longer receives config notifications', () => {
    let calls = 0;
    const unsubscribe = naviqoreService.onConfigChange(() => calls++);

    naviqoreService.setMockMode(true);
    expect(calls).toBe(1);

    unsubscribe();

    naviqoreService.setMockMode(false);
    expect(calls).toBe(1);
  });

  it('execute wraps network-level failures in ServiceRequestError', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new Error('Network unreachable')
    );

    const err = await naviqoreService
      .getScheduleInfo()
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error & { name: string }).name).toBe('ServiceRequestError');
    // RealDataProvider catches the fetch throw and surfaces it as 'Network request failed.'
    expect((err as Error).message).toBe('Network request failed.');
  });

  it('formatParams: includes non-null/undefined values and skips null/undefined', async () => {
    const logs: RequestLog[] = [];
    const unsubscribe = naviqoreService.subscribe((log) => logs.push(log));

    naviqoreService.setMockMode(true);
    // autocompleteStops uses formatParams({ q: query })
    await naviqoreService
      .autocompleteStops('test query')
      .catch(() => undefined);

    unsubscribe();

    const log = logs.find((l) => l.url.includes('autocomplete'));
    expect(log).toBeDefined();
    expect(log?.url).toContain('q=test+query');
  });
});
