interface RuntimeEnv {
  VITE_API_BASE_URL?: string;
  VITE_NAVIQORE_BACKEND_URL?: string;
  VITE_DISABLE_BENCHMARK?: string;
  VITE_ENABLE_MOCK_DATA?: string;
}

const getEnv = (key: keyof RuntimeEnv): string | undefined => {
  // Prefer runtime values injected by docker-entrypoint.sh via window.__ENV__
  // (allows configuring a pre-built image without rebuilding).
  if (typeof window !== 'undefined') {
    const runtime = (window as { __ENV__?: RuntimeEnv }).__ENV__;
    if (runtime?.[key]) return runtime[key];
  }
  // Fall back to Vite build-time env (local dev / build-arg workflow).
  const env = (
    import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    }
  ).env;
  if (!env) return undefined;
  return env[key];
};

const ENV_API_URL =
  getEnv('VITE_API_BASE_URL') || getEnv('VITE_NAVIQORE_BACKEND_URL');

export const API_BASE_URL = ENV_API_URL || 'http://localhost:8080';
export const IS_API_URL_CONFIGURED = !!ENV_API_URL;
export const DISABLE_BENCHMARK = getEnv('VITE_DISABLE_BENCHMARK') === 'true';
export const ENABLE_MOCK_DATA = getEnv('VITE_ENABLE_MOCK_DATA') === 'true';

export const DEFAULT_MAP_CENTER: [number, number] = [47.3769, 8.5417]; // Zurich default
export const DEFAULT_ZOOM = 13;

export const MAP_TILE_URL_LIGHT =
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const MAP_TILE_URL_DARK =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const MAP_TILE_ATTRIBUTION = '&copy; CARTO';

export const COLORS = {
  primary: '#4f46e5',
  secondary: '#64748b',
  accent: '#f59e0b',
  success: '#10b981',
  danger: '#ef4444',
  pastTrip: '#64748b',

  source: '#0f172a',
  target: '#4f46e5',
  highlight: '#ec4899',
};

export const TRANSPORT_COLORS: Record<string, string> = {
  RAIL: '#4f46e5',
  TRAM: '#db2777',
  BUS: '#d97706',
  SHIP: '#0891b2',
  SUBWAY: '#7e22ce',
  AERIAL_LIFT: '#059669',
  FUNICULAR: '#be123c',
  WALK: '#94a3b8',
};

import {
  ExploreQueryConfig,
  QueryConfig,
  StopScope,
  TransportMode,
} from './types';

export const DEFAULT_QUERY_CONFIG: QueryConfig = {
  travelModes: Object.values(TransportMode),
  wheelchairAccessible: false,
  bikeAllowed: false,
  maxWalkDuration: undefined,
  maxTransfers: undefined,
  minTransferDuration: undefined,
  maxTravelDuration: undefined,
  timeWindowDuration: 60,
};

export const DEFAULT_EXPLORE_CONFIG: ExploreQueryConfig = {
  stopScope: StopScope.CHILDREN,
  timeWindowMinutes: 360,
  limit: 20,
};

export const getGradientColor = (value: number, max: number = 60): string => {
  const ratio = Math.min(Math.max(value / max, 0), 1);

  const stops = [
    { r: 79, g: 70, b: 229, pos: 0 },
    { r: 217, g: 70, b: 239, pos: 0.5 },
    { r: 245, g: 158, b: 11, pos: 1 },
  ];

  let start = stops[0];
  let end = stops[stops.length - 1];

  for (let i = 0; i < stops.length - 1; i++) {
    if (ratio >= stops[i].pos && ratio <= stops[i + 1].pos) {
      start = stops[i];
      end = stops[i + 1];
      break;
    }
  }

  const localRatio = (ratio - start.pos) / (end.pos - start.pos);
  const r = Math.round(start.r + (end.r - start.r) * localRatio);
  const g = Math.round(start.g + (end.g - start.g) * localRatio);
  const b = Math.round(start.b + (end.b - start.b) * localRatio);

  return `rgb(${r}, ${g}, ${b})`;
};
