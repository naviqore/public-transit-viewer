import { API_BASE_URL } from '../constants';
import {
  ApiResponse,
  Connection,
  DistanceToStop,
  QueryConfig,
  RequestLog,
  RoutingInfo,
  ScheduleInfo,
  StopDeparture,
  Stop,
  StopConnection,
  StopScope,
  TimeType,
} from '../types';
import { IDataProvider, ProviderResponse } from './IDataProvider';
import { RealDataProvider } from './RealDataProvider';
import { MockDataProvider } from './MockDataProvider';

type ServiceListener = (log: RequestLog) => void;
type ConfigListener = () => void;
type QueryParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

// Helper to construct query strings for logging
const formatParams = (params: Record<string, QueryParamValue>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(','));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : '';
};

class NaviqoreService {
  private listeners: ServiceListener[] = [];
  private configListeners: ConfigListener[] = [];

  private provider: IDataProvider;
  private realProvider: RealDataProvider;
  private mockProvider: MockDataProvider;

  private isMockMode: boolean = false;
  private currentBaseUrl: string = API_BASE_URL;

  constructor() {
    this.realProvider = new RealDataProvider(API_BASE_URL);
    this.mockProvider = new MockDataProvider();
    this.provider = this.realProvider;
  }

  setBaseUrl(url: string) {
    if (this.currentBaseUrl === url) return;
    this.currentBaseUrl = url;
    this.realProvider.setBaseUrl(url);

    if (!this.isMockMode) {
      this.notifyConfigListeners();
    }
  }

  setMockMode(enabled: boolean) {
    if (this.isMockMode === enabled) return;

    this.isMockMode = enabled;
    this.provider = enabled ? this.mockProvider : this.realProvider;

    this.notifyListeners({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      url: 'SYSTEM',
      method: 'SWITCH',
      duration: 0,
      status: 200,
      error: enabled ? 'Switched to Mock Mode' : 'Switched to Real Mode',
    });

    this.notifyConfigListeners();
  }

  subscribe(listener: ServiceListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  onConfigChange(listener: ConfigListener): () => void {
    this.configListeners.push(listener);
    return () => {
      this.configListeners = this.configListeners.filter((l) => l !== listener);
    };
  }

  async getScheduleInfo(): Promise<ApiResponse<ScheduleInfo>> {
    return this.execute('schedule', () => this.provider.getScheduleInfo());
  }

  async autocompleteStops(query: string): Promise<ApiResponse<Stop[]>> {
    const qs = formatParams({ q: query });
    return this.execute(`schedule/stops/autocomplete${qs}`, () =>
      this.provider.autocompleteStops(query)
    );
  }

  async getNearestStops(
    lat: number,
    lon: number
  ): Promise<ApiResponse<DistanceToStop[]>> {
    const qs = formatParams({ latitude: lat, longitude: lon });
    return this.execute(`schedule/stops/nearest${qs}`, () =>
      this.provider.getNearestStops(lat, lon)
    );
  }

  async getStopDepartures(
    stopId: string,
    from: string,
    to: string,
    timeType: TimeType,
    stopScope: StopScope,
    limit: number
  ): Promise<ApiResponse<StopDeparture[]>> {
    const qs = formatParams({ from, to, timeType, stopScope, limit });
    return this.execute(`schedule/stops/${stopId}/times${qs}`, () =>
      this.provider.getStopDepartures(
        stopId,
        from,
        to,
        timeType,
        stopScope,
        limit
      )
    );
  }

  async getRoutingInfo(): Promise<ApiResponse<RoutingInfo>> {
    return this.execute('routing', () => this.provider.getRoutingInfo());
  }

  async getConnections(
    sourceStopId: string | undefined,
    targetStopId: string | undefined,
    dateTime: string,
    timeType: TimeType,
    config: QueryConfig
  ): Promise<ApiResponse<Connection[]>> {
    const qs = formatParams({
      sourceStopId,
      targetStopId,
      dateTime,
      timeType,
      ...config,
    });
    return this.execute(`routing/connections${qs}`, () =>
      this.provider.getConnections(
        sourceStopId,
        targetStopId,
        dateTime,
        timeType,
        config
      )
    );
  }

  async getIsolines(
    sourceStopId: string,
    dateTime: string,
    timeType: TimeType,
    maxTravelDuration: number,
    config: QueryConfig
  ): Promise<ApiResponse<StopConnection[]>> {
    // Spread config first, then override with explicit duration to correct logging URL
    const qs = formatParams({
      sourceStopId,
      dateTime,
      timeType,
      detailed: false,
      ...config,
      maxTravelDuration,
    });
    return this.execute(`routing/isolines${qs}`, () =>
      this.provider.getIsolines(
        sourceStopId,
        dateTime,
        timeType,
        maxTravelDuration,
        config
      )
    );
  }

  private notifyListeners(log: RequestLog) {
    this.listeners.forEach((listener) => listener(log));
  }

  private notifyConfigListeners() {
    this.configListeners.forEach((listener) => listener());
  }

  private async execute<T>(
    operationName: string,
    fn: () => Promise<ProviderResponse<T>>
  ): Promise<ApiResponse<T>> {
    const start = performance.now();
    let result: ProviderResponse<T>;

    const logUrl = this.isMockMode
      ? `MOCK://${operationName}`
      : `${this.currentBaseUrl}/${operationName}`;

    try {
      result = await fn();
    } catch (error: unknown) {
      result = { data: {} as T, status: 0, error: toErrorMessage(error) };
    }

    const end = performance.now();
    const duration = end - start;

    const logEntry: RequestLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      url: logUrl,
      method: this.isMockMode ? 'MOCK' : 'GET',
      duration,
      status: result.status,
      error: result.error,
    };

    this.notifyListeners(logEntry);

    if (result.status >= 400 || result.status === 0) {
      throw new Error(result.error || `Error ${result.status}`);
    }

    return {
      data: result.data,
      duration,
      status: result.status,
    };
  }
}

export const naviqoreService = new NaviqoreService();
