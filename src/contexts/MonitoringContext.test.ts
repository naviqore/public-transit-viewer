import { describe, expect, it } from 'vitest';

import { sanitiseToastDetail } from './MonitoringContext';

describe('sanitiseToastDetail', () => {
  it('strips requestId suffix', () => {
    expect(sanitiseToastDetail('No routes found | requestId=abc-123')).toBe(
      'No routes found'
    );
  });

  it('strips type suffix', () => {
    expect(
      sanitiseToastDetail(
        'Validation error | type=http://example.com/errors/validation'
      )
    ).toBe('Validation error');
  });

  it('strips both requestId and type suffixes', () => {
    expect(
      sanitiseToastDetail(
        'No routes found | requestId=abc-123 | type=http://example.com/errors/not-found'
      )
    ).toBe('No routes found');
  });

  it('leaves plain messages unchanged', () => {
    expect(
      sanitiseToastDetail('The server could not complete the request.')
    ).toBe('The server could not complete the request.');
  });

  it('returns empty string unchanged', () => {
    expect(sanitiseToastDetail('')).toBe('');
  });
});
