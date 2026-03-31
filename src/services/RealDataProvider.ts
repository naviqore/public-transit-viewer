import { IDataProvider, ProviderError, ProviderResult } from './IDataProvider';
import {
  Connection,
  DistanceToStop,
  QueryConfig,
  RoutingInfo,
  ScheduleInfo,
  StopDeparture,
  Stop,
  StopConnection,
  StopScope,
  TimeType,
} from '../types';

type QueryParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const pickExtras = (
  payload: Record<string, unknown>
): Record<string, unknown> | undefined => {
  const knownKeys = new Set([
    'title',
    'detail',
    'type',
    'instance',
    'requestId',
    'method',
    'timestamp',
    'status',
  ]);

  const extras = Object.fromEntries(
    Object.entries(payload).filter(([key]) => !knownKeys.has(key))
  );

  return Object.keys(extras).length > 0 ? extras : undefined;
};

const toStatusLabel = (status: number): string => {
  return Number.isFinite(status) && status > 0
    ? `HTTP ${status}`
    : 'Network Error';
};

export class RealDataProvider implements IDataProvider {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  async getScheduleInfo(): Promise<ProviderResult<ScheduleInfo>> {
    return this.fetch<ScheduleInfo>('/schedule');
  }

  async autocompleteStops(query: string): Promise<ProviderResult<Stop[]>> {
    return this.fetch<Stop[]>('/schedule/stops/autocomplete', {
      query,
      limit: 10,
    });
  }

  async getNearestStops(
    lat: number,
    lon: number
  ): Promise<ProviderResult<DistanceToStop[]>> {
    return this.fetch<DistanceToStop[]>('/schedule/stops/nearest', {
      latitude: lat,
      longitude: lon,
      limit: 20,
    });
  }

  async getStopDepartures(
    stopId: string,
    from: string,
    to: string,
    timeType: TimeType,
    stopScope: StopScope,
    limit: number
  ): Promise<ProviderResult<StopDeparture[]>> {
    return this.fetch<StopDeparture[]>(`/schedule/stops/${stopId}/times`, {
      from,
      to,
      timeType,
      stopScope,
      limit,
    });
  }

  async getRoutingInfo(): Promise<ProviderResult<RoutingInfo>> {
    return this.fetch<RoutingInfo>('/routing');
  }

  async getConnections(
    source: string,
    target: string,
    dateTime: string,
    timeType: TimeType,
    config: QueryConfig
  ): Promise<ProviderResult<Connection[]>> {
    // Convert duration configs from minutes (UI) to seconds (API)
    const apiConfig = {
      ...config,
      maxWalkDuration: config.maxWalkDuration
        ? config.maxWalkDuration * 60
        : undefined,
      minTransferDuration: config.minTransferDuration
        ? config.minTransferDuration * 60
        : undefined,
      maxTravelDuration: config.maxTravelDuration
        ? config.maxTravelDuration * 60
        : undefined,
      timeWindowDuration: config.timeWindowDuration
        ? config.timeWindowDuration * 60
        : undefined,
    };

    return this.fetch<Connection[]>('/routing/connections', {
      sourceStopId: source,
      targetStopId: target,
      dateTime,
      timeType,
      ...apiConfig,
    });
  }

  async getIsolines(
    source: string,
    dateTime: string,
    timeType: TimeType,
    maxTravelDuration: number,
    config: QueryConfig
  ): Promise<ProviderResult<StopConnection[]>> {
    // Convert duration configs from minutes (UI) to seconds (API)
    const apiConfig = {
      ...config,
      maxWalkDuration: config.maxWalkDuration
        ? config.maxWalkDuration * 60
        : undefined,
      minTransferDuration: config.minTransferDuration
        ? config.minTransferDuration * 60
        : undefined,
      timeWindowDuration: config.timeWindowDuration
        ? config.timeWindowDuration * 60
        : undefined,
    };

    // Note: We spread apiConfig FIRST, then override maxTravelDuration with the explicit slider value.
    // This ensures the undefined value in apiConfig (if not set in settings) doesn't overwrite the slider.
    return this.fetch<StopConnection[]>('/routing/isolines', {
      sourceStopId: source,
      dateTime,
      timeType,
      detailed: false, // Explicitly false as requested
      ...apiConfig,
      maxTravelDuration: maxTravelDuration * 60, // Explicit override in seconds
    });
  }

  /**
   * Constructs and fires the HTTP GET request, appending `params` as query string entries.
   * Normalises non-OK responses through {@link readError}; network-level failures return status 0.
   */
  private async fetch<T>(
    endpoint: string,
    params: Record<string, QueryParamValue> = {}
  ): Promise<ProviderResult<T>> {
    // Missing URL should be an explicit failure, not a fake success payload.
    if (!this.baseUrl || this.baseUrl.includes('undefined')) {
      return {
        ok: false,
        status: 0,
        error: {
          message: 'Backend URL is not configured.',
          detail:
            'Set VITE_API_BASE_URL (or VITE_NAVIQORE_BACKEND_URL) to enable API requests.',
          status: 0,
        },
      };
    }

    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    try {
      const urlObj = new URL(`${this.baseUrl}${path}`);

      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          if (Array.isArray(params[key])) {
            urlObj.searchParams.append(key, params[key].join(','));
          } else {
            urlObj.searchParams.append(key, String(params[key]));
          }
        }
      });

      const response = await fetch(urlObj.toString());
      if (!response.ok) {
        if (path.includes('autocomplete') && response.status === 404)
          return { ok: true, data: [] as T, status: 200 };

        const error = await this.readError(response);
        return {
          ok: false,
          status: response.status,
          error,
        };
      }
      const data = await response.json();
      return { ok: true, data, status: response.status };
    } catch (error: unknown) {
      // Network errors (fetch failed)
      console.warn(`Fetch failed for ${path}:`, error);
      return {
        ok: false,
        status: 0,
        error: {
          message: 'Network request failed.',
          detail: error instanceof Error ? error.message : String(error),
          status: 0,
        },
      };
    }
  }

  private async readError(response: Response): Promise<ProviderError> {
    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('json');

    let payload: unknown;
    if (isJson) {
      try {
        payload = await response.json();
      } catch {
        payload = undefined;
      }
    }

    let textBody = '';
    if (!payload) {
      try {
        textBody = (await response.text()).trim();
      } catch {
        textBody = '';
      }
    }

    const status = response.status;
    const fallback = asString(response.statusText) ?? toStatusLabel(status);

    if (!isObject(payload)) {
      const detail = asString(textBody);
      const message = detail ?? fallback;
      return {
        message,
        detail,
        status,
      };
    }

    const title = asString(payload.title);
    const detail = asString(payload.detail);
    const type = asString(payload.type);
    const instance = asString(payload.instance);
    const requestId =
      asString(payload.requestId) ??
      asString(response.headers.get('X-Request-ID'));
    const method = asString(payload.method);
    const timestamp = asString(payload.timestamp);

    const message =
      [title, detail]
        .filter((part): part is string => Boolean(part))
        .join(': ') ||
      detail ||
      title ||
      fallback;

    return {
      message,
      title,
      detail,
      type,
      instance,
      requestId,
      method,
      timestamp,
      status,
      extras: pickExtras(payload),
    };
  }
}
