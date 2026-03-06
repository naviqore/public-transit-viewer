import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Connection,
  ExploreQueryConfig,
  RoutingInfo,
  ScheduleInfo,
  StopDeparture,
  Stop,
  StopConnection,
  TimeType,
} from '../types';
import { naviqoreService } from '../services/naviqoreService';
import { DEFAULT_EXPLORE_CONFIG } from '../constants';

interface ExploreState {
  selectedStop: Stop | null;
  departures: StopDeparture[];
  nearbyStops: Stop[];
  date: string;
  config: ExploreQueryConfig;
}

interface RoutingState {
  fromStop: Stop | null;
  toStop: Stop | null;
  connections: Connection[];
  selectedConnection: Connection | null;
  date: string;
  timeType: TimeType;
  maxTravelDuration?: number;
}

interface IsolineState {
  centerStop: Stop | null;
  isolines: StopConnection[];
  maxDuration: number;
  date: string;
}

interface ServerInfo {
  schedule: ScheduleInfo | null;
  routing: RoutingInfo | null;
}

interface DomainContextType {
  serverInfo: ServerInfo;

  exploreState: ExploreState;
  setExploreState: React.Dispatch<React.SetStateAction<ExploreState>>;

  routingState: RoutingState;
  setRoutingState: React.Dispatch<React.SetStateAction<RoutingState>>;

  isolineState: IsolineState;
  setIsolineState: React.Dispatch<React.SetStateAction<IsolineState>>;
}

const DomainContext = createContext<DomainContextType | undefined>(undefined);

export const DomainProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Server Capabilities
  const [serverInfo, setServerInfo] = useState<ServerInfo>({
    schedule: null,
    routing: null,
  });

  // Explore Page State
  const [exploreState, setExploreState] = useState<ExploreState>({
    selectedStop: null,
    departures: [],
    nearbyStops: [],
    date: new Date().toISOString().slice(0, 16),
    config: DEFAULT_EXPLORE_CONFIG,
  });

  // Routing Page State
  const [routingState, setRoutingState] = useState<RoutingState>({
    fromStop: null,
    toStop: null,
    connections: [],
    selectedConnection: null,
    date: new Date().toISOString().slice(0, 16),
    timeType: TimeType.DEPARTURE,
    maxTravelDuration: undefined,
  });

  // Isoline Page State
  const [isolineState, setIsolineState] = useState<IsolineState>({
    centerStop: null,
    isolines: [],
    maxDuration: 30,
    date: new Date().toISOString().slice(0, 16),
  });

  // Data Fetching Logic
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sched, rout] = await Promise.all([
          naviqoreService.getScheduleInfo(),
          naviqoreService.getRoutingInfo(),
        ]);
        setServerInfo({
          schedule: sched.data,
          routing: rout.data,
        });
      } catch (e) {
        console.error('Failed to load server capabilities', e);
      }
    };

    // Small delay ensures parent contexts (like Monitoring) are subscribed to naviqoreService events
    // before we fire the initial requests. This ensures startup errors are logged/toasted.
    const t = setTimeout(fetchData, 100);

    // Subscribe to configuration changes (Mock toggle, URL change)
    // This ensures we reload capabilities when the environment switches.
    const unsubscribe = naviqoreService.onConfigChange(() => {
      fetchData();
    });

    return () => {
      clearTimeout(t);
      unsubscribe();
    };
  }, []);

  return (
    <DomainContext.Provider
      value={{
        serverInfo,
        exploreState,
        setExploreState,
        routingState,
        setRoutingState,
        isolineState,
        setIsolineState,
      }}
    >
      {children}
    </DomainContext.Provider>
  );
};

export const useDomain = () => {
  const context = useContext(DomainContext);
  if (!context)
    throw new Error('useDomain must be used within a DomainProvider');
  return context;
};
