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

export interface ProviderResponse {
  ok: boolean;
  status: number;
}

export interface ProviderSuccessResponse<T> extends ProviderResponse {
  ok: true;
  data: T;
}

export interface ProviderError {
  message: string;
  title?: string;
  detail?: string;
  type?: string;
  instance?: string;
  requestId?: string;
  method?: string;
  timestamp?: string;
  status?: number;
  extras?: Record<string, unknown>;
}

export interface ProviderFailureResponse extends ProviderResponse {
  ok: false;
  error: ProviderError;
}

export type ProviderResult<T> =
  | ProviderSuccessResponse<T>
  | ProviderFailureResponse;

export interface IDataProvider {
  // Schedule
  getScheduleInfo(): Promise<ProviderResult<ScheduleInfo>>;

  autocompleteStops(query: string): Promise<ProviderResult<Stop[]>>;

  getNearestStops(
    lat: number,
    lon: number
  ): Promise<ProviderResult<DistanceToStop[]>>;

  getStopDepartures(
    stopId: string,
    from: string,
    to: string,
    timeType: TimeType,
    stopScope: StopScope,
    limit: number
  ): Promise<ProviderResult<StopDeparture[]>>;

  // Routing
  getRoutingInfo(): Promise<ProviderResult<RoutingInfo>>;

  getConnections(
    sourceStopId: string | undefined,
    targetStopId: string | undefined,
    dateTime: string,
    timeType: TimeType,
    config: QueryConfig
  ): Promise<ProviderResult<Connection[]>>;

  getIsolines(
    sourceStopId: string,
    dateTime: string,
    timeType: TimeType,
    maxTravelDuration: number,
    config: QueryConfig
  ): Promise<ProviderResult<StopConnection[]>>;
}
