import L from 'leaflet';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';
import { DateTime } from 'luxon';
import React, { useEffect, useMemo, useState } from 'react';

import DateTimeSelector from '../components/common/DateTimeSelector';
import Loader from '../components/common/Loader';
import PageHeader from '../components/common/PageHeader';
import StopSearch from '../components/common/StopSearch';
import TransportIcon from '../components/common/TransportIcon';
import TripTimeline from '../components/common/TripTimeline';
import ExploreConfigDialog from '../components/ExploreConfigDialog';
import MapComponent from '../components/Map';
import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from '../constants';
import { useDomain } from '../contexts/DomainContext';
import { useMonitoring } from '../contexts/MonitoringContext';
import { useSettings } from '../contexts/SettingsContext';
import { naviqoreService } from '../services/naviqoreService';
import { Connection, DistanceToStop, Leg, Stop, TimeType } from '../types';
import {
  formatDisplayTime,
  getCurrentInputTime,
  inputDateToIso,
} from '../utils/dateUtils';

import './PageStyles.css';

const ExplorePage: React.FC = () => {
  const { timezone, useStationTime } = useSettings();
  const { exploreState, setExploreState } = useDomain();
  const { addToast } = useMonitoring();

  const { selectedStop, departures, nearbyStops, date, config } = exploreState;

  const [mapCenter, setMapCenter] = useState<[number, number]>(
    selectedStop
      ? [selectedStop.coordinates.latitude, selectedStop.coordinates.longitude]
      : DEFAULT_MAP_CENTER
  );
  const [loading, setLoading] = useState(false);
  const [timeType, setTimeType] = useState<TimeType>(TimeType.DEPARTURE);
  const [expandedTripIndex, setExpandedTripIndex] = useState<number | null>(
    null
  );
  const [customBounds, setCustomBounds] = useState<L.LatLngBounds | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Initialize date if empty
  useEffect(() => {
    if (!exploreState.date) {
      setExploreState((prev) => ({
        ...prev,
        date: getCurrentInputTime(timezone),
      }));
    }
  }, [timezone]);

  const updateState = (updates: Partial<typeof exploreState>) => {
    setExploreState((prev) => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    if (selectedStop && date) {
      setLoading(true);
      setMapCenter([
        selectedStop.coordinates.latitude,
        selectedStop.coordinates.longitude,
      ]);
      setCustomBounds(null);

      const fetchDepartures = async () => {
        try {
          // Convert the "wall clock" input string to an ISO string with offset in the selected timezone
          const isoFrom = inputDateToIso(date, timezone);

          // Calculate "To" time based on window configuration
          const dtFrom = DateTime.fromISO(isoFrom);
          const isoTo =
            dtFrom.plus({ minutes: config.timeWindowMinutes }).toISO() ||
            isoFrom;

          const res = await naviqoreService.getStopDepartures(
            selectedStop.id,
            isoFrom,
            isoTo,
            timeType,
            config.stopScope,
            config.limit
          );
          updateState({ departures: res.data });
        } catch (e) {
          console.error(e);
          updateState({ departures: [] });
          addToast({
            id: crypto.randomUUID(),
            type: 'error',
            message: 'Could not load departures',
            details: e instanceof Error ? e.message : undefined,
          });
        } finally {
          setLoading(false);
        }
      };
      fetchDepartures();
    } else {
      if (departures.length > 0) updateState({ departures: [] });
    }
  }, [selectedStop, date, timeType, timezone, config]);

  const handleMapClick = async (lat: number, lon: number) => {
    try {
      const res = await naviqoreService.getNearestStops(lat, lon);
      updateState({ nearbyStops: res.data.map((d: DistanceToStop) => d.stop) });
      if (res.data.length > 0) {
        updateState({ selectedStop: res.data[0].stop });
        setExpandedTripIndex(null);
      }
    } catch (e) {
      console.error(e);
      addToast({
        id: crypto.randomUUID(),
        type: 'error',
        message: 'Could not find nearby stops',
        details: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const handleStopSelect = (stop: Stop | null) => {
    updateState({ selectedStop: stop });
    setExpandedTripIndex(null);
  };

  const toggleTrip = (index: number) => {
    setExpandedTripIndex(expandedTripIndex === index ? null : index);
  };

  const expandedConnection = useMemo<Connection | null>(() => {
    if (expandedTripIndex === null || !departures[expandedTripIndex])
      return null;
    const dep = departures[expandedTripIndex];
    const stopTimes = dep.trip.stopTimes || [];
    if (stopTimes.length < 2) return null;

    // Construct leg from the absolute start of the trip to the end
    // This ensures MapComponent renders the passed stops (greyed out) up to the current stop
    const first = stopTimes[0];
    const last = stopTimes[stopTimes.length - 1];

    const leg: Leg = {
      type: 'ROUTE',
      from: first.stop.coordinates,
      to: last.stop.coordinates,
      fromStop: first.stop,
      toStop: last.stop,
      departureTime: first.departureTime,
      arrivalTime: last.arrivalTime,
      trip: dep.trip,
    };

    return {
      legs: [leg],
      departureTime: first.departureTime,
      arrivalTime: last.arrivalTime,
      duration: 0,
      transfers: 0,
    };
  }, [expandedTripIndex, departures]);

  // Determine the relevant stop ID for map visualization context (Past vs Future split)
  const activeMapStopId = useMemo(() => {
    // If a specific trip is expanded, use the stop ID from that departure's stopTime
    // This ensures we match the specific platform/quay ID used in the trip data,
    // allowing the map to correctly identify "past" vs "future" stops.
    if (expandedTripIndex !== null && departures[expandedTripIndex]) {
      return departures[expandedTripIndex].stopTime?.stop?.id;
    }
    // Otherwise fallback to selected stop (likely parent station ID)
    return selectedStop?.id;
  }, [expandedTripIndex, departures, selectedStop]);

  const overviewConnections = useMemo<{ legs: Leg[] }[]>(() => {
    if (!selectedStop || !departures.length) return [];
    return departures
      .map((dep) => {
        const stopTimes = dep.trip.stopTimes || [];

        // Use the specific stop ID from the departure information if available.
        // This handles cases where selectedStop is a Parent station but the trip references a specific Platform/Quay ID.
        const currentStopId = dep.stopTime?.stop?.id || selectedStop.id;

        const currentIndex = stopTimes.findIndex(
          (st) => st.stop.id === currentStopId
        );
        if (currentIndex !== -1 && currentIndex < stopTimes.length - 1) {
          const current = stopTimes[currentIndex];
          const next = stopTimes[currentIndex + 1];
          const leg: Leg = {
            type: 'ROUTE',
            from: current.stop.coordinates,
            to: next.stop.coordinates,
            fromStop: current.stop,
            toStop: next.stop,
            departureTime: current.departureTime,
            arrivalTime: next.arrivalTime,
            trip: dep.trip,
          };
          return { legs: [leg] };
        }
        return null;
      })
      .filter((item): item is { legs: Leg[] } => item !== null);
  }, [departures, selectedStop]);

  // Extract immediate destination stops from departures for markers
  const nextStops = useMemo(() => {
    if (!selectedStop || !departures.length) return [];
    const stopsMap = new Map<string, Stop>();
    departures.forEach((dep) => {
      const stopTimes = dep.trip.stopTimes || [];

      const currentStopId = dep.stopTime?.stop?.id || selectedStop.id;

      const idx = stopTimes.findIndex((st) => st.stop.id === currentStopId);
      if (idx !== -1 && idx < stopTimes.length - 1) {
        const nextStop = stopTimes[idx + 1].stop;
        stopsMap.set(nextStop.id, nextStop);
      }
    });
    return Array.from(stopsMap.values());
  }, [departures, selectedStop]);

  // Calculate and Update Bounds
  useEffect(() => {
    // Only auto-zoom to overview bounds if no specific trip is expanded
    if (selectedStop && nextStops.length > 0 && expandedTripIndex === null) {
      const latLngs: [number, number][] = nextStops.map((s) => [
        s.coordinates.latitude,
        s.coordinates.longitude,
      ]);
      latLngs.push([
        selectedStop.coordinates.latitude,
        selectedStop.coordinates.longitude,
      ]);
      setCustomBounds(L.latLngBounds(latLngs));
    } else if (expandedTripIndex !== null) {
      // If a trip is expanded, clear customBounds so MapComponent's internal auto-fit takes over for the specific connection
      setCustomBounds(null);
    }
  }, [selectedStop, nextStops, expandedTripIndex]);

  const mapStops = useMemo(() => {
    const base = selectedStop ? [selectedStop] : [];
    // Combine nearby stops and next stops, deduplicating by ID
    const combined = [...base, ...nearbyStops, ...nextStops];
    return Array.from(new Map(combined.map((s) => [s.id, s])).values());
  }, [selectedStop, nearbyStops, nextStops]);

  return (
    <div className="page-wrapper flex flex-col h-full overflow-hidden">
      <PageHeader title="Explore" icon={CalendarDays} />
      <div className="flex-1 overflow-y-auto">
        <div className="panel-section">
          <div className="panel-header space-y-3 p-4">
            <StopSearch
              placeholder="Search stops..."
              selectedStop={selectedStop}
              onSelect={handleStopSelect}
              className="mb-0"
            />
            <div className="mt-3 flex items-start gap-1 sm:gap-2">
              <div className="flex-1 min-w-0 w-full">
                <DateTimeSelector
                  date={date}
                  setDate={(d: string) => updateState({ date: d })}
                  timeType={timeType}
                  setTimeType={setTimeType}
                />
              </div>
              <button
                onClick={() => setShowConfig(true)}
                className="mt-[20px] h-9 w-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center justify-center flex-shrink-0 shadow-sm"
                title="Explore Options"
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>
          </div>
          <div className="panel-content space-y-4 p-4">
            {!selectedStop ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <p className="text-sm font-medium">
                  Search or tap map to see departures
                </p>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right duration-300">
                {loading ? (
                  <Loader text="Loading Departures..." />
                ) : (
                  <div className="space-y-2">
                    {departures.map((dep, i) => {
                      const isExpanded = expandedTripIndex === i;
                      const mode = dep.trip.route.transportMode;
                      return (
                        <div
                          key={i}
                          className={`result-item rounded-xl border transition-all overflow-hidden ${isExpanded ? 'bg-slate-100 dark:bg-slate-900 border-brand-200 dark:border-brand-800 shadow-md' : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:border-slate-100 dark:hover:border-slate-800'}`}
                        >
                          <button
                            onClick={() => toggleTrip(i)}
                            className="w-full text-left flex items-center justify-between p-3 group"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div
                                className={`flex items-center gap-1.5 font-bold min-w-[3.5rem] px-2 text-center rounded-lg py-1.5 text-sm transition-colors ${isExpanded ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                              >
                                <TransportIcon mode={mode} size={14} />
                                {dep.trip.route.shortName}
                              </div>
                              <div className="flex flex-col truncate">
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {dep.trip.headSign}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">
                                  <span>{mode}</span>
                                  {isExpanded ? (
                                    <ChevronUp size={10} />
                                  ) : (
                                    <ChevronDown size={10} />
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end flex-shrink-0 ml-2">
                              <span className="block font-bold text-brand-600 dark:text-brand-400 font-mono text-base">
                                {formatDisplayTime(
                                  dep.stopTime.departureTime,
                                  timezone,
                                  useStationTime
                                )}
                              </span>
                              {dep.stopTime.arrivalTime !==
                                dep.stopTime.departureTime && (
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  Arr:{' '}
                                  {formatDisplayTime(
                                    dep.stopTime.arrivalTime,
                                    timezone,
                                    useStationTime
                                  )}
                                </span>
                              )}
                            </div>
                          </button>
                          {isExpanded && (
                            <TripTimeline
                              trip={dep.trip}
                              currentStopId={dep.stopTime?.stop?.id}
                              currentTime={date}
                              embedded={true}
                            />
                          )}
                        </div>
                      );
                    })}
                    {departures.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-8">
                        No upcoming departures found.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="map-section">
        <MapComponent
          variant="default"
          center={mapCenter}
          zoom={DEFAULT_ZOOM}
          stops={mapStops}
          onStopClick={handleStopSelect}
          onMapClick={handleMapClick}
          selectedConnection={expandedConnection}
          visConnections={!expandedConnection ? overviewConnections : undefined}
          currentStopId={activeMapStopId}
          customBounds={customBounds}
        />
      </div>
      {showConfig && (
        <ExploreConfigDialog
          config={config}
          onChange={(newCfg) => updateState({ config: newCfg })}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  );
};

export default ExplorePage;
