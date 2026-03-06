import { IDataProvider, ProviderResponse } from './IDataProvider';
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

export class RealDataProvider implements IDataProvider {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  async getScheduleInfo(): Promise<ProviderResponse<ScheduleInfo>> {
    return this.fetch<ScheduleInfo>('/schedule');
  }

  async autocompleteStops(query: string): Promise<ProviderResponse<Stop[]>> {
    return this.fetch<Stop[]>('/schedule/stops/autocomplete', {
      query,
      limit: 10,
    });
  }

  async getNearestStops(
    lat: number,
    lon: number
  ): Promise<ProviderResponse<DistanceToStop[]>> {
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
  ): Promise<ProviderResponse<StopDeparture[]>> {
    return this.fetch<StopDeparture[]>(`/schedule/stops/${stopId}/times`, {
      from,
      to,
      timeType,
      stopScope,
      limit,
    });
  }

  async getRoutingInfo(): Promise<ProviderResponse<RoutingInfo>> {
    return this.fetch<RoutingInfo>('/routing');
  }

  async getConnections(
    source: string,
    target: string,
    dateTime: string,
    timeType: TimeType,
    config: QueryConfig
  ): Promise<ProviderResponse<Connection[]>> {
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
  ): Promise<ProviderResponse<StopConnection[]>> {
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

  private async fetch<T>(
    endpoint: string,
    params: Record<string, QueryParamValue> = {}
  ): Promise<ProviderResponse<T>> {
    // If no base URL is provided, return an empty success response to prevent crashes
    if (!this.baseUrl || this.baseUrl.includes('undefined')) {
      return { data: [] as unknown as T, status: 200 };
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
        // For autocomplete, we often get 404s or empty results, handle gracefully
        if (path.includes('autocomplete'))
          return { data: [] as unknown as T, status: 200 };

        return {
          data: {} as T,
          status: response.status,
          error: response.statusText,
        };
      }
      const data = await response.json();
      return { data, status: response.status };
    } catch (error: unknown) {
      // Network errors (fetch failed)
      console.warn(`Fetch failed for ${path}:`, error);
      // Return a safe empty state with a status of 0 to indicate network failure,
      // but structured so the app continues running.
      return { data: [] as unknown as T, status: 0, error: 'Network Error' };
    }
  }
}
