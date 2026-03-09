import React from 'react';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { Connection, StopConnection } from '../../types';
import TransportIcon from './TransportIcon';
import { TRANSPORT_COLORS } from '../../constants';

interface IsolineCardProps {
  id: string;
  item: StopConnection;
  isHighlighted: boolean;
  isExpanded: boolean;
  detailedConnection?: Connection | null;
  onToggle: () => void;
  formatTime: (iso: string) => string;
}

const IsolineCard: React.FC<IsolineCardProps> = ({
  id,
  item,
  isHighlighted,
  isExpanded,
  detailedConnection,
  onToggle,
  formatTime,
}) => {
  const leg = item.connectingLeg;

  // Use connection.duration when set and non-zero; otherwise fall back to connectingLeg.duration.
  const duration = item.connection?.duration
    ? Math.round(item.connection.duration / 60)
    : Math.round((item.connectingLeg.duration ?? 0) / 60);

  const mode = leg.trip?.route?.transportMode || 'WALK';
  const color = TRANSPORT_COLORS[mode] || TRANSPORT_COLORS.WALK;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  return (
    <div
      id={id}
      className={`flex flex-col rounded-xl border transition-all duration-200 overflow-hidden ${
        isHighlighted
          ? 'bg-slate-100 dark:bg-slate-900 border-brand-200 dark:border-brand-800 shadow-md'
          : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:border-slate-100 dark:hover:border-slate-800'
      }`}
      onClick={handleToggle}
    >
      <div className="flex items-center justify-between p-3 cursor-pointer">
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              isHighlighted
                ? 'bg-brand-200 dark:bg-brand-900 text-brand-700 dark:text-brand-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
            }`}
          >
            <MapPin size={16} />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {item.stop.name}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              {isExpanded ? 'Hide route' : 'Show route'}
              {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </span>
          </div>
        </div>
        <div className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-800 border border-brand-100 dark:border-brand-900 px-2 py-1 rounded shadow-sm">
          {duration} min
        </div>
      </div>

      {isExpanded && detailedConnection && (
        <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 py-3 pr-4 animate-in slide-in-from-top-2">
          {detailedConnection.legs.map((detailLeg, idx) => {
            const lMode = detailLeg.trip?.route?.transportMode || 'WALK';
            const lColor = TRANSPORT_COLORS[lMode] || TRANSPORT_COLORS.WALK;
            const isFirstLeg = idx === 0;
            const isLastLeg = idx === detailedConnection.legs.length - 1;

            const prevLeg = idx > 0 ? detailedConnection.legs[idx - 1] : null;
            const prevMode = prevLeg?.trip?.route?.transportMode || 'WALK';
            const prevColor =
              TRANSPORT_COLORS[prevMode] || TRANSPORT_COLORS.WALK;

            return (
              <React.Fragment key={idx}>
                {/* Origin Stop Row */}
                <div className="grid grid-cols-[60px_24px_1fr] items-center min-h-[32px]">
                  <div className="text-[10px] font-mono text-right pr-2 text-slate-900 dark:text-slate-300 font-medium">
                    {formatTime(detailLeg.departureTime)}
                  </div>
                  <div className="relative flex flex-col items-center justify-center h-full">
                    {!isFirstLeg && (
                      <div
                        className="w-0.5 h-1/2 absolute top-0"
                        style={{ backgroundColor: prevColor }}
                      />
                    )}
                    <div
                      className="w-0.5 h-1/2 absolute bottom-0"
                      style={{ backgroundColor: lColor }}
                    />
                    <div
                      className="relative z-10 w-2.5 h-2.5 rounded-full border-2 box-content bg-white dark:bg-slate-900"
                      style={{ borderColor: lColor }}
                    />
                  </div>
                  <div className="pl-3 text-sm text-slate-700 dark:text-slate-300 font-medium truncate">
                    {detailLeg.fromStop?.name || 'Origin'}
                  </div>
                </div>

                {/* Leg Info Row */}
                <div className="grid grid-cols-[60px_24px_1fr] min-h-[40px]">
                  <div />
                  <div className="relative flex flex-col items-center h-full">
                    <div
                      className="w-0.5 h-full"
                      style={{ backgroundColor: lColor }}
                    />
                  </div>
                  <div className="pl-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border bg-white dark:bg-slate-800"
                        style={{ borderColor: lColor, color: lColor }}
                      >
                        <TransportIcon mode={lMode} size={10} />
                        <span>
                          {detailLeg.type === 'WALK'
                            ? 'Walk'
                            : detailLeg.trip?.route.shortName}
                        </span>
                      </div>
                      {detailLeg.trip && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          to {detailLeg.trip.headSign}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Destination Stop Row (only for last leg) */}
                {isLastLeg && (
                  <div className="grid grid-cols-[60px_24px_1fr] items-center min-h-[32px]">
                    <div className="text-[10px] font-mono text-right pr-2 text-slate-500 dark:text-slate-400">
                      {formatTime(detailLeg.arrivalTime)}
                    </div>
                    <div className="relative flex flex-col items-center justify-center h-full">
                      <div
                        className="w-0.5 h-1/2 absolute top-0"
                        style={{ backgroundColor: lColor }}
                      />
                      <div
                        className="relative z-10 w-2.5 h-2.5 rounded-full border-2 box-content bg-white dark:bg-slate-900"
                        style={{ borderColor: lColor }}
                      />
                    </div>
                    <div className="pl-3 text-sm text-slate-700 dark:text-slate-300 font-medium truncate">
                      {detailLeg.toStop?.name || 'Destination'}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Fallback View (Single Leg) if Detailed Connection Missing */}
      {isExpanded && !detailedConnection && (
        <div className="bg-slate-50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800 py-3 pr-4 animate-in slide-in-from-top-2">
          {/* Origin Row */}
          <div className="grid grid-cols-[60px_24px_1fr] items-center min-h-[40px]">
            <div className="text-[10px] font-mono text-right pr-2 text-slate-900 dark:text-slate-300 font-medium">
              {formatTime(leg.departureTime)}
            </div>
            <div className="relative flex flex-col items-center justify-center h-full">
              <div
                className="w-0.5 h-1/2 absolute bottom-0"
                style={{ backgroundColor: color }}
              />
              <div
                className="relative z-10 w-2.5 h-2.5 rounded-full border-2 box-content bg-white dark:bg-slate-900"
                style={{ borderColor: color }}
              />
            </div>
            <div className="pl-3 text-sm text-slate-700 dark:text-slate-300 font-medium truncate">
              {leg.fromStop?.name || 'Origin'}
            </div>
          </div>

          {/* Connection Line Row */}
          <div className="grid grid-cols-[60px_24px_1fr] min-h-[20px]">
            <div />
            <div className="relative flex flex-col items-center h-full">
              <div
                className="w-0.5 h-full"
                style={{ backgroundColor: color }}
              />
            </div>
            <div />
          </div>

          {/* Destination Row */}
          <div className="grid grid-cols-[60px_24px_1fr] items-center min-h-[40px]">
            <div className="text-[10px] font-mono text-right pr-2 text-slate-900 dark:text-slate-300 font-medium">
              {formatTime(leg.arrivalTime)}
            </div>
            <div className="relative flex flex-col items-center justify-center h-full">
              <div
                className="w-0.5 h-1/2 absolute top-0"
                style={{ backgroundColor: color }}
              />
              <div
                className="relative z-10 w-2.5 h-2.5 rounded-full border-2 box-content bg-white dark:bg-slate-900"
                style={{ borderColor: color }}
              />
            </div>
            <div className="pl-3 text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {leg.toStop?.name || 'Destination'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IsolineCard;
