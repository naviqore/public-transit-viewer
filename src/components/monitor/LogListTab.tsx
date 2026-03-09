import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownCircle,
  Filter,
  Search,
  Settings,
  Terminal,
} from 'lucide-react';
import { RequestLog } from '../../types';

interface LogListTabProps {
  logs: RequestLog[];
}

const EmptyState: React.FC<{ icon: React.ElementType; message: string }> = ({
  icon: Icon,
  message,
}) => (
  <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 animate-in fade-in zoom-in-95 duration-300">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4">
      <Icon size={32} className="opacity-50" />
    </div>
    <span className="text-sm font-medium">{message}</span>
  </div>
);

const LogListTab: React.FC<LogListTabProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter Logic
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (methodFilter !== 'ALL' && log.method !== methodFilter) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        // Check normal fields
        if (
          log.url.toLowerCase().includes(searchLower) ||
          log.status.toString().includes(searchLower)
        )
          return true;
        // Also check the 'error' field which holds the message for SYSTEM events
        if (
          log.url === 'SYSTEM' &&
          log.error?.toLowerCase().includes(searchLower)
        )
          return true;
        return false;
      }
      return true;
    });
  }, [logs, searchTerm, methodFilter]);

  // Auto Scroll Logic
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);

  /** Strips the scheme and host from a URL string, retaining only path + query for compact display. */
  const formatLogUrl = (urlStr: string) => {
    if (urlStr === 'SYSTEM') return 'System Event';
    try {
      const url = new URL(urlStr);
      if (url.protocol.toLowerCase().startsWith('mock')) {
        return (url.host + url.pathname + url.search).replace(/\/$/, '');
      }
      return url.pathname + url.search;
    } catch {
      return urlStr.replace(/^https?:\/\/[^/]+/, '');
    }
  };

  const uniqueMethods = useMemo(() => {
    const methods = new Set(logs.map((l) => l.method));
    return ['ALL', ...Array.from(methods)];
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Fixed Toolbar */}
      <div className="flex-shrink-0 p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[150px]">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search size={14} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search URL or Status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 h-10 text-base rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Method Filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="h-10 pl-2 pr-8 text-base rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
          >
            {uniqueMethods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Auto Scroll Toggle (Icon Only) */}
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`flex items-center justify-center w-8 h-8 rounded-md border transition-colors ${
            autoScroll
              ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-900/30 dark:border-brand-800 dark:text-brand-300'
              : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
          }`}
          title={autoScroll ? 'Disable Auto-scroll' : 'Enable Auto-scroll'}
        >
          <ArrowDownCircle size={16} />
        </button>
      </div>

      {/* Scrollable List */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-0.5"
      >
        {filteredLogs.length === 0 && (
          <EmptyState icon={Terminal} message="No logs match your filter." />
        )}

        {filteredLogs.map((log) => {
          if (log.url === 'SYSTEM') {
            return (
              <div
                key={log.id}
                className="flex items-center gap-4 py-1.5 px-2 my-1.5 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50"
              >
                <span className="text-slate-400 font-mono text-xs w-[60px] flex-shrink-0">
                  {log.timestamp.toLocaleTimeString('en-GB', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <div className="flex items-center gap-2 flex-1">
                  <div className="p-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300">
                    <Settings size={10} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {log.error || 'System State Changed'}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={log.id}
              className="grid grid-cols-[60px_50px_1fr_50px_40px] gap-2 items-center p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors group border-b border-slate-200/50 dark:border-slate-800/50 last:border-0 font-mono text-xs"
            >
              <span className="text-slate-500 dark:text-slate-400 truncate">
                {log.timestamp.toLocaleTimeString('en-GB', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span
                className={`font-bold truncate ${log.method === 'GET' ? 'text-blue-600 dark:text-blue-400' : log.method === 'MOCK' ? 'text-fuchsia-600 dark:text-fuchsia-400' : 'text-slate-400'}`}
              >
                {log.method}
              </span>
              <div
                className="text-slate-700 dark:text-slate-300 truncate font-medium"
                title={log.url}
              >
                {formatLogUrl(log.url)}
              </div>
              <span
                className={`text-right truncate ${log.duration > 500 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}
              >
                {Math.round(log.duration)}ms
              </span>
              <div className="text-right truncate">
                {log.status === 200 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {log.status}
                  </span>
                ) : (
                  <span className="text-red-500 font-bold">
                    {log.status || 'ERR'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LogListTab;
