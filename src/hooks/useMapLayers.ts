import L from 'leaflet';
import { useEffect, useRef } from 'react';

import { COLORS, getGradientColor, TRANSPORT_COLORS } from '../constants';
import { Connection, Leg, Stop } from '../types';
import { getLegStopTimes } from '../utils/dataUtils';
import { bindRichStopPopup, bindRichLinePopup } from './mapLayers/popups';
import {
  isValidCoordinate,
  createStopIcon,
  StopMarkerType,
} from './mapLayers/stopIcons';
import { IsolineColorMode, getTransferColor } from '../utils/isolineColorUtils';
import {
  filterStopsByBounds,
  filterIsolinePathsByBounds,
  GeoBounds,
} from './mapLayers/viewportCulling';

/** Props for the {@link useMapLayers} hook, describing the full map state to render. */
interface UseMapLayersProps {
  map: L.Map | null;
  layerGroup: L.LayerGroup | null;
  stops?: Stop[];
  connections?: Connection[];
  selectedConnection?: Connection | null;
  selectedLegIndex?: number | null;
  currentStopId?: string;
  isolines?: Stop[];
  visConnections?: { legs: Leg[] }[];
  variant?: 'default' | 'isoline';
  darkMode: boolean;
  timezone: string;
  useStationTime: boolean;
  isolineMaxDuration: number;
  isolineColorMode?: IsolineColorMode;
  isolineTransfersMap?: Map<string, number>;

  // Highlighting
  sourceStop?: Stop;
  targetStop?: Stop;
  highlightedStopId?: string | null;

  onStopClick?: (stop: Stop) => void;
  onConnectionClick?: (connection: Connection) => void;
  onLegClick?: (leg: Leg, legIndex: number) => void;
}

/**
 * Clears and redraws all Leaflet layers whenever the relevant props change.
 * Handles stop markers, connection polylines, isoline colour-coding, and popup bindings.
 *
 * Isoline layers use a dedicated Canvas renderer and viewport culling for performance.
 * A debounced `moveend` listener updates visible isoline elements on pan/zoom.
 */
export const useMapLayers = ({
  map,
  layerGroup,
  stops,
  connections,
  selectedConnection,
  selectedLegIndex,
  currentStopId,
  isolines,
  visConnections,
  variant,
  darkMode,
  timezone,
  useStationTime,
  isolineMaxDuration,
  isolineColorMode,
  isolineTransfersMap,
  sourceStop,
  targetStop,
  highlightedStopId,
  onStopClick,
  onConnectionClick,
  onLegClick,
}: UseMapLayersProps) => {
  const canvasRef = useRef<L.Canvas | null>(null);
  const isolineGroupRef = useRef<L.LayerGroup | null>(null);
  const renderIsolinesRef = useRef<(() => void) | null>(null);

  // --- Isoline layer group lifecycle ---
  useEffect(() => {
    if (!map) return;
    canvasRef.current ??= L.canvas();
    const group = L.layerGroup().addTo(map);
    isolineGroupRef.current = group;
    return () => {
      group.remove();
      isolineGroupRef.current = null;
    };
  }, [map]);

  // --- Main effect: non-isoline layers ---
  useEffect(() => {
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Draw Lines
    if (selectedConnection) {
      drawConnection(
        layerGroup,
        selectedConnection,
        true,
        darkMode,
        currentStopId,
        selectedLegIndex ?? undefined,
        undefined,
        onLegClick
      );
      drawTripStops(
        layerGroup,
        selectedConnection,
        currentStopId,
        darkMode,
        timezone,
        useStationTime,
        sourceStop,
        targetStop,
        selectedLegIndex ?? undefined,
        onStopClick
      );
    } else if (connections && Array.isArray(connections)) {
      connections.forEach((c) =>
        drawConnection(
          layerGroup,
          c,
          false,
          darkMode,
          undefined,
          undefined,
          onConnectionClick
        )
      );
    }

    if (visConnections && Array.isArray(visConnections)) {
      if (variant !== 'isoline' && !selectedConnection) {
        // Overview mode for Explore page
        visConnections.forEach((c) =>
          drawConnection(
            layerGroup,
            { legs: c.legs } as Connection,
            false,
            darkMode
          )
        );
      }
    }

    // 2. Draw Context Stops
    if (stops && Array.isArray(stops)) {
      drawContextStops(
        layerGroup,
        stops,
        selectedConnection || null,
        currentStopId,
        darkMode,
        timezone,
        useStationTime,
        onStopClick
      );
    }

    drawSourceTargetStops(
      layerGroup,
      sourceStop,
      targetStop,
      darkMode,
      timezone,
      useStationTime
    );
  }, [
    map,
    layerGroup,
    stops,
    connections,
    selectedConnection,
    selectedLegIndex,
    currentStopId,
    visConnections,
    variant,
    darkMode,
    timezone,
    useStationTime,
    sourceStop,
    targetStop,
    onStopClick,
    onConnectionClick,
    onLegClick,
  ]);

  // --- Isoline rendering with Canvas + viewport culling ---
  useEffect(() => {
    const group = isolineGroupRef.current;
    if (!map || !group) return;

    const mode = isolineColorMode ?? 'travelTime';

    const resolveTransfers = (
      toId: string | undefined,
      fromId: string | undefined
    ): number => {
      if (toId && isolineTransfersMap?.has(toId))
        return isolineTransfersMap.get(toId)!;
      if (fromId && isolineTransfersMap?.has(fromId))
        return isolineTransfersMap.get(fromId)!;
      return 0;
    };

    const colorResolver = (
      toId: string | undefined,
      fromId: string | undefined,
      durationMin: number
    ): string =>
      mode === 'transfers'
        ? getTransferColor(resolveTransfers(toId, fromId))
        : getGradientColor(durationMin, isolineMaxDuration);

    const labelResolver = (
      toId: string | undefined,
      fromId: string | undefined,
      durationMin: number
    ): string => {
      if (mode === 'transfers') {
        const xfers = resolveTransfers(toId, fromId);
        return `${xfers} transfer${xfers === 1 ? '' : 's'}`;
      }
      return `${Math.round(durationMin)} min`;
    };

    const doRender = () => {
      group.clearLayers();
      if (variant !== 'isoline') return;

      const canvas = canvasRef.current ?? undefined;
      const isDimmed = !!selectedConnection;
      const paddedBounds = map.getBounds().pad(0.2);
      const geo: GeoBounds = {
        south: paddedBounds.getSouth(),
        west: paddedBounds.getWest(),
        north: paddedBounds.getNorth(),
        east: paddedBounds.getEast(),
      };

      if (visConnections && Array.isArray(visConnections)) {
        const visible = filterIsolinePathsByBounds(visConnections, geo);
        drawIsolinePaths(group, visible, isDimmed, colorResolver, canvas);
      }

      if (
        isolines &&
        Array.isArray(isolines) &&
        visConnections &&
        Array.isArray(visConnections)
      ) {
        const visible = filterStopsByBounds(isolines, geo);
        drawIsolineStops(
          group,
          visible,
          visConnections,
          darkMode,
          timezone,
          useStationTime,
          highlightedStopId,
          isDimmed,
          colorResolver,
          labelResolver,
          onStopClick,
          canvas
        );
      }
    };

    doRender();
    renderIsolinesRef.current = doRender;
  }, [
    map,
    variant,
    selectedConnection,
    visConnections,
    isolines,
    darkMode,
    timezone,
    useStationTime,
    highlightedStopId,
    isolineMaxDuration,
    isolineColorMode,
    isolineTransfersMap,
    onStopClick,
  ]);

  // --- Debounced moveend listener for isoline viewport updates ---
  useEffect(() => {
    if (!map || variant !== 'isoline') return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const handler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => renderIsolinesRef.current?.(), 150);
    };

    map.on('moveend', handler);
    return () => {
      map.off('moveend', handler);
      clearTimeout(timeoutId);
    };
  }, [map, variant]);
};

// --- DRAWING IMPLEMENTATIONS (Private to Hook) ---

const drawSourceTargetStops = (
  layers: L.LayerGroup,
  source: Stop | undefined,
  target: Stop | undefined,
  isDark: boolean,
  timezone: string,
  useStationTime: boolean
) => {
  if (
    source &&
    isValidCoordinate(source.coordinates.latitude, source.coordinates.longitude)
  ) {
    const marker = L.marker(
      [source.coordinates.latitude, source.coordinates.longitude],
      {
        icon: createStopIcon('source', isDark),
        zIndexOffset: 2000,
      }
    );
    // Remove subtitle 'Start'
    bindRichStopPopup(marker, source, {
      isDark,
      timezone,
      useStationTime,
      permanent: true,
    });
    layers.addLayer(marker);
  }
  if (
    target &&
    isValidCoordinate(target.coordinates.latitude, target.coordinates.longitude)
  ) {
    const marker = L.marker(
      [target.coordinates.latitude, target.coordinates.longitude],
      {
        // Use 'target' type, which maps to the same visual style as 'source'
        icon: createStopIcon('target', isDark),
        zIndexOffset: 2000,
      }
    );
    // Remove subtitle 'End'
    bindRichStopPopup(marker, target, {
      isDark,
      timezone,
      useStationTime,
      permanent: true,
    });
    layers.addLayer(marker);
  }
};

const drawConnection = (
  layers: L.LayerGroup,
  conn: Connection,
  isSelected: boolean,
  isDark: boolean,
  currentStopId?: string,
  selectedLegIndex?: number,
  onClick?: (c: Connection) => void,
  onLegClick?: (leg: Leg, legIndex: number) => void
) => {
  if (!conn.legs) return;

  conn.legs.forEach((leg, legIndex) => {
    if (
      !isValidCoordinate(leg.from.latitude, leg.from.longitude) ||
      !isValidCoordinate(leg.to.latitude, leg.to.longitude)
    )
      return;

    const isWalk = leg.type === 'WALK';
    const mode = leg.trip?.route?.transportMode || 'WALK';
    const standardColor = isWalk
      ? isDark
        ? '#64748b'
        : '#94a3b8'
      : TRANSPORT_COLORS[mode] || COLORS.primary;

    const hasLegSelection =
      isSelected && selectedLegIndex != null && selectedLegIndex >= 0;
    const isActiveLeg = hasLegSelection && legIndex === selectedLegIndex;
    const isDimmedLeg = hasLegSelection && legIndex !== selectedLegIndex;

    const points: [number, number][] = [
      [leg.from.latitude, leg.from.longitude],
    ];

    if (!isWalk && leg.trip) {
      const relevantStops = getLegStopTimes(leg);
      for (let i = 1; i < relevantStops.length - 1; i++) {
        const st = relevantStops[i];
        if (
          isValidCoordinate(
            st.stop.coordinates.latitude,
            st.stop.coordinates.longitude
          )
        ) {
          points.push([
            st.stop.coordinates.latitude,
            st.stop.coordinates.longitude,
          ]);
        }
      }
    }
    points.push([leg.to.latitude, leg.to.longitude]);

    // Detail View with Past/Future split
    if (!isWalk && leg.trip && currentStopId && isSelected) {
      const relevantStops = getLegStopTimes(leg);
      const splitIndex = relevantStops.findIndex(
        (st) => st.stop.id === currentStopId
      );

      if (splitIndex !== -1) {
        for (let i = 0; i < relevantStops.length - 1; i++) {
          const startSt = relevantStops[i];
          const endSt = relevantStops[i + 1];
          if (
            !isValidCoordinate(
              startSt.stop.coordinates.latitude,
              startSt.stop.coordinates.longitude
            ) ||
            !isValidCoordinate(
              endSt.stop.coordinates.latitude,
              endSt.stop.coordinates.longitude
            )
          )
            continue;

          const isPast = i < splitIndex;
          const segmentColor = isPast ? COLORS.pastTrip : standardColor;
          const segCoords: [number, number][] = [
            [
              startSt.stop.coordinates.latitude,
              startSt.stop.coordinates.longitude,
            ],
            [endSt.stop.coordinates.latitude, endSt.stop.coordinates.longitude],
          ];

          const poly = L.polyline(segCoords, {
            color: segmentColor,
            weight: isPast ? 4 : 5,
            opacity: isPast ? 0.7 : 1,
            lineCap: 'round',
            lineJoin: 'round',
          });
          bindRichLinePopup(poly, leg, isDark, isPast);
          poly.addTo(layers);
        }
        return;
      }
    }

    // Compute opacity: active leg = full, dimmed = faded, default selected = full, unselected = faded
    const legOpacity = isDimmedLeg ? 0.25 : isSelected ? 1 : 0.4;
    const legWeight = isDimmedLeg ? 3 : isWalk ? 4 : isActiveLeg ? 6 : 5;

    const poly = L.polyline(points, {
      color: standardColor,
      weight: legWeight,
      opacity: legOpacity,
      dashArray: isWalk ? '1, 8' : undefined,
      lineCap: 'round',
      lineJoin: 'round',
    });

    const legClickHandler = isSelected ? onLegClick : undefined;
    if (onClick || legClickHandler) {
      const clickArea = L.polyline(points, {
        weight: 20,
        opacity: 0,
        interactive: true,
      });
      clickArea.on('add', () => {
        const el = clickArea.getElement() as HTMLElement | undefined;
        if (el) {
          el.style.pointerEvents = 'all';
          el.style.cursor = 'pointer';
        }
      });
      clickArea.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (legClickHandler) {
          legClickHandler(leg, legIndex);
        } else if (onClick) {
          onClick(conn);
        }
      });
      clickArea.addTo(layers);
    }
    if (!isWalk && isSelected) bindRichLinePopup(poly, leg, isDark, false);
    poly.addTo(layers);
  });
};

const drawTripStops = (
  layers: L.LayerGroup,
  conn: Connection,
  currentStopId: string | undefined,
  isDark: boolean,
  timezone: string,
  useStationTime: boolean,
  sourceStop: Stop | undefined,
  targetStop: Stop | undefined,
  selectedLegIndex?: number,
  onClick?: (s: Stop) => void
) => {
  const stopsMap = new Map<
    string,
    { stop: Stop; time: string; isPast: boolean }
  >();

  const hasLegSelection = selectedLegIndex != null && selectedLegIndex >= 0;

  conn.legs?.forEach((leg, legIndex) => {
    if (leg.type === 'WALK') return;

    const relevantStops = getLegStopTimes(leg);

    // When a leg is selected, only show intermediate stops for that leg
    // Always show first/last stops of every leg (they are transfer points)
    const showIntermediates = !hasLegSelection || legIndex === selectedLegIndex;

    if (relevantStops.length > 0) {
      const splitIndex = relevantStops.findIndex(
        (st) => st.stop.id === currentStopId
      );
      relevantStops.forEach((st, idx) => {
        if (sourceStop && st.stop.id === sourceStop.id) return;
        if (targetStop && st.stop.id === targetStop.id) return;

        // Skip intermediate stops for non-selected legs
        const isEndpoint = idx === 0 || idx === relevantStops.length - 1;
        if (!showIntermediates && !isEndpoint) return;

        const isPast = currentStopId
          ? splitIndex !== -1 && idx < splitIndex
          : false;
        stopsMap.set(st.stop.id, {
          stop: st.stop,
          time: st.departureTime,
          isPast,
        });
      });
    }
  });

  stopsMap.forEach(({ stop, time, isPast }) => {
    if (
      !isValidCoordinate(stop.coordinates.latitude, stop.coordinates.longitude)
    )
      return;

    const isCurrent = currentStopId === stop.id;

    let type: StopMarkerType = 'intermediate-future';
    if (isCurrent) type = 'highlighted';
    else if (isPast) type = 'intermediate-past';

    const marker = L.marker(
      [stop.coordinates.latitude, stop.coordinates.longitude],
      {
        icon: createStopIcon(type, isDark),
        zIndexOffset: isCurrent ? 1000 : 0,
      }
    );

    if (onClick) marker.on('click', () => onClick(stop));

    // Show permanent label if this is the currently selected stop in the route view
    bindRichStopPopup(marker, stop, {
      time,
      isCurrent,
      isPast,
      isDark,
      timezone,
      useStationTime,
      permanent: isCurrent,
    });
    layers.addLayer(marker);
  });
};

const drawContextStops = (
  layers: L.LayerGroup,
  stops: Stop[],
  selectedConnection: Connection | null,
  currentStopId: string | undefined,
  isDark: boolean,
  timezone: string,
  useStationTime: boolean,
  onClick?: (s: Stop) => void
) => {
  const tripStopIds = new Set<string>();
  selectedConnection?.legs.forEach((l) => {
    const relevantStops = getLegStopTimes(l);
    relevantStops.forEach((st) => tripStopIds.add(st.stop.id));
    if (l.fromStop) tripStopIds.add(l.fromStop.id);
    if (l.toStop) tripStopIds.add(l.toStop.id);
  });

  stops.forEach((stop) => {
    if (
      !isValidCoordinate(stop.coordinates.latitude, stop.coordinates.longitude)
    )
      return;
    if (tripStopIds.has(stop.id)) return;

    const isFocused = stop.id === currentStopId;
    const type: StopMarkerType = isFocused
      ? 'highlighted'
      : selectedConnection
        ? 'context-subtle'
        : 'context';

    const marker = L.marker(
      [stop.coordinates.latitude, stop.coordinates.longitude],
      {
        icon: createStopIcon(type, isDark),
        zIndexOffset: isFocused ? 2000 : 500,
      }
    );
    if (onClick) marker.on('click', () => onClick(stop));

    // Use Unified Popup. If Focused (Selected), make it permanent.
    bindRichStopPopup(marker, stop, {
      isCurrent: isFocused,
      isDark,
      timezone,
      useStationTime,
      permanent: isFocused,
    });
    layers.addLayer(marker);
  });
};

const drawIsolinePaths = (
  layers: L.LayerGroup,
  items: { legs: Leg[] }[],
  isDimmed: boolean,
  colorResolver: (
    toId: string | undefined,
    fromId: string | undefined,
    durationMin: number
  ) => string,
  renderer?: L.Renderer
) => {
  items.forEach((item) => {
    const leg = item.legs[0];
    if (
      !isValidCoordinate(leg?.from.latitude, leg?.from.longitude) ||
      !isValidCoordinate(leg?.to.latitude, leg?.to.longitude)
    )
      return;

    const durationMin = (leg.duration || 0) / 60;
    const color = colorResolver(leg.toStop?.id, leg.fromStop?.id, durationMin);

    // Reduce opacity significantly if dimmed (selected connection is active)
    L.polyline(
      [
        [leg.from.latitude, leg.from.longitude],
        [leg.to.latitude, leg.to.longitude],
      ],
      {
        color: color,
        weight: 3,
        opacity: isDimmed ? 0.1 : 0.8,
        interactive: false,
        renderer,
      }
    ).addTo(layers);
  });
};

const drawIsolineStops = (
  layers: L.LayerGroup,
  stops: Stop[],
  connections: { legs: Leg[] }[],
  isDark: boolean,
  timezone: string,
  useStationTime: boolean,
  highlightedStopId: string | null | undefined,
  isDimmed: boolean,
  colorResolver: (
    toId: string | undefined,
    fromId: string | undefined,
    durationMin: number
  ) => string,
  labelResolver: (
    toId: string | undefined,
    fromId: string | undefined,
    durationMin: number
  ) => string,
  onClick?: (s: Stop) => void,
  renderer?: L.Renderer
) => {
  const stopDurationMap = new Map<string, number>();
  connections.forEach((c) => {
    const dur = (c.legs[0].duration || 0) / 60;
    if (c.legs[0]?.toStop) stopDurationMap.set(c.legs[0].toStop.id, dur);
    if (c.legs[0]?.fromStop) stopDurationMap.set(c.legs[0].fromStop.id, dur);
  });

  stops.forEach((stop) => {
    if (
      !isValidCoordinate(stop.coordinates.latitude, stop.coordinates.longitude)
    )
      return;
    const duration = stopDurationMap.get(stop.id) || 0;
    const color = colorResolver(stop.id, stop.id, duration);
    const label = labelResolver(stop.id, stop.id, duration);

    const isHighlighted = stop.id === highlightedStopId;

    if (isHighlighted) {
      const icon = createStopIcon('highlighted', isDark, color);
      const marker = L.marker(
        [stop.coordinates.latitude, stop.coordinates.longitude],
        {
          icon,
          zIndexOffset: 1000,
        }
      );

      // Rich Popup for Highlighted
      bindRichStopPopup(marker, stop, {
        isDark,
        timezone,
        useStationTime,
        permanent: true,
        highlightColor: color,
        subtitle: label,
      });

      if (onClick) marker.on('click', () => onClick(stop));
      layers.addLayer(marker);
    } else {
      // If mode is dimmed, make non-highlighted stops very subtle
      const opacity = isDimmed ? 0.2 : 1;

      // Canvas-rendered circle marker for non-highlighted points
      const circle = L.circleMarker(
        [stop.coordinates.latitude, stop.coordinates.longitude],
        {
          radius: 5,
          fillColor: color,
          fillOpacity: opacity,
          color: isDark ? '#1e293b' : '#ffffff',
          weight: 1,
          opacity: opacity,
          renderer,
        }
      );

      // Lazy tooltip: bind on first hover instead of eagerly for every marker
      if (!isDimmed) {
        circle.on('mouseover', () => {
          if (!circle.getTooltip()) {
            const textColor = isDark ? '#fff' : '#0f172a';
            circle.bindTooltip(
              `<div class="text-center min-w-[60px] font-sans">
                <div class="font-bold text-xs" style="color:${textColor}">${stop.name}</div>
                <div class="text-[10px] font-mono mt-0.5 font-bold flex items-center justify-center gap-1" style="color:${color}"><span>${label}</span></div>
              </div>`,
              {
                direction: 'top',
                offset: [0, -6],
                className:
                  '!bg-white/95 dark:!bg-slate-900/95 backdrop-blur-md !border-0 !shadow-xl rounded-lg px-2 py-1',
              }
            );
          }
          circle.openTooltip();
        });
      }

      if (onClick) circle.on('click', () => onClick(stop));
      layers.addLayer(circle);
    }
  });
};
