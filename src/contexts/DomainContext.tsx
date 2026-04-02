import React, { createContext, useContext, useEffect, useState } from 'react';

import { DEFAULT_EXPLORE_CONFIG } from '../constants';
import { naviqoreService } from '../services/naviqoreService';
import {
  ExploreState,
  IsolineState,
  RoutingState,
  ServerInfo,
  TimeType,
} from '../types';

type BackendStatus = 'loading' | 'ok' | 'error';

interface DomainContextType {
  serverInfo: ServerInfo;
  backendStatus: BackendStatus;

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
  const [serverInfo, setServerInfo] = useState<ServerInfo>({
    schedule: null,
    routing: null,
  });
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('loading');

  const [exploreState, setExploreState] = useState<ExploreState>({
    selectedStop: null,
    departures: [],
    nearbyStops: [],
    date: new Date().toISOString().slice(0, 16),
    config: DEFAULT_EXPLORE_CONFIG,
    lastQueriedKey: null,
    queriedAt: null,
    expandedTripIndex: null,
  });

  const [routingState, setRoutingState] = useState<RoutingState>({
    fromStop: null,
    toStop: null,
    connections: [],
    selectedConnection: null,
    date: new Date().toISOString().slice(0, 16),
    timeType: TimeType.DEPARTURE,
    maxTravelDuration: undefined,
    lastQueriedKey: null,
    queriedAt: null,
  });

  const [isolineState, setIsolineState] = useState<IsolineState>({
    centerStop: null,
    isolines: [],
    maxDuration: 30,
    date: new Date().toISOString().slice(0, 16),
    lastQueriedKey: null,
    queriedAt: null,
    expandedStopId: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      setBackendStatus('loading');
      try {
        const [sched, rout] = await Promise.all([
          naviqoreService.getScheduleInfo(),
          naviqoreService.getRoutingInfo(),
        ]);
        setServerInfo({
          schedule: sched.data,
          routing: rout.data,
        });
        setBackendStatus('ok');
      } catch (e: unknown) {
        console.error('Failed to load server capabilities', e);
        setBackendStatus('error');
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
        backendStatus,
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
