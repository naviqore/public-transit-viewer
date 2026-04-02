import L from 'leaflet';
import { ArrowUpDown, Route, SlidersHorizontal } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import ConnectionCard from '../components/common/ConnectionCard';
import DateTimeSelector from '../components/common/DateTimeSelector';
import Loader from '../components/common/Loader';
import PageHeader from '../components/common/PageHeader';
import StalenessIndicator from '../components/common/StalenessIndicator';
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
    queriedAt,
  } = routingState;

  const [loading, setLoading] = useState(false);
  const [mapCenter] = useState<[number, number]>(() => {
    if (fromStop && toStop) {
      return [
        (fromStop.coordinates.latitude + toStop.coordinates.latitude) / 2,
        (fromStop.coordinates.longitude + toStop.coordinates.longitude) / 2,
      ];
    }
    if (fromStop)
      return [fromStop.coordinates.latitude, fromStop.coordinates.longitude];
    if (toStop)
      return [toStop.coordinates.latitude, toStop.coordinates.longitude];
    return DEFAULT_MAP_CENTER;
  });
  const [customBounds, setCustomBounds] = useState<L.LatLngBounds | null>(null);
  const [selectedLegIndex, setSelectedLegIndex] = useState<number | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Initialize date if empty
  useEffect(() => {
    if (!routingState.date) {
      setRoutingState((prev) => ({
        ...prev,
        date: getCurrentInputTime(timezone),
      }));
    }
  }, [routingState.date, setRoutingState, timezone]);

  const updateState = useCallback(
    (updates: Partial<typeof routingState>) => {
      setRoutingState((prev) => ({ ...prev, ...updates }));
    },
    [setRoutingState]
  );

  const effectiveConfig = React.useMemo<QueryConfig>(
    () => ({
      ...queryConfig,
      maxTravelDuration: maxTravelDuration,
    }),
    [queryConfig, maxTravelDuration]
  );

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
        // Recompute bounds from existing data on restore
        if (fromStop && toStop && connections.length > 0) {
          const latLngs: [number, number][] = [
            [fromStop.coordinates.latitude, fromStop.coordinates.longitude],
            [toStop.coordinates.latitude, toStop.coordinates.longitude],
          ];
          const source = selectedConnection
            ? [selectedConnection]
            : connections;
          source.forEach((conn) => {
            conn.legs.forEach((leg) => {
              latLngs.push([leg.from.latitude, leg.from.longitude]);
              latLngs.push([leg.to.latitude, leg.to.longitude]);
              if (leg.trip) {
                getLegStopTimes(leg).forEach((st) => {
                  latLngs.push([
                    st.stop.coordinates.latitude,
                    st.stop.coordinates.longitude,
                  ]);
                });
              }
            });
          });
          setCustomBounds(L.latLngBounds(latLngs));
        }
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

      let cancelled = false;
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
              if (!cancelled) setCustomBounds(computedBounds);
            }
          }
          if (!cancelled)
            updateState({
              connections: res.data,
              lastQueriedKey: queryKey,
              queriedAt: new Date(),
            });
        } catch (e) {
          if (!cancelled) {
            console.error(e);
            updateState({
              connections: [],
              lastQueriedKey: null,
              queriedAt: null,
            });
            addToast({
              id: crypto.randomUUID(),
              type: 'error',
              message: 'Could not load connections',
              details: e instanceof Error ? e.message : undefined,
            });
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      }, 500);

      return () => {
        cancelled = true;
        clearTimeout(timeoutId);
      };
    }
  }, [
    fromStop,
    toStop,
    date,
    timeType,
    queryConfig,
    maxTravelDuration,
    timezone,
    updateState,
    lastQueriedKey,
    connections,
    selectedConnection,
    effectiveConfig,
    addToast,
  ]);

  const formatTime = (isoString: string) => {
    return formatDisplayTime(isoString, timezone, useStationTime);
  };

  const handleConnectionClick = (conn: Connection) => {
    const isDeselecting = selectedConnection === conn;
    updateState({ selectedConnection: isDeselecting ? null : conn });
    setCustomBounds(null);
    setSelectedLegIndex(null);
  };

  const handleLegClick = (leg: Leg, legIndex: number) => {
    // Toggle leg selection: clicking the same leg deselects it
    const isDeselecting = selectedLegIndex === legIndex;
    setSelectedLegIndex(isDeselecting ? null : legIndex);

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
    setCustomBounds(isDeselecting ? null : bounds);
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

  // Recompute overview bounds when a connection is deselected
  useEffect(() => {
    if (selectedConnection || connections.length === 0 || !fromStop || !toStop)
      return;
    const latLngs: [number, number][] = [
      [fromStop.coordinates.latitude, fromStop.coordinates.longitude],
      [toStop.coordinates.latitude, toStop.coordinates.longitude],
    ];
    connections.forEach((conn) => {
      conn.legs.forEach((leg) => {
        latLngs.push([leg.from.latitude, leg.from.longitude]);
        latLngs.push([leg.to.latitude, leg.to.longitude]);
        if (leg.trip) {
          getLegStopTimes(leg).forEach((st) => {
            latLngs.push([
              st.stop.coordinates.latitude,
              st.stop.coordinates.longitude,
            ]);
          });
        }
      });
    });
    setCustomBounds(L.latLngBounds(latLngs));
  }, [selectedConnection, connections, fromStop, toStop]);

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
            <StalenessIndicator
              queriedAt={queriedAt}
              onRefresh={() =>
                updateState({ lastQueriedKey: null, queriedAt: null })
              }
            />
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
                      selectedLegIndex={
                        selectedConnection === conn ? selectedLegIndex : null
                      }
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
          center={mapCenter}
          zoom={DEFAULT_ZOOM}
          connections={connections}
          selectedConnection={selectedConnection}
          selectedLegIndex={selectedLegIndex}
          customBounds={customBounds}
          onConnectionClick={handleConnectionClick}
          onLegClick={handleLegClick}
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
