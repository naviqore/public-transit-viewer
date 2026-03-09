import { useEffect } from 'react';
import L from 'leaflet';
import { Connection, Leg, Stop } from '../types';
import { COLORS, getGradientColor, TRANSPORT_COLORS } from '../constants';
import { getLegStopTimes } from '../utils/dataUtils';
import { bindRichStopPopup, bindRichLinePopup } from './mapLayers/popups';
import {
  isValidCoordinate,
  createStopIcon,
  StopMarkerType,
} from './mapLayers/stopIcons';
import { IsolineColorMode, getTransferColor } from '../utils/isolineColorUtils';

interface UseMapLayersProps {
  map: L.Map | null;
  layerGroup: L.LayerGroup | null;
  stops?: Stop[];
  connections?: Connection[];
  selectedConnection?: Connection | null;
  currentStopId?: string;
  isolines?: Stop[];
  visConnections?: { legs: Leg[] }[];
  variant?: 'default' | 'isoline';
  darkMode: boolean;
  timezone: string;
  isolineMaxDuration: number;
  isolineColorMode?: IsolineColorMode;
  isolineTransfersMap?: Map<string, number>;

  // Highlighting
  sourceStop?: Stop;
  targetStop?: Stop;
  highlightedStopId?: string | null;

  onStopClick?: (stop: Stop) => void;
  onConnectionClick?: (connection: Connection) => void;
}

export const useMapLayers = ({
  map,
  layerGroup,
  stops,
  connections,
  selectedConnection,
  currentStopId,
  isolines,
  visConnections,
  variant,
  darkMode,
  timezone,
  isolineMaxDuration,
  isolineColorMode,
  isolineTransfersMap,
  sourceStop,
  targetStop,
  highlightedStopId,
  onStopClick,
  onConnectionClick,
}: UseMapLayersProps) => {
  useEffect(() => {
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Colour resolvers for isoline mode — encapsulate mode + transfer map lookup
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

    // 1. Draw Lines
    if (selectedConnection) {
      drawConnection(
        layerGroup,
        selectedConnection,
        true,
        darkMode,
        currentStopId
      );
      drawTripStops(
        layerGroup,
        selectedConnection,
        currentStopId,
        darkMode,
        timezone,
        sourceStop,
        targetStop,
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
          onConnectionClick
        )
      );
    }

    const isDimmed = !!selectedConnection;

    if (visConnections && Array.isArray(visConnections)) {
      if (variant === 'isoline') {
        drawIsolinePaths(layerGroup, visConnections, isDimmed, colorResolver);
      } else if (!selectedConnection) {
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
        onStopClick
      );
    }

    if (
      isolines &&
      Array.isArray(isolines) &&
      visConnections &&
      variant === 'isoline'
    ) {
      drawIsolineStops(
        layerGroup,
        isolines,
        visConnections,
        darkMode,
        timezone,
        highlightedStopId,
        isDimmed,
        colorResolver,
        labelResolver,
        onStopClick
      );
    }

    drawSourceTargetStops(
      layerGroup,
      sourceStop,
      targetStop,
      darkMode,
      timezone
    );
  }, [
    map,
    layerGroup,
    stops,
    connections,
    selectedConnection,
    currentStopId,
    isolines,
    visConnections,
    variant,
    darkMode,
    timezone,
    isolineMaxDuration,
    isolineColorMode,
    isolineTransfersMap,
    sourceStop,
    targetStop,
    highlightedStopId,
  ]);
};

// --- DRAWING IMPLEMENTATIONS (Private to Hook) ---

const drawSourceTargetStops = (
  layers: L.LayerGroup,
  source: Stop | undefined,
  target: Stop | undefined,
  isDark: boolean,
  timezone: string
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
    bindRichStopPopup(marker, source, { isDark, timezone, permanent: true });
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
    bindRichStopPopup(marker, target, { isDark, timezone, permanent: true });
    layers.addLayer(marker);
  }
};

const drawConnection = (
  layers: L.LayerGroup,
  conn: Connection,
  isSelected: boolean,
  isDark: boolean,
  currentStopId?: string,
  onClick?: (c: Connection) => void
) => {
  if (!conn.legs) return;

  conn.legs.forEach((leg) => {
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

          const poly = L.polyline(
            [
              [
                startSt.stop.coordinates.latitude,
                startSt.stop.coordinates.longitude,
              ],
              [
                endSt.stop.coordinates.latitude,
                endSt.stop.coordinates.longitude,
              ],
            ],
            {
              color: segmentColor,
              weight: isPast ? 4 : 5,
              opacity: isPast ? 0.7 : 1, // Increased opacity for high contrast on light maps
              lineCap: 'round',
              lineJoin: 'round',
            }
          );
          bindRichLinePopup(poly, leg, isDark, isPast);
          poly.addTo(layers);
        }
        return;
      }
    }

    const poly = L.polyline(points, {
      color: standardColor,
      weight: isWalk ? 4 : 5,
      opacity: isSelected ? 1 : 0.4,
      dashArray: isWalk ? '1, 8' : undefined,
      lineCap: 'round',
      lineJoin: 'round',
      className: isSelected ? 'drop-shadow-md' : '',
    });

    if (onClick) {
      const clickArea = L.polyline(points, {
        color: 'transparent',
        weight: 20,
        className: 'cursor-pointer',
      });
      clickArea.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onClick(conn);
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
  sourceStop: Stop | undefined,
  targetStop: Stop | undefined,
  onClick?: (s: Stop) => void
) => {
  const stopsMap = new Map<
    string,
    { stop: Stop; time: string; isPast: boolean }
  >();

  conn.legs?.forEach((leg) => {
    if (leg.type === 'WALK') return;

    const relevantStops = getLegStopTimes(leg);

    if (relevantStops.length > 0) {
      const splitIndex = relevantStops.findIndex(
        (st) => st.stop.id === currentStopId
      );
      relevantStops.forEach((st, idx) => {
        if (sourceStop && st.stop.id === sourceStop.id) return;
        if (targetStop && st.stop.id === targetStop.id) return;

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
  ) => string
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
        className: 'pointer-events-none',
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
  onClick?: (s: Stop) => void
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
        permanent: true,
        highlightColor: color,
        subtitle: label,
      });

      if (onClick) marker.on('click', () => onClick(stop));
      layers.addLayer(marker);
    } else {
      // If mode is dimmed, make non-highlighted stops very subtle
      const opacity = isDimmed ? 0.2 : 1;

      // Efficient Circle Marker for non-highlighted points
      const circle = L.circleMarker(
        [stop.coordinates.latitude, stop.coordinates.longitude],
        {
          radius: 5,
          fillColor: color,
          fillOpacity: opacity,
          color: isDark ? '#1e293b' : '#ffffff', // Border color
          weight: 1,
          opacity: opacity,
        }
      );

      // Only bind tooltip if not dimmed to avoid clutter when focusing on a path
      if (!isDimmed) {
        const textColor = isDark ? '#fff' : '#0f172a';
        circle.bindTooltip(
          `
                    <div class="text-center min-w-[60px] font-sans">
                        <div class="font-bold text-xs" style="color:${textColor}">${stop.name}</div>
                        <div class="text-[10px] font-mono mt-0.5 font-bold flex items-center justify-center gap-1" style="color:${color}"><span>${label}</span></div>
                    </div>`,
          {
            direction: 'top',
            offset: [0, -6],
            className: `!bg-white/95 dark:!bg-slate-900/95 backdrop-blur-md !border-0 !shadow-xl rounded-lg px-2 py-1`,
          }
        );
      }

      if (onClick) circle.on('click', () => onClick(stop));
      layers.addLayer(circle);
    }
  });
};
