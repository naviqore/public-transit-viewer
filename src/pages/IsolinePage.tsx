import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CircleDot,
  SlidersHorizontal,
} from 'lucide-react';
import L from 'leaflet';
import MapComponent from '../components/Map';
import { naviqoreService } from '../services/naviqoreService';
import { useSettings } from '../contexts/SettingsContext';
import { useDomain } from '../contexts/DomainContext';
import { Connection, Leg, Stop, StopConnection, TimeType } from '../types';
import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from '../constants';
import QueryConfigDialog from '../components/QueryConfigDialog';
import StopSearch from '../components/common/StopSearch';
import DateTimeSelector from '../components/common/DateTimeSelector';
import Loader from '../components/common/Loader';
import IsolineCard from '../components/common/IsolineCard';
import PageHeader from '../components/common/PageHeader';
import { getLegStopTimes } from '../utils/dataUtils';
import {
  formatDisplayTime,
  getCurrentInputTime,
  inputDateToIso,
} from '../utils/dateUtils';
import './PageStyles.css';

const PAGE_SIZE = 50;
const MAX_VISIBLE_ITEMS = 150;

const IsolinePage: React.FC = () => {
  const { timezone, queryConfig, setQueryConfig, useStationTime } =
    useSettings();
  const { isolineState, setIsolineState } = useDomain();

  const { centerStop, isolines, maxDuration, date } = isolineState;

  const [loading, setLoading] = useState(false);
  const [timeType, setTimeType] = useState<TimeType>(TimeType.DEPARTURE);
  const [highlightedStopId, setHighlightedStopId] = useState<string | null>(
    null
  );
  const [expandedStopId, setExpandedStopId] = useState<string | null>(null);
  const [expandedConnection, setExpandedConnection] =
    useState<Connection | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [customBounds, setCustomBounds] = useState<L.LatLngBounds | null>(null);

  // Pagination State (Sliding Window)
  const [displayRange, setDisplayRange] = useState({
    start: 0,
    end: PAGE_SIZE,
  });

  const [mapCenter, setMapCenter] = useState<[number, number]>(
    centerStop
      ? [centerStop.coordinates.latitude, centerStop.coordinates.longitude]
      : DEFAULT_MAP_CENTER
  );
  const [zoom] = useState(DEFAULT_ZOOM);

  // Initialize date if empty
  useEffect(() => {
    if (!isolineState.date) {
      setIsolineState((prev) => ({
        ...prev,
        date: getCurrentInputTime(timezone),
      }));
    }
  }, [timezone]);

  const updateState = (updates: Partial<typeof isolineState>) => {
    setIsolineState((prev) => ({ ...prev, ...updates }));
  };

  // Lookup Map for Connection Reconstruction
  const isolineMap = useMemo(() => {
    const map = new Map<string, StopConnection>();
    isolines.forEach((iso) => map.set(iso.stop.id, iso));
    return map;
  }, [isolines]);

  useEffect(() => {
    if (centerStop) {
      setLoading(true);
      setMapCenter([
        centerStop.coordinates.latitude,
        centerStop.coordinates.longitude,
      ]);
      setCustomBounds(null); // Reset bounds on new search
      setExpandedConnection(null);
      setExpandedStopId(null);
      updateState({ isolines: [] });
      setDisplayRange({ start: 0, end: PAGE_SIZE }); // Reset pagination

      const timeoutId = setTimeout(async () => {
        try {
          const isoDate = inputDateToIso(date, timezone);

          const res = await naviqoreService.getIsolines(
            centerStop.id,
            isoDate,
            timeType,
            maxDuration,
            queryConfig
          );

          const processedIsolines = res.data.map((iso) => {
            const travelDurationSeconds =
              (new Date(iso.arrivalTime).getTime() -
                new Date(iso.departureTime).getTime()) /
              1000;

            return {
              ...iso,
              connection: {
                ...(iso.connection || {}),
                duration: travelDurationSeconds,
                legs: iso.connection?.legs || [],
                transfers: iso.transfers,
              },
              connectingLeg: {
                ...iso.connectingLeg,
                duration: travelDurationSeconds,
              },
            };
          });

          // SORTING CHANGE: Descending order (Furthest stops first)
          const sorted = processedIsolines.sort(
            (a, b) =>
              (b.connection?.duration || 0) - (a.connection?.duration || 0)
          );
          updateState({ isolines: sorted });

          if (sorted.length > 0) {
            const latLngs = sorted.map(
              (i) =>
                [i.stop.coordinates.latitude, i.stop.coordinates.longitude] as [
                  number,
                  number,
                ]
            );
            latLngs.push([
              centerStop.coordinates.latitude,
              centerStop.coordinates.longitude,
            ]);
            setCustomBounds(L.latLngBounds(latLngs));
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      if (isolines.length > 0) updateState({ isolines: [] });
    }
  }, [centerStop, maxDuration, date, timeType, queryConfig, timezone]);

  // Handle map click: Synchronize list view
  const handleMapStopClick = useCallback(
    (stop: Stop) => {
      setHighlightedStopId(stop.id);

      // Find the index of the clicked stop
      const index = isolines.findIndex((iso) => iso.stop.id === stop.id);

      if (index !== -1) {
        // Check if it's visible in current range
        if (index < displayRange.start || index >= displayRange.end) {
          // It's not visible, jump the window to center this item
          const newStart = Math.max(0, index - Math.floor(PAGE_SIZE / 2));
          const newEnd = Math.min(isolines.length, newStart + PAGE_SIZE);
          setDisplayRange({ start: newStart, end: newEnd });

          // Allow render cycle to complete before scrolling
          setTimeout(() => {
            const el = document.getElementById(`iso-stop-${stop.id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        } else {
          // It is visible, just scroll
          const el = document.getElementById(`iso-stop-${stop.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    },
    [isolines, displayRange]
  );

  const reconstructConnection = (startIso: StopConnection): Connection => {
    const legs: Leg[] = [];
    let currentIso: StopConnection | undefined = startIso;
    const visited = new Set<string>();

    while (currentIso && !visited.has(currentIso.stop.id) && legs.length < 50) {
      visited.add(currentIso.stop.id);
      const leg = currentIso.connectingLeg;

      if (timeType === TimeType.ARRIVAL) {
        legs.push(leg);
        const nextStopId = leg.toStop?.id;
        if (!nextStopId || nextStopId === centerStop?.id) break;
        currentIso = isolineMap.get(nextStopId);
      } else {
        legs.unshift(leg);
        const prevStopId = leg.fromStop?.id;
        if (!prevStopId || prevStopId === centerStop?.id) break;
        currentIso = isolineMap.get(prevStopId);
      }
    }

    const firstLeg = legs[0];
    const lastLeg = legs[legs.length - 1];
    const startTime =
      firstLeg?.departureTime || startIso.connectingLeg.departureTime;
    const endTime = lastLeg?.arrivalTime || startIso.connectingLeg.arrivalTime;

    return {
      legs,
      departureTime: startTime,
      arrivalTime: endTime,
      duration:
        (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000,
      transfers: Math.max(0, legs.filter((l) => l.type === 'ROUTE').length - 1),
    };
  };

  const handleListItemToggle = (stop: Stop) => {
    const isCurrentlyExpanded = expandedStopId === stop.id;
    const nextExpandedId = isCurrentlyExpanded ? null : stop.id;
    setExpandedStopId(nextExpandedId);
    setHighlightedStopId(stop.id);

    if (nextExpandedId) {
      const iso = isolines.find((i) => i.stop.id === stop.id);
      if (iso) {
        const fullConnection = reconstructConnection(iso);
        setExpandedConnection(fullConnection);

        const bounds = L.latLngBounds([]);
        fullConnection.legs.forEach((leg) => {
          bounds.extend([leg.from.latitude, leg.from.longitude]);
          bounds.extend([leg.to.latitude, leg.to.longitude]);
          if (leg.trip) {
            const relevantStops = getLegStopTimes(leg);
            relevantStops.forEach((st) => {
              bounds.extend([
                st.stop.coordinates.latitude,
                st.stop.coordinates.longitude,
              ]);
            });
          }
        });
        setCustomBounds(bounds);
      }
    } else {
      setExpandedConnection(null);
      if (isolines.length > 0 && centerStop) {
        const latLngs = isolines.map(
          (i) =>
            [i.stop.coordinates.latitude, i.stop.coordinates.longitude] as [
              number,
              number,
            ]
        );
        latLngs.push([
          centerStop.coordinates.latitude,
          centerStop.coordinates.longitude,
        ]);
        setCustomBounds(L.latLngBounds(latLngs));
      } else {
        setCustomBounds(null);
      }
    }
  };

  const formatTime = (isoString: string) => {
    return formatDisplayTime(isoString, timezone, useStationTime);
  };

  // --- Pagination Logic ---

  const handleShowMore = () => {
    // Extend the end
    const newEnd = Math.min(isolines.length, displayRange.end + PAGE_SIZE);

    // If the window is too large, move the start down to maintain MAX_VISIBLE_ITEMS
    let newStart = displayRange.start;
    if (newEnd - newStart > MAX_VISIBLE_ITEMS) {
      newStart = newEnd - MAX_VISIBLE_ITEMS;
    }

    setDisplayRange({ start: newStart, end: newEnd });
  };

  const handleShowPrevious = () => {
    // Extend the start upwards
    const newStart = Math.max(0, displayRange.start - PAGE_SIZE);

    // We generally don't shrink the end when going up unless we want strict windowing,
    // but to prevent DOM explosion if user keeps clicking up then down, let's enforce limit.
    let newEnd = displayRange.end;
    if (newEnd - newStart > MAX_VISIBLE_ITEMS) {
      newEnd = newStart + MAX_VISIBLE_ITEMS;
    }

    setDisplayRange({ start: newStart, end: newEnd });
  };

  const visibleIsolines = useMemo(() => {
    return isolines.slice(displayRange.start, displayRange.end);
  }, [isolines, displayRange]);

  const visConnections = useMemo(
    () => isolines.map((iso) => ({ legs: [iso.connectingLeg] })),
    [isolines]
  );
  const destinationStops = useMemo(
    () => isolines.map((i) => i.stop),
    [isolines]
  );
  const mapStops = useMemo(
    () => (centerStop ? [centerStop] : []),
    [centerStop]
  );

  return (
    <div className="page-wrapper flex flex-col h-full overflow-hidden">
      <PageHeader title="Isolines" icon={CircleDot} />
      <div className="flex-1 overflow-y-auto">
        <div className="panel-section">
          <div className="panel-header p-4">
            <StopSearch
              selectedStop={centerStop}
              onSelect={(s) => updateState({ centerStop: s })}
              placeholder="Search stops..."
              className="mb-0"
            />
            <div className="mt-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block h-[16px] leading-[16px]">
                  Max Travel Duration
                </label>
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                  {maxDuration} min
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={maxDuration}
                onChange={(e) =>
                  updateState({ maxDuration: parseInt(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-brand-600 focus:outline-none focus:ring-0 block mt-1"
              />
            </div>
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
                title="Isoline Options"
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>
          </div>
          <div className="panel-content p-4">
            {loading ? (
              <Loader text="Calculating Reach..." />
            ) : (
              <>
                {isolines.length === 0 && !centerStop && (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                    <p className="text-sm font-medium">
                      Select stop to calculate reach
                    </p>
                  </div>
                )}
                {isolines.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {isolines.length} reachable stops
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Sorted by furthest distance
                      </span>
                    </div>

                    {/* Show Previous Button */}
                    {displayRange.start > 0 && (
                      <button
                        onClick={handleShowPrevious}
                        className="w-full py-2 mb-2 flex items-center justify-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded-lg transition-colors"
                      >
                        <ChevronUp size={14} /> Show{' '}
                        {Math.min(displayRange.start, PAGE_SIZE)} previous...
                      </button>
                    )}

                    <div className="space-y-2">
                      {visibleIsolines.map((iso) => (
                        <IsolineCard
                          key={iso.stop.id}
                          id={`iso-stop-${iso.stop.id}`}
                          item={iso}
                          isHighlighted={highlightedStopId === iso.stop.id}
                          isExpanded={expandedStopId === iso.stop.id}
                          detailedConnection={
                            expandedStopId === iso.stop.id
                              ? expandedConnection
                              : null
                          }
                          onToggle={() => handleListItemToggle(iso.stop)}
                          formatTime={formatTime}
                        />
                      ))}
                    </div>

                    {/* Show More Button */}
                    {displayRange.end < isolines.length && (
                      <button
                        onClick={handleShowMore}
                        className="w-full py-2 mt-2 flex items-center justify-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded-lg transition-colors"
                      >
                        <ChevronDown size={14} /> And{' '}
                        {isolines.length - displayRange.end} more...
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="map-section">
        <MapComponent
          variant="isoline"
          center={mapCenter}
          zoom={zoom}
          visConnections={visConnections}
          isolines={destinationStops}
          stops={mapStops}
          currentStopId={centerStop?.id}
          onStopClick={handleMapStopClick}
          customBounds={customBounds}
          highlightedStopId={highlightedStopId}
          sourceStop={centerStop || undefined}
          selectedConnection={expandedConnection}
        />
      </div>
      {showConfig && (
        <QueryConfigDialog
          config={queryConfig}
          onChange={(c) => setQueryConfig(c)}
          onClose={() => setShowConfig(false)}
          showMaxTravelDuration={false}
        />
      )}
    </div>
  );
};

export default IsolinePage;
