import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import React, { useMemo } from 'react';

import { useDomain } from '../../contexts/DomainContext';
import { useSettings } from '../../contexts/SettingsContext';
import { TimeType } from '../../types';
import { getCurrentInputTime } from '../../utils/dateUtils';

interface DateTimeSelectorProps {
  date: string;
  setDate: (d: string) => void;
  timeType: TimeType;
  setTimeType: (t: TimeType) => void;
}

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  date,
  setDate,
  timeType,
  setTimeType,
}) => {
  const { serverInfo } = useDomain();
  const { timezone } = useSettings();

  // Validate inputs based on schedule validity
  const { minDate, maxDate } = useMemo(() => {
    if (!serverInfo.schedule?.scheduleValidity)
      return { minDate: undefined, maxDate: undefined };

    // scheduleValidity usually returns YYYY-MM-DD
    // datetime-local input needs YYYY-MM-DDThh:mm
    const v = serverInfo.schedule.scheduleValidity;
    return {
      minDate: v.startDate ? `${v.startDate}T00:00` : undefined,
      maxDate: v.endDate ? `${v.endDate}T23:59` : undefined,
    };
  }, [serverInfo.schedule]);

  const handleSetNow = () => {
    setDate(getCurrentInputTime(timezone));
  };

  return (
    <div className="flex flex-row gap-1 sm:gap-2 min-w-0 w-full">
      <div className="flex-1 min-w-0 w-full pt-0.5">
        <div className="flex items-end justify-between mb-1">
          <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 block leading-4 truncate">
            Date & Time
          </label>
        </div>
        <div className="relative group flex items-center">
          <Calendar
            size={16}
            className="absolute left-3 text-slate-400 pointer-events-none z-10"
          />
          <style>{`
            input[type="datetime-local"]::-webkit-calendar-picker-indicator {
              background: transparent;
              bottom: 0;
              color: transparent;
              cursor: pointer;
              height: auto;
              left: 0;
              position: absolute;
              right: 0;
              top: 0;
              width: auto;
              z-index: 5;
            }
          `}</style>
          <input
            type="datetime-local"
            min={minDate}
            max={maxDate}
            className="h-9 w-full min-w-[100px] pl-9 pr-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-base font-normal text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all dark:[color-scheme:dark] invalid:text-red-500 invalid:border-red-300"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            onClick={handleSetNow}
            className="absolute right-3 inset-y-0 flex items-center text-slate-400 dark:text-slate-500 hover:text-brand-500 transition-colors"
            title="Set to Now"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <div className="w-[72px] flex-shrink-0 pt-0.5">
        <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block h-4 leading-4 truncate">
          Type
        </label>
        <div className="flex bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 h-9 overflow-hidden p-0">
          <button
            onClick={() => setTimeType(TimeType.DEPARTURE)}
            className={`flex-1 h-full flex items-center justify-center transition-all ${
              timeType === TimeType.DEPARTURE
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
            title="Departure"
            aria-label="Departure"
          >
            <ArrowUpRight size={16} />
          </button>
          <div className="w-px bg-slate-200 dark:bg-slate-700 my-1"></div>
          <button
            onClick={() => setTimeType(TimeType.ARRIVAL)}
            className={`flex-1 h-full flex items-center justify-center transition-all ${
              timeType === TimeType.ARRIVAL
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
            title="Arrival"
            aria-label="Arrival"
          >
            <ArrowDownRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateTimeSelector;
