import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SettingsPage from './SettingsPage';
import { useDomain } from '../contexts/DomainContext';
import { useSettings } from '../contexts/SettingsContext';

vi.mock('../contexts/DomainContext');
vi.mock('../contexts/SettingsContext');

// Allow per-test override of constants via vi.hoisted + vi.mock
const constantOverrides = vi.hoisted(() => ({
  IS_API_URL_CONFIGURED: false,
  ENABLE_MOCK_DATA: false,
}));

vi.mock('../constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../constants')>();
  return {
    ...actual,
    get IS_API_URL_CONFIGURED() {
      return constantOverrides.IS_API_URL_CONFIGURED;
    },
    get ENABLE_MOCK_DATA() {
      return constantOverrides.ENABLE_MOCK_DATA;
    },
  };
});

const mockSetMockMode = vi.fn();
const mockSetApiBaseUrl = vi.fn();

function setup(overrides: { mockMode?: boolean } = {}) {
  vi.mocked(useDomain).mockReturnValue({
    backendStatus: 'ok',
  } as ReturnType<typeof useDomain>);

  vi.mocked(useSettings).mockReturnValue({
    timezone: 'UTC',
    setTimezone: vi.fn(),
    useStationTime: false,
    setUseStationTime: vi.fn(),
    mockMode: overrides.mockMode ?? false,
    setMockMode: mockSetMockMode,
    apiBaseUrl: 'http://localhost:8080',
    setApiBaseUrl: mockSetApiBaseUrl,
    darkMode: false,
    setDarkMode: vi.fn(),
    mobileMapOpen: false,
    setMobileMapOpen: vi.fn(),
    showAbout: false,
    setShowAbout: vi.fn(),
    queryConfig: {} as ReturnType<typeof useSettings>['queryConfig'],
    setQueryConfig: vi.fn(),
  });

  return render(<SettingsPage />);
}

beforeEach(() => {
  constantOverrides.IS_API_URL_CONFIGURED = false;
  constantOverrides.ENABLE_MOCK_DATA = false;
  mockSetMockMode.mockClear();
  mockSetApiBaseUrl.mockClear();
});

describe('SettingsPage — mock mode locking (STORY-0050)', () => {
  it('shows editable API input when mock mode is off', () => {
    setup({ mockMode: false });
    const input = screen.getByPlaceholderText('http://localhost:8080');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('locks API endpoint when mock mode is on', () => {
    setup({ mockMode: true });
    expect(
      screen.queryByPlaceholderText('http://localhost:8080')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Mock Active')).toBeInTheDocument();
  });

  it('locks API endpoint when API URL is env-configured', () => {
    constantOverrides.IS_API_URL_CONFIGURED = true;
    setup({ mockMode: false });
    expect(
      screen.queryByPlaceholderText('http://localhost:8080')
    ).not.toBeInTheDocument();
    expect(screen.getByText('ENV Configured')).toBeInTheDocument();
  });

  it('shows clickable mock toggle when not env-fixed', () => {
    setup({ mockMode: false });
    const toggle = screen.getByText('Mock Data Mode').closest('div[class]')!;
    fireEvent.click(toggle);
    expect(mockSetMockMode).toHaveBeenCalledWith(true);
  });

  it('shows disabled mock toggle when ENABLE_MOCK_DATA is env-set', () => {
    constantOverrides.ENABLE_MOCK_DATA = true;
    setup({ mockMode: true });
    expect(screen.getByText('Fixed by environment')).toBeInTheDocument();

    const toggle = screen.getByText('Mock Data Mode').closest('div[class]')!;
    fireEvent.click(toggle);
    expect(mockSetMockMode).not.toHaveBeenCalled();
  });

  it('shows mock toggle even when API URL is env-configured if ENABLE_MOCK_DATA is set', () => {
    constantOverrides.IS_API_URL_CONFIGURED = true;
    constantOverrides.ENABLE_MOCK_DATA = true;
    setup({ mockMode: true });
    expect(screen.getByText('Mock Data Mode')).toBeInTheDocument();
    expect(screen.getByText('Fixed by environment')).toBeInTheDocument();
  });
});
