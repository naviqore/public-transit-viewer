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

export interface ProviderResponse<T> {
  data: T;
  status: number;
  error?: string;
}

export interface IDataProvider {
  // Schedule
  getScheduleInfo(): Promise<ProviderResponse<ScheduleInfo>>;

  autocompleteStops(query: string): Promise<ProviderResponse<Stop[]>>;

  getNearestStops(
    lat: number,
    lon: number
  ): Promise<ProviderResponse<DistanceToStop[]>>;

  getStopDepartures(
    stopId: string,
    from: string,
    to: string,
    timeType: TimeType,
    stopScope: StopScope,
    limit: number
  ): Promise<ProviderResponse<StopDeparture[]>>;

  // Routing
  getRoutingInfo(): Promise<ProviderResponse<RoutingInfo>>;

  getConnections(
    sourceStopId: string | undefined,
    targetStopId: string | undefined,
    dateTime: string,
    timeType: TimeType,
    config: QueryConfig
  ): Promise<ProviderResponse<Connection[]>>;

  getIsolines(
    sourceStopId: string,
    dateTime: string,
    timeType: TimeType,
    maxTravelDuration: number,
    config: QueryConfig
  ): Promise<ProviderResponse<StopConnection[]>>;
}
