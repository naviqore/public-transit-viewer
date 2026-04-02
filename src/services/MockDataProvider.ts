import { IDataProvider, ProviderResult } from './IDataProvider';
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
import {
  getMockDeparturesForStop,
  MOCK_CONNECTIONS,
  MOCK_ISOLINES,
  MOCK_ROUTING_INFO,
  MOCK_SCHEDULE_INFO,
  MOCK_STOPS,
} from './mockData';

export class MockDataProvider implements IDataProvider {
  async getScheduleInfo(): Promise<ProviderResult<ScheduleInfo>> {
    return this.delay(MOCK_SCHEDULE_INFO);
  }

  async autocompleteStops(query: string): Promise<ProviderResult<Stop[]>> {
    const lower = query.toLowerCase();
    const matches = MOCK_STOPS.filter((s) =>
      s.name.toLowerCase().includes(lower)
    );
    return this.delay(matches);
  }

  async getNearestStops(
    lat: number,
    lon: number
  ): Promise<ProviderResult<DistanceToStop[]>> {
    void lat;
    void lon;
    const stops = MOCK_STOPS.map((s) => ({
      stop: s,
      distance: Math.random() * 500, // random distance
    }));
    return this.delay(stops);
  }

  async getRandomStop(): Promise<ProviderResult<Stop>> {
    const stop = MOCK_STOPS[Math.floor(Math.random() * MOCK_STOPS.length)];
    return this.delay(stop);
  }

  async getStopDepartures(
    stopId: string,
    from: string,
    to: string,
    timeType: TimeType,
    stopScope: StopScope,
    limit: number
  ): Promise<ProviderResult<StopDeparture[]>> {
    void from;
    void to;
    void timeType;
    void stopScope;
    void limit;
    const departures: StopDeparture[] = getMockDeparturesForStop(stopId).map(
      (item) => ({
        stopTime: item.stopTime,
        trip: {
          headSign: item.trip.headSign,
          route: {
            id: item.trip.route.shortName,
            name: item.trip.route.shortName,
            shortName: item.trip.route.shortName,
            transportMode: item.trip.route.transportMode,
          },
          stopTimes: item.trip.stopTimes,
          bikesAllowed: false,
          wheelchairAccessible: false,
        },
      })
    );

    return this.delay(departures);
  }

  async getRoutingInfo(): Promise<ProviderResult<RoutingInfo>> {
    return this.delay(MOCK_ROUTING_INFO);
  }

  async getConnections(
    sourceStopId: string | undefined,
    targetStopId: string | undefined,
    dateTime: string,
    timeType: TimeType,
    config: QueryConfig
  ): Promise<ProviderResult<Connection[]>> {
    void sourceStopId;
    void targetStopId;
    void dateTime;
    void timeType;
    void config;
    return this.delay(MOCK_CONNECTIONS, 800);
  }

  async getIsolines(
    sourceStopId: string,
    dateTime: string,
    timeType: TimeType,
    maxTravelDuration: number,
    config: QueryConfig
  ): Promise<ProviderResult<StopConnection[]>> {
    void sourceStopId;
    void dateTime;
    void timeType;
    void maxTravelDuration;
    void config;
    return this.delay(MOCK_ISOLINES, 1200);
  }

  private async delay<T>(
    data: T,
    ms: number = 400
  ): Promise<ProviderResult<T>> {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return { ok: true, data, status: 200 };
  }
}
