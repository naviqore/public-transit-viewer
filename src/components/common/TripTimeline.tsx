import React from 'react';
import { Trip } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { formatDisplayTime } from '../../utils/dateUtils';

interface TripTimelineProps {
  trip: Trip;
  currentStopId: string;
  currentTime: string; // This will likely be in ISO from exploreState
  onClose?: () => void;
  embedded?: boolean;
}

const TripTimeline: React.FC<TripTimelineProps> = ({
  trip,
  currentStopId,
  currentTime,
  onClose,
  embedded = false,
}) => {
  const { timezone, useStationTime } = useSettings();
  const stopTimes = trip.stopTimes || [];
  const nowMs = new Date(currentTime).getTime();

  // Find the index of the current stop to correctly determine past/future stops
  // We look for the first occurrence of the stop ID.
  const currentIndex = stopTimes.findIndex(
    (st) => st.stop.id === currentStopId
  );

  const formatTime = (iso: string) =>
    formatDisplayTime(iso, timezone, useStationTime);

  return (
    <div
      className={`${embedded ? 'bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800' : 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg'} overflow-hidden`}
    >
      {!embedded && (
        <div className="bg-slate-50 dark:bg-slate-800 p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {trip.route.shortName}
              <span className="font-normal text-slate-500 dark:text-slate-400">
                towards
              </span>{' '}
              {trip.headSign}
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700"
            >
              Close
            </button>
          )}
        </div>
      )}

      <div
        className={`py-2 px-3 ${!embedded ? 'max-h-[60vh] overflow-y-auto' : ''}`}
      >
        <div className="flex flex-col">
          {stopTimes.map((st, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === stopTimes.length - 1;

            // 1. If we found the stop by ID, strictly use index to determine Past/Current
            // 2. If ID match failed (e.g. platform mismatch), fallback to time comparison
            const isCurrent = idx === currentIndex;
            const isPast =
              currentIndex !== -1
                ? idx < currentIndex
                : new Date(st.departureTime).getTime() < nowMs && !isCurrent;

            const lineColor = isPast
              ? 'bg-slate-300 dark:bg-slate-700'
              : 'bg-indigo-200 dark:bg-indigo-900';

            // Dot styling: Current gets "Pulse" ring, Past is grey, Future is white/hollow
            let dotColor =
              'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-400'; // Default Future
            if (isCurrent) {
              dotColor =
                'bg-indigo-600 border-indigo-100 dark:border-indigo-900 shadow-[0_0_0_4px_rgba(79,70,229,0.2)]';
            } else if (isPast) {
              dotColor =
                'bg-slate-300 dark:bg-slate-700 border-slate-100 dark:border-slate-800';
            }

            const textColor = isCurrent
              ? 'text-slate-900 dark:text-slate-100 font-bold'
              : isPast
                ? 'text-slate-400 dark:text-slate-600'
                : 'text-slate-700 dark:text-slate-300';

            return (
              <div
                key={idx}
                className="grid grid-cols-[60px_24px_1fr] min-h-[60px] relative group"
              >
                <div className="relative h-full w-full">
                  {!isFirst && (
                    <span
                      className={`absolute bottom-1/2 mb-3 right-2 text-[10px] font-mono leading-none z-10 ${isPast ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                      {formatTime(st.arrivalTime)}
                    </span>
                  )}
                  {!isLast && (
                    <span
                      className={`absolute top-1/2 mt-3 right-2 text-[10px] font-mono leading-none z-10 ${isPast ? 'text-slate-300' : 'text-slate-900 dark:text-slate-300 font-medium'}`}
                    >
                      {formatTime(st.departureTime)}
                    </span>
                  )}
                </div>
                <div className="relative flex flex-col items-center h-full">
                  {/* Upper Line Segment */}
                  <div
                    className={`w-0.5 flex-1 ${!isFirst ? lineColor : 'bg-transparent'}`}
                  />

                  {/* Dot */}
                  <div
                    className={`relative z-10 w-3 h-3 rounded-full border-2 box-content flex-shrink-0 my-0.5 transition-all duration-300 ${dotColor} ${isCurrent ? 'scale-125' : ''}`}
                  />

                  {/* Lower Line Segment */}
                  <div
                    className={`w-0.5 flex-1 ${!isLast ? (isCurrent ? 'bg-indigo-200 dark:bg-indigo-900' : lineColor) : 'bg-transparent'}`}
                  />
                </div>
                <div className={`pl-3 flex items-center ${textColor}`}>
                  <div className="text-sm leading-tight py-2">
                    {st.stop.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TripTimeline;
