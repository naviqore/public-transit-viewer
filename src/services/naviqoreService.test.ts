import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RequestLog } from '../types';
import { naviqoreService } from './naviqoreService';

describe('naviqoreService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
});
