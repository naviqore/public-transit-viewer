import L from 'leaflet';
import { ArrowUpDown, Route, SlidersHorizontal } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import ConnectionCard from '../components/common/ConnectionCard';
import DateTimeSelector from '../components/common/DateTimeSelector';
import Loader from '../components/common/Loader';
import PageHeader from '../components/common/PageHeader';
import StopSearch from '../components/common/StopSearch';
import MapComponent from '../components/Map';
import QueryConfigDialog from '../components/QueryConfigDialog';
import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from '../constants';
import { useDomain } from '../contexts/DomainContext';
import { useMonitoring } from '../contexts/MonitoringContext';
import { useSettings } from '../contexts/SettingsContext';
import { naviqoreService } from '../services/naviqoreService';
import { Connection, Leg, QueryConfig, TimeType } from '../types';
import { getLegStopTimes } from '../utils/dataUtils';
import {
  formatDisplayTime,
  getCurrentInputTime,
  inputDateToIso,
} from '../utils/dateUtils';
import { scrollCardIntoView } from '../utils/domUtils';
import './PageStyles.css';

const ConnectPage: React.FC = () => {
  const { timezone, queryConfig, setQueryConfig, useStationTime } =
    useSettings();
  const { routingState, setRoutingState } = useDomain();
  const { addToast } = useMonitoring();

  const {
    fromStop,
    toStop,
    connections,
    selectedConnection,
    date,
    timeType,
    maxTravelDuration,
    lastQueriedKey,
    mapBounds,
  } = routingState;

  const [loading, setLoading] = useState(false);
  const [customBounds, setCustomBounds] = useState<L.LatLngBounds | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Initialize date if empty
  useEffect(() => {
    if (!routingState.date) {
      setRoutingState((prev) => ({
        ...prev,
        date: getCurrentInputTime(timezone),
      }));
    }
  }, [timezone]);

  const updateState = (updates: Partial<typeof routingState>) => {
    setRoutingState((prev) => ({ ...prev, ...updates }));
  };

  const effectiveConfig: QueryConfig = {
    ...queryConfig,
    maxTravelDuration: maxTravelDuration,
  };

  const handleConfigChange = (newConfig: QueryConfig) => {
    const { maxTravelDuration: newDuration, ...rest } = newConfig;
    setQueryConfig(rest);
    updateState({ maxTravelDuration: newDuration });
  };

  const handleSwapStops = () => {
    updateState({
      fromStop: toStop,
      toStop: fromStop,
      selectedConnection: null,
    });
    // Do not reset customBounds here; let useEffect handle the immediate O/D bounds
  };

  useEffect(() => {
    if (fromStop && toStop && date) {
      const queryKey = JSON.stringify({
        fromStopId: fromStop.id,
        toStopId: toStop.id,
        date,
        timeType,
        queryConfig,
        maxTravelDuration,
      });

      if (lastQueriedKey === queryKey) {
        // If no connection is selected, restore overview bounds.
        // If a connection is selected, leave customBounds null so the Map auto-fits to it.
        if (mapBounds && !selectedConnection)
          setCustomBounds(L.latLngBounds(mapBounds));
        return;
      }

      setLoading(true);
      updateState({ selectedConnection: null, lastQueriedKey: null });

      // Immediately set bounds to Origin and Destination to prevent map jumping to default center
      // This ensures the map focuses on the context of the search while loading
      const startLatLng: [number, number] = [
        fromStop.coordinates.latitude,
        fromStop.coordinates.longitude,
      ];
      const endLatLng: [number, number] = [
        toStop.coordinates.latitude,
        toStop.coordinates.longitude,
      ];
      setCustomBounds(L.latLngBounds([startLatLng, endLatLng]));

      const timeoutId = setTimeout(async () => {
        try {
          // Convert the "wall clock" input string to an ISO string with offset in the selected timezone
          const isoDate = inputDateToIso(date, timezone);
          const res = await naviqoreService.getConnections(
            fromStop.id,
            toStop.id,
            isoDate,
            timeType,
            effectiveConfig
          );

          // Calculate bounds to fit all connections
          let storedMapBounds: [[number, number], [number, number]] | null =
            null;
          if (res.data.length > 0) {
            const latLngs: [number, number][] = [];
            // Ensure origin/dest are included
            latLngs.push([
              fromStop.coordinates.latitude,
              fromStop.coordinates.longitude,
            ]);
            latLngs.push([
              toStop.coordinates.latitude,
              toStop.coordinates.longitude,
            ]);

            res.data.forEach((conn) => {
              conn.legs.forEach((leg) => {
                latLngs.push([leg.from.latitude, leg.from.longitude]);
                latLngs.push([leg.to.latitude, leg.to.longitude]);
                // Include intermediate stops for accurate bounding of curved routes
                // Only include stops relevant to the specific leg segment
                if (leg.trip) {
                  const relevantStops = getLegStopTimes(leg);
                  relevantStops.forEach((st) => {
                    latLngs.push([
                      st.stop.coordinates.latitude,
                      st.stop.coordinates.longitude,
                    ]);
                  });
                }
              });
            });

            if (latLngs.length > 0) {
              const computedBounds = L.latLngBounds(latLngs);
              setCustomBounds(computedBounds);
              storedMapBounds = [
                [
                  computedBounds.getSouthWest().lat,
                  computedBounds.getSouthWest().lng,
                ],
                [
                  computedBounds.getNorthEast().lat,
                  computedBounds.getNorthEast().lng,
                ],
              ];
            }
          }
          updateState({
            connections: res.data,
            lastQueriedKey: queryKey,
            mapBounds: storedMapBounds,
          });
        } catch (e) {
          console.error(e);
          updateState({ connections: [], lastQueriedKey: null });
          addToast({
            id: crypto.randomUUID(),
            type: 'error',
            message: 'Could not load connections',
            details: e instanceof Error ? e.message : undefined,
          });
        } finally {
          setLoading(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [
    fromStop,
    toStop,
    date,
    timeType,
    queryConfig,
    maxTravelDuration,
    timezone,
  ]);

  const formatTime = (isoString: string) => {
    return formatDisplayTime(isoString, timezone, useStationTime);
  };

  const handleConnectionClick = (conn: Connection) => {
    updateState({ selectedConnection: conn });
    // When selecting a specific connection, we generally want the map to focus on that connection,
    // which is handled by MapComponent's internal auto-fit logic when selectedConnection changes,
    // provided customBounds is null or we explicitly set it for the connection.
    // Resetting customBounds allows MapComponent to take over with selectedConnection focus.
    setCustomBounds(null);
    // scrolling is handled by the selectedConnection useEffect above
  };

  const handleLegClick = (leg: Leg) => {
    const bounds = L.latLngBounds(
      [leg.from.latitude, leg.from.longitude],
      [leg.to.latitude, leg.to.longitude]
    );
    // If trip stops exist, include only relevant segment stops
    if (leg.trip) {
      const relevantStops = getLegStopTimes(leg);
      relevantStops.forEach((st) => {
        bounds.extend([
          st.stop.coordinates.latitude,
          st.stop.coordinates.longitude,
        ]);
      });
    }
    setCustomBounds(bounds);
  };

  // Scroll to selected connection on restore or when a new connection is selected
  useEffect(() => {
    if (!selectedConnection || connections.length === 0) return;
    const idx = connections.indexOf(selectedConnection);
    if (idx === -1) return;
    setTimeout(() => {
      scrollCardIntoView(`conn-${idx}`);
    }, 100);
  }, [selectedConnection, connections]);

  return (
    <div className="page-wrapper flex flex-col h-full overflow-hidden">
      <PageHeader title="Connect" icon={Route} />
      <div className="flex-1 overflow-y-auto">
        <div className="panel-section">
          <div className="panel-header space-y-3 p-4">
            <div className="flex items-center gap-2 relative">
              <div className="flex-1 flex flex-col gap-2 relative">
                {/* Visual Connector Line */}
                <div className="absolute left-[19px] top-[19px] bottom-[19px] w-0.5 border-l-2 border-dotted border-slate-300 dark:border-slate-600 z-0 pointer-events-none" />

                <StopSearch
                  selectedStop={fromStop}
                  onSelect={(s) => updateState({ fromStop: s })}
                  placeholder="Origin"
                  autoFocus={!fromStop}
                  className="mb-0"
                />
                <StopSearch
                  selectedStop={toStop}
                  onSelect={(s) => updateState({ toStop: s })}
                  placeholder="Destination"
                  className="mb-0"
                />
              </div>

              {/* Swap Button */}
              <button
                onClick={handleSwapStops}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-700 transition-all shadow-sm z-10 flex-shrink-0"
                title="Swap Origin and Destination"
                aria-label="Swap Origin and Destination"
              >
                <ArrowUpDown size={14} />
              </button>
            </div>
            <div className="flex items-start gap-1 sm:gap-2">
              <div className="flex-1 min-w-0 w-full">
                <DateTimeSelector
                  date={date}
                  setDate={(d: string) => updateState({ date: d })}
                  timeType={timeType}
                  setTimeType={(t: TimeType) => updateState({ timeType: t })}
                />
              </div>
              <button
                onClick={() => setShowConfig(true)}
                className="mt-[22px] h-9 w-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center justify-center flex-shrink-0"
                title="Connection Options"
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>
          </div>
          <div className="panel-content p-4">
            {loading ? (
              <Loader text="Finding Connections..." />
            ) : (
              <>
                {connections.length === 0 && fromStop && toStop && (
                  <div className="text-center py-8 text-slate-400">
                    No connections found.
                  </div>
                )}
                {connections.length === 0 && (!fromStop || !toStop) && (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                    <p className="text-sm font-medium">
                      Select origin and destination
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {connections.map((conn, idx) => (
                    <ConnectionCard
                      key={idx}
                      id={`conn-${idx}`}
                      connection={conn}
                      isSelected={selectedConnection === conn}
                      onClick={() => handleConnectionClick(conn)}
                      onLegClick={handleLegClick}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="map-section">
        <MapComponent
          center={DEFAULT_MAP_CENTER}
          zoom={DEFAULT_ZOOM}
          connections={connections}
          selectedConnection={selectedConnection}
          customBounds={customBounds}
          onConnectionClick={handleConnectionClick}
          sourceStop={fromStop || undefined}
          targetStop={toStop || undefined}
        />
      </div>
      {showConfig && (
        <QueryConfigDialog
          config={effectiveConfig}
          onChange={handleConfigChange}
          onClose={() => setShowConfig(false)}
          showMaxTravelDuration={true}
        />
      )}
    </div>
  );
};

export default ConnectPage;
