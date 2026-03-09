import React, { useEffect, useRef } from 'react';
import { Loader2, MapPin, X } from 'lucide-react';
import { Stop } from '../../types';
import { useStopSearch } from '../../hooks/useStopSearch';

interface StopSearchProps {
  label?: string;
  placeholder?: string;
  selectedStop: Stop | null;
  onSelect: (stop: Stop | null) => void;
  autoFocus?: boolean;
  className?: string;
}

const StopSearch: React.FC<StopSearchProps> = ({
  label,
  placeholder = 'Search stop...',
  selectedStop,
  onSelect,
  autoFocus,
  className = 'mb-3',
}) => {
  const { query, setQuery, suggestions, loading, clear, setSuggestions } =
    useStopSearch();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setSuggestions]);

  const handleSelect = (stop: Stop) => {
    onSelect(stop);
    clear(); // Clear internal search state
    setSuggestions([]);
  };

  const handleClear = () => {
    onSelect(null);
    clear();
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && (
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">
          {label}
        </label>
      )}

      <div className="relative z-10">
        <div className="absolute left-3 inset-y-0 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <MapPin size={16} />
          )}
        </div>

        <input
          className={`w-full h-9 pl-9 pr-8 py-2 text-base rounded-lg border transition-all focus:ring-2 focus:ring-brand-500 focus:outline-none
          ${
            selectedStop
              ? 'font-bold text-brand-700 bg-brand-50 border-brand-200 dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-800'
              : 'bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500'
          }`}
          placeholder={placeholder}
          value={selectedStop ? selectedStop.name : query}
          onChange={(e) => {
            if (selectedStop) onSelect(null); // Clear selection if user types
            setQuery(e.target.value);
          }}
          onFocus={() => {
            if (selectedStop) {
              onSelect(null);
              setQuery(selectedStop.name);
            }
          }}
          autoFocus={autoFocus}
        />

        {(query || selectedStop) && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {!selectedStop && suggestions.length > 0 && (
        <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-900 shadow-xl rounded-b-lg border border-slate-100 dark:border-slate-800 mt-1 z-30 max-h-52 overflow-auto animate-in fade-in zoom-in-95 duration-100">
          {suggestions.map((stop) => (
            <button
              key={stop.id}
              onClick={() => handleSelect(stop)}
              className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm border-b border-slate-50 dark:border-slate-800 last:border-0 flex items-center gap-2 group transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                <MapPin size={12} />
              </div>
              <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                {stop.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StopSearch;
