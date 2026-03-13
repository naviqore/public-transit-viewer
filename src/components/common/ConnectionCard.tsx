import { ArrowRight, ChevronDown, ChevronUp, Footprints } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import TransportIcon from './TransportIcon';
import { TRANSPORT_COLORS } from '../../constants';
import { useSettings } from '../../contexts/SettingsContext';
import { Connection, Leg, StopTime } from '../../types';
import { getLegStopTimes } from '../../utils/dataUtils';
import { getDayDifference } from '../../utils/dateUtils';

interface ConnectionCardProps {
  id?: string;
  connection: Connection;
  isSelected: boolean;
  onClick: () => void;
  onLegClick?: (leg: Leg) => void;
  formatTime: (iso: string) => string;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  id,
  connection,
  isSelected,
  onClick,
  onLegClick,
  formatTime,
}) => {
  const { timezone } = useSettings();
  const [expanded, setExpanded] = useState(isSelected);
  const [expandedLegIndex, setExpandedLegIndex] = useState<number | null>(null);

  // Sync expansion with selection state
  useEffect(() => {
    setExpanded(isSelected);
    if (!isSelected) {
      setExpandedLegIndex(null);
    }
  }, [isSelected]);

  const { totalDurationMs, dominantMode, transferCount } = useMemo(() => {
    let total = 0;
    const modeDurations: Record<string, number> = {};
    let routeLegCount = 0;

    connection.legs.forEach((leg) => {
      const start = new Date(leg.departureTime).getTime();
      const end = new Date(leg.arrivalTime).getTime();
      const legDur = end - start;

      total += legDur;

      const mode = leg.trip?.route?.transportMode || 'WALK';
      modeDurations[mode] = (modeDurations[mode] || 0) + legDur;

      if (leg.type === 'ROUTE') {
        routeLegCount++;
      }
    });

    let maxDur = -1;
    let domMode = 'WALK';

    Object.entries(modeDurations).forEach(([m, d]) => {
      if (d > maxDur) {
        maxDur = d;
        domMode = m;
      }
    });

    const calculatedTransfers = Math.max(0, routeLegCount - 1);

    return {
      totalDurationMs: total,
      dominantMode: domMode,
      transferCount: calculatedTransfers,
    };
  }, [connection]);

  const durationMinutes = Math.round(totalDurationMs / 60000);
  const startIso = connection.legs.length
    ? connection.legs[0].departureTime
    : new Date().toISOString();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      if (expanded) {
        onClick();
      } else {
        setExpanded(true);
      }
    } else {
      onClick();
    }
  };

  const handleLegClickInternal = (leg: Leg, idx: number) => {
    onLegClick?.(leg);
    setExpandedLegIndex((prev) => (prev === idx ? null : idx));
  };

  const DayBadge = ({ isoDate }: { isoDate: string }) => {
    const diff = getDayDifference(isoDate, startIso, timezone);
    if (diff > 0) {
      return (
        <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400 ml-1">
          +{diff}d
        </span>
      );
    }
    return null;
  };

  const renderVerticalLine = (
    type: 'SOLID' | 'DOTTED' | 'TRANSPARENT',
    color?: string
  ) => {
    if (type === 'TRANSPARENT') {
      return <div className="w-0.5 flex-1 bg-transparent" />;
    }
    if (type === 'DOTTED') {
      return (
        <div className="w-0.5 flex-1 border-l-2 border-dotted border-slate-300 dark:border-slate-600" />
      );
    }
    return <div className="w-0.5 flex-1" style={{ backgroundColor: color }} />;
  };

  const renderWalkLeg = (leg: Leg, idx: number) => {
    const mins = Math.round((leg.duration || 0) / 60);
    return (
      <div
        key={`leg-${idx}`}
        className="grid grid-cols-[60px_24px_1fr] min-h-[28px]"
      >
        {/* Time */}
        <div />

        {/* Visual: Continuous Dotted Line */}
        <div className="relative flex flex-col items-center h-full">
          {renderVerticalLine('DOTTED')}
        </div>

        {/* Content */}
        <div className="pl-3 py-1 flex items-center">
          <div className="inline-flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 italic bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
            <Footprints size={10} />
            <span>Walk {mins} min</span>
          </div>
        </div>
      </div>
    );
  };

  const renderTripLeg = (
    leg: Leg,
    idx: number,
    prevLeg?: Leg,
    nextLeg?: Leg
  ) => {
    const trip = leg.trip;
    if (!trip) return null;

    // Use utility to get only the stops relevant to this specific leg
    const relevantStops = getLegStopTimes(leg);
    const isExpanded = expandedLegIndex === idx;

    // If expanded, show all relevant stops. If not, show only origin/destination of the leg.
    const displayStops = isExpanded
      ? relevantStops
      : relevantStops.length > 2
        ? [relevantStops[0], relevantStops[relevantStops.length - 1]]
        : relevantStops;

    return displayStops.map((st: StopTime, sIdx: number) => {
      const isLegStart = sIdx === 0;
      const isLegEnd = sIdx === displayStops.length - 1;
      const mode = trip.route.transportMode;
      const color = TRANSPORT_COLORS[mode] || TRANSPORT_COLORS.WALK;

      const arrTimeStr = formatTime(st.arrivalTime);
      const depTimeStr = formatTime(st.departureTime);

      // Determine Line Styles
      let lineAboveType: 'SOLID' | 'DOTTED' | 'TRANSPARENT' = 'SOLID';
      let lineBelowType: 'SOLID' | 'DOTTED' | 'TRANSPARENT' = 'SOLID';

      // Logic for Line Above
      if (isLegStart) {
        // If it's the start of the trip leg, check the previous leg
        if (prevLeg?.type === 'WALK') {
          lineAboveType = 'DOTTED';
        } else {
          lineAboveType = 'TRANSPARENT';
        }
      }

      // Logic for Line Below
      if (isLegEnd) {
        // If it's the end of the trip leg, check the next leg
        if (nextLeg?.type === 'WALK') {
          lineBelowType = 'DOTTED';
        } else {
          lineBelowType = 'TRANSPARENT';
        }
      }

      const arrDiff = getDayDifference(st.arrivalTime, startIso, timezone);
      const depDiff = getDayDifference(st.departureTime, startIso, timezone);

      return (
        <div
          key={`leg-${idx}-stop-${sIdx}`}
          className={`grid grid-cols-[60px_24px_1fr] min-h-[60px] group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors`}
          onClick={(e) => {
            e.stopPropagation();
            handleLegClickInternal(leg, idx);
          }}
        >
          {/* 1. Time Column - Relative to Center (50%) */}
          <div className="relative h-full w-full">
            {/* Arrival */}
            {!isLegStart && (
              <div className="absolute bottom-1/2 mb-3 right-2 flex items-center justify-end">
                <div className="relative">
                  <span
                    className={`text-[10px] font-mono leading-none block ${isLegEnd ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}
                  >
                    {arrTimeStr}
                  </span>
                  {arrDiff > 0 && (
                    <span className="absolute top-full right-0 text-[8px] font-bold text-brand-600 dark:text-brand-400 leading-none mt-0.5">
                      +{arrDiff}d
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Departure */}
            {!isLegEnd && (
              <div className="absolute top-1/2 mt-3 right-2 flex items-center justify-end">
                <div className="relative">
                  {depDiff > 0 && (
                    <span className="absolute bottom-full right-0 text-[8px] font-bold text-brand-600 dark:text-brand-400 leading-none mb-0.5">
                      +{depDiff}d
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-mono leading-none font-medium block ${isLegStart ? 'text-slate-900 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    {depTimeStr}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Visual Column */}
          <div className="relative flex flex-col items-center h-full">
            {/* Line Above */}
            {renderVerticalLine(lineAboveType, color)}

            {/* Dot */}
            <div
              className={`relative z-10 w-3 h-3 rounded-full border-2 box-content flex-shrink-0 my-0.5 bg-white dark:bg-slate-900 transition-transform ${isLegStart || isLegEnd ? 'scale-125' : ''}`}
              style={{ borderColor: color }}
            />

            {/* Line Below */}
            {renderVerticalLine(lineBelowType, color)}
          </div>

          {/* 3. Content Column */}
          <div className="relative pl-3 py-1 flex flex-col justify-center -ml-2 pl-5 rounded-r-lg">
            <div
              className={`text-sm leading-tight ${isLegStart || isLegEnd ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}
            >
              {st.stop?.name || 'Unknown Stop'}
            </div>

            {/* Route Info Badge (Centered between this row and next) */}
            {isLegStart && (
              <div className="absolute top-full left-0 pl-3 z-10 -translate-y-1/2 pointer-events-none w-full">
                <div className="flex items-center gap-2 pr-2">
                  <div
                    className="flex items-center gap-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded border shadow-sm bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm"
                    style={{ borderColor: color, color: color }}
                  >
                    <TransportIcon mode={mode} size={10} />
                    <span>{trip.route.shortName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px] bg-slate-50/80 dark:bg-slate-900/80 px-1 rounded backdrop-blur-sm">
                    to {trip.headSign}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`result-item flex flex-col border rounded-xl transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'bg-slate-100 dark:bg-slate-900 border-brand-200 dark:border-brand-800 shadow-md'
          : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:border-slate-100 dark:hover:border-slate-800'
      }`}
    >
      {/* Summary Header */}
      <div className="p-3 cursor-pointer" onClick={handleToggle}>
        <div className="flex w-full justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-lg">
              {formatTime(connection.legs[0].departureTime)}
            </span>
            <ArrowRight size={14} className="text-slate-400" />
            <div className="flex items-center">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                {formatTime(
                  connection.legs[connection.legs.length - 1].arrivalTime
                )}
              </span>
              <DayBadge
                isoDate={
                  connection.legs[connection.legs.length - 1].arrivalTime
                }
              />
            </div>
          </div>

          {/* Dominant Mode & Total Duration */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
            <TransportIcon mode={dominantMode} size={12} />
            {durationMinutes} min
          </div>
        </div>

        {/* Proportional Bar Chart Visualization */}
        <div className="w-full flex items-center gap-1 mb-1">
          {connection.legs.map((leg, i) => {
            const mode = leg.trip?.route?.transportMode || 'WALK';
            const legDuration =
              new Date(leg.arrivalTime).getTime() -
              new Date(leg.departureTime).getTime();

            // We use flexGrow to set width relative to time, with a small min-width for visibility
            return (
              <div
                key={i}
                className="flex flex-col gap-1 group relative min-w-[4px] rounded-full overflow-hidden"
                style={{ flexGrow: Math.max(legDuration, 1) }}
              >
                <div
                  className="h-2 w-full transition-all"
                  style={{
                    backgroundColor:
                      TRANSPORT_COLORS[mode] || TRANSPORT_COLORS.WALK,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] text-slate-400 font-medium">
            {transferCount === 0 ? 'Direct' : `${transferCount} transfers`}
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-brand-500" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 py-3 pr-4 animate-in slide-in-from-top-2 duration-200">
          {connection.legs.map((leg, idx) => {
            const prevLeg = connection.legs[idx - 1];
            const nextLeg = connection.legs[idx + 1];
            return leg.type === 'WALK'
              ? renderWalkLeg(leg, idx)
              : renderTripLeg(leg, idx, prevLeg, nextLeg);
          })}
        </div>
      )}
    </div>
  );
};

export default ConnectionCard;
