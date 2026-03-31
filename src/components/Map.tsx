import L from 'leaflet';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_MAP_CENTER,
  MAP_TILE_ATTRIBUTION,
  MAP_TILE_URL_DARK,
  MAP_TILE_URL_LIGHT,
} from '../constants';
import { useDomain } from '../contexts/DomainContext';
import { useSettings } from '../contexts/SettingsContext';
import { Connection, Leg, Stop } from '../types';
import TransportIcon from './common/TransportIcon';
import { useMapLayers } from '../hooks/useMapLayers';
import { getLegStopTimes } from '../utils/dataUtils';
import {
  IsolineColorMode,
  TRANSFER_COLORS,
  getTransferColor,
} from '../utils/isolineColorUtils';

/** Props accepted by the shared Leaflet map component, covering all page variants. */
interface MapProps {
  center: [number, number];
  zoom: number;
  variant?: 'default' | 'isoline';
  stops?: Stop[];
  connections?: Connection[];
  selectedConnection?: Connection | null;
  currentStopId?: string;
  isolines?: Stop[];
  visConnections?: { legs: Leg[] }[];
  customBounds?: L.LatLngBounds | null;

  // New props for highlighting
  sourceStop?: Stop;
  targetStop?: Stop;
  highlightedStopId?: string | null;

  // Isoline color mode
  isolineColorMode?: IsolineColorMode;
  onIsolineColorModeChange?: (mode: IsolineColorMode) => void;
  isolineTransfersMap?: Map<string, number>;

  onStopClick?: (stop: Stop) => void;
  onMapClick?: (lat: number, lon: number) => void;
  onConnectionClick?: (connection: Connection) => void;
}

function isValidCoordinate(
  lat: number | undefined | null,
  lng: number | undefined | null
): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
}

const MapComponent: React.FC<MapProps> = (props) => {
  const { darkMode, timezone, useStationTime } = useSettings();
  const { isolineState } = useDomain();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const onMapClickRef = useRef<MapProps['onMapClick']>(props.onMapClick);
  const initialViewRef = useRef<{
    center: [number, number];
    zoom: number;
  }>({
    center: isValidCoordinate(props.center[0], props.center[1])
      ? props.center
      : DEFAULT_MAP_CENTER,
    zoom: props.zoom,
  });
  const [mapSize, setMapSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    onMapClickRef.current = props.onMapClick;
  }, [props.onMapClick]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const { center: initialCenter, zoom: initialZoom } = initialViewRef.current;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(initialCenter, initialZoom);
    tileLayerRef.current = L.tileLayer(MAP_TILE_URL_LIGHT, {
      attribution: MAP_TILE_ATTRIBUTION,
      maxZoom: 20,
    }).addTo(map);
    L.control.attribution({ position: 'bottomright' }).addTo(map);
    map.on('click', (e) => onMapClickRef.current?.(e.latlng.lat, e.latlng.lng));

    mapInstanceRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const activeContainer = mapContainerRef.current;
      const map = mapInstanceRef.current;
      if (!activeContainer || !map) return;

      const mapContainer = map.getContainer();
      if (!mapContainer.isConnected) return;

      // Leaflet may briefly have incomplete pane state during layout teardown.
      try {
        map.invalidateSize({
          pan: false,
          debounceMoveend: true,
        });
      } catch {
        return;
      }

      const w = activeContainer.offsetWidth;
      const h = activeContainer.offsetHeight;
      setMapSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!tileLayerRef.current) return;
    tileLayerRef.current.setUrl(
      darkMode ? MAP_TILE_URL_DARK : MAP_TILE_URL_LIGHT
    );
  }, [darkMode]);

  useEffect(() => {
    if (!mapInstanceRef.current || mapSize.w === 0) return;
    if (props.customBounds && props.customBounds.isValid()) {
      mapInstanceRef.current.flyToBounds(props.customBounds, {
        padding: [50, 50],
        duration: 1.5,
        easeLinearity: 0.25,
        maxZoom: 15, // Limit zoom level to avoid being too close on short segments
      });
    } else if (isValidCoordinate(props.center[0], props.center[1])) {
      // Use flyTo instead of setView for smooth updates to avoid "reload" jump effect
      mapInstanceRef.current.flyTo(props.center, props.zoom, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [props.center, props.zoom, props.customBounds, mapSize]);

  useMapLayers({
    map: mapInstanceRef.current,
    layerGroup: layerGroupRef.current,
    stops: props.stops,
    connections: props.connections,
    selectedConnection: props.selectedConnection,
    currentStopId: props.currentStopId,
    isolines: props.isolines,
    visConnections: props.visConnections,
    variant: props.variant,
    darkMode,
    timezone,
    useStationTime,
    isolineMaxDuration: isolineState.maxDuration,
    isolineColorMode: props.isolineColorMode,
    isolineTransfersMap: props.isolineTransfersMap,

    // Highlighting Props
    sourceStop: props.sourceStop,
    targetStop: props.targetStop,
    highlightedStopId: props.highlightedStopId,

    onStopClick: props.onStopClick,
    onConnectionClick: props.onConnectionClick,
  });

  useEffect(() => {
    if (
      mapSize.w > 0 &&
      props.selectedConnection?.legs.length &&
      !props.customBounds &&
      mapInstanceRef.current
    ) {
      const bounds = L.latLngBounds([]);
      props.selectedConnection.legs.forEach((leg) => {
        if (isValidCoordinate(leg.from.latitude, leg.from.longitude))
          bounds.extend([leg.from.latitude, leg.from.longitude]);
        if (isValidCoordinate(leg.to.latitude, leg.to.longitude))
          bounds.extend([leg.to.latitude, leg.to.longitude]);

        // Only consider stops relevant to the specific leg segment
        if (leg.trip) {
          const relevantStops = getLegStopTimes(leg);
          relevantStops.forEach((st) => {
            if (
              isValidCoordinate(
                st.stop.coordinates.latitude,
                st.stop.coordinates.longitude
              )
            ) {
              bounds.extend([
                st.stop.coordinates.latitude,
                st.stop.coordinates.longitude,
              ]);
            }
          });
        }
      });
      if (bounds.isValid())
        mapInstanceRef.current.flyToBounds(bounds, {
          padding: [80, 80],
          duration: 1,
          maxZoom: 15,
        });
    }
  }, [props.selectedConnection, props.customBounds, mapSize]);

  const visibleModes = useMemo(() => {
    const modes = new Set<string>();
    const processLegs = (legs: Leg[]) => {
      legs.forEach((leg) => {
        if (leg.type === 'WALK') modes.add('WALK');
        else if (leg.trip?.route?.transportMode)
          modes.add(leg.trip.route.transportMode);
      });
    };
    if (props.selectedConnection) processLegs(props.selectedConnection.legs);
    else if (props.connections && Array.isArray(props.connections))
      props.connections.forEach((c) => processLegs(c.legs));
    else if (
      props.visConnections &&
      Array.isArray(props.visConnections) &&
      props.variant !== 'isoline'
    )
      props.visConnections.forEach((c) => processLegs(c.legs));
    return Array.from(modes).sort();
  }, [
    props.selectedConnection,
    props.connections,
    props.visConnections,
    props.variant,
  ]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapContainerRef}
        className="h-full w-full z-0 font-sans bg-slate-200 dark:bg-slate-900 transition-colors"
      />

      {props.variant === 'isoline' &&
        props.visConnections &&
        props.visConnections.length > 0 && (
          <div className="absolute top-6 right-6 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xl max-w-[200px] animate-in fade-in slide-in-from-top-4">
            {/* Mode toggle */}
            <div className="flex gap-1 mb-3">
              {(['travelTime', 'transfers'] as IsolineColorMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => props.onIsolineColorModeChange?.(m)}
                  className={`flex-1 py-1 px-1.5 text-[10px] font-bold rounded transition-colors ${
                    (props.isolineColorMode ?? 'travelTime') === m
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {m === 'travelTime' ? 'Travel time' : 'Transfers'}
                </button>
              ))}
            </div>
            {/* Legend */}
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {(props.isolineColorMode ?? 'travelTime') === 'travelTime'
                ? 'Travel Time'
                : 'Transfers'}
            </div>
            {(props.isolineColorMode ?? 'travelTime') === 'travelTime' ? (
              <div className="flex flex-col gap-1">
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-amber-500" />
                <div className="flex justify-between text-[10px] font-mono font-medium text-slate-600 dark:text-slate-300">
                  <span>0m</span>
                  <span>{isolineState.maxDuration / 2}m</span>
                  <span>{isolineState.maxDuration}m</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {[
                  { label: 'Direct', color: TRANSFER_COLORS[0] },
                  { label: '1 transfer', color: TRANSFER_COLORS[1] },
                  { label: '2 transfers', color: TRANSFER_COLORS[2] },
                  { label: '3+ transfers', color: getTransferColor(3) },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      {props.variant !== 'isoline' && visibleModes.length > 0 && (
        <div className="absolute top-6 right-6 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-4 min-w-[120px]">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Modes
          </div>
          <div className="flex flex-col gap-2">
            {visibleModes.map((mode) => (
              <div key={mode} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                  <TransportIcon mode={mode} size={12} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 capitalize">
                  {mode.toLowerCase().replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
