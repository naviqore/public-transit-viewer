export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface Stop {
  id: string;
  name: string;
  coordinates: GeoCoordinate;
}

export interface DistanceToStop {
  stop: Stop;
  distance: number;
}

export interface Route {
  id: string;
  name: string;
  shortName: string;
  transportMode: string; // 'BUS' | 'TRAM' | 'RAIL' etc
  transportModeDescription?: string;
}

export interface StopTime {
  stop: Stop;
  arrivalTime: string; // ISO OffsetDateTime
  departureTime: string; // ISO OffsetDateTime
}

export interface StopDeparture {
  stopTime: StopTime;
  trip: Trip;
}

export interface Trip {
  headSign: string;
  route: Route;
  stopTimes?: StopTime[]; // Optional depending on detail level
  bikesAllowed: boolean;
  wheelchairAccessible: boolean;
}

export interface Leg {
  type: 'WALK' | 'ROUTE';
  from: GeoCoordinate;
  to: GeoCoordinate;
  fromStop?: Stop;
  toStop?: Stop;
  departureTime: string;
  arrivalTime: string;
  trip?: Trip;
  duration?: number; // Calculated helper
  distance?: number; // Calculated helper
}

export interface Connection {
  legs: Leg[];
  departureTime?: string; // Helper
  arrivalTime?: string; // Helper
  duration?: number; // Helper seconds
  transfers?: number; // Helper
}

export interface StopConnection {
  stop: Stop;
  departureTime: string;
  arrivalTime: string;
  transfers: number;
  connectingLeg: Leg;
  connection?: Connection | null;
}

export interface ScheduleInfo {
  hasAccessibility: boolean;
  hasBikes: boolean;
  hasTravelModes: boolean;
  scheduleValidity: {
    startDate: string;
    endDate: string;
  };
}

export interface RoutingInfo {
  supportsMaxTransfers: boolean;
  supportsMaxTravelDuration: boolean;
  supportsMaxWalkDuration: boolean;
  supportsMinTransferDuration: boolean;
  supportsAccessibility: boolean;
  supportsBikes: boolean;
  supportsTravelModes: boolean;
}

export interface ApiResponse<T> {
  data: T;
  duration: number; // ms
  status: number;
}

export enum TimeType {
  DEPARTURE = 'DEPARTURE',
  ARRIVAL = 'ARRIVAL',
}

export enum TransportMode {
  BUS = 'BUS',
  TRAM = 'TRAM',
  RAIL = 'RAIL',
  SHIP = 'SHIP',
  SUBWAY = 'SUBWAY',
  AERIAL_LIFT = 'AERIAL_LIFT',
  FUNICULAR = 'FUNICULAR',
}

export enum StopScope {
  STRICT = 'STRICT',
  CHILDREN = 'CHILDREN',
  RELATED = 'RELATED',
  NEARBY = 'NEARBY',
}

export interface QueryConfig {
  maxWalkDuration?: number;
  maxTransfers?: number;
  maxTravelDuration?: number;
  minTransferDuration?: number;
  timeWindowDuration?: number;
  wheelchairAccessible: boolean;
  bikeAllowed: boolean;
  travelModes: TransportMode[];
}

export interface ExploreQueryConfig {
  stopScope: StopScope;
  timeWindowMinutes: number;
  limit: number;
}

// --- New Types for Benchmarking and Notifications ---

export interface RequestLog {
  id: string;
  timestamp: Date;
  url: string;
  method: string;
  duration: number;
  status: number;
  error?: string;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  details?: string;
}

export interface BenchmarkStats {
  totalSent: number;
  totalSuccess: number;
  totalError: number;
  currentRps: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  errors: string[];
}

export type BenchmarkScenario = 'random' | 'real_life' | 'fixed';

export interface BenchmarkConfig {
  concurrency: number;
  delayMs: number;
  timeWindowDuration: number;
  scenario: BenchmarkScenario;
  fixedDate: string; // YYYY-MM-DD
}
