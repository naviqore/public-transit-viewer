import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MapComponent from './Map';

const { mapSpy, mapRemoveSpy, mapInvalidateSizeSpy, tileSetUrlSpy } =
  vi.hoisted(() => ({
    mapSpy: vi.fn(),
    mapRemoveSpy: vi.fn(),
    mapInvalidateSizeSpy: vi.fn(),
    tileSetUrlSpy: vi.fn(),
  }));

const mockMapInstance = {
  setView: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  remove: mapRemoveSpy,
  invalidateSize: mapInvalidateSizeSpy,
  flyTo: vi.fn(),
  flyToBounds: vi.fn(),
  getContainer: vi.fn(() => document.createElement('div')),
};

vi.mock('leaflet', () => {
  const tileLayer = {
    addTo: vi.fn().mockReturnThis(),
    setUrl: tileSetUrlSpy,
  };

  return {
    default: {
      map: mapSpy.mockImplementation(() => mockMapInstance),
      tileLayer: vi.fn(() => tileLayer),
      control: {
        attribution: vi.fn(() => ({ addTo: vi.fn() })),
      },
      layerGroup: vi.fn(() => ({
        addTo: vi.fn(() => ({ clearLayers: vi.fn() })),
      })),
      latLngBounds: vi.fn(() => ({
        extend: vi.fn(),
        isValid: vi.fn(() => false),
      })),
    },
  };
});

vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({ darkMode: false, timezone: 'UTC' }),
}));

vi.mock('../contexts/DomainContext', () => ({
  useDomain: () => ({ isolineState: { maxDuration: 30 } }),
}));

vi.mock('../hooks/useMapLayers', () => ({
  useMapLayers: vi.fn(),
}));

vi.mock('./common/TransportIcon', () => ({
  default: () => null,
}));

const resizeObservers: Array<{ trigger: () => void }> = [];

class ResizeObserverMock {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeObservers.push({
      trigger: () => this.callback([], this),
    });
  }

  observe() {
    return undefined;
  }

  disconnect() {
    return undefined;
  }

  unobserve() {
    return undefined;
  }
}

describe('MapComponent lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resizeObservers.length = 0;
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);

    mockMapInstance.getContainer = vi.fn(() => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'isConnected', {
        value: true,
      });
      return el;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not recreate the map on prop rerender', () => {
    const { rerender, unmount } = render(
      <MapComponent center={[59.91, 10.75]} zoom={12} />
    );

    expect(mapSpy).toHaveBeenCalledTimes(1);

    rerender(<MapComponent center={[59.92, 10.76]} zoom={13} />);

    expect(mapSpy).toHaveBeenCalledTimes(1);
    expect(mapRemoveSpy).not.toHaveBeenCalled();

    unmount();

    expect(mapRemoveSpy).toHaveBeenCalledTimes(1);
  });

  it('guards resize invalidation after unmount', () => {
    const { unmount } = render(
      <MapComponent center={[59.91, 10.75]} zoom={12} />
    );

    expect(resizeObservers).toHaveLength(1);

    unmount();

    expect(() => resizeObservers[0].trigger()).not.toThrow();
  });
});
