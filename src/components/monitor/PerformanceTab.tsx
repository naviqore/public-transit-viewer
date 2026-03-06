import React, { useMemo } from 'react';
import { Activity, BarChart3, Database, Zap } from 'lucide-react';
import { RequestLog } from '../../types';
import Sparkline from './Sparkline';

interface PerformanceTabProps {
  logs: RequestLog[];
}

interface EndpointStats {
  method: string;
  path: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  errorRate: number;
  lastAccessed: Date;
  history: number[];
}

const normalizeUrlPath = (path: string): string => {
  const normalized = path.replace(/\/+$/, '');
  if (normalized === '/schedule') return '/schedule';
  if (normalized.startsWith('/schedule/stops/autocomplete'))
    return '/schedule/stops/autocomplete';
  if (normalized.startsWith('/schedule/stops/nearest'))
    return '/schedule/stops/nearest';
  if (/^\/schedule\/stops\/[^/]+\/times$/.test(normalized))
    return '/schedule/stops/{id}/times';
  if (/^\/schedule\/stops\/[^/]+$/.test(normalized))
    return '/schedule/stops/{id}';
  if (normalized === '/routing') return '/routing';
  if (normalized.startsWith('/routing/connections'))
    return '/routing/connections';
  if (normalized.startsWith('/routing/isolines')) return '/routing/isolines';
  return normalized.replace(/\/(\d{4,}|[a-f0-9-]{10,})/g, '/{id}');
};

const aggregateLogs = (logs: RequestLog[]): EndpointStats[] => {
  const map = new Map<string, EndpointStats>();
  logs.forEach((log) => {
    if (log.url === 'SYSTEM') return;
    let pathStr = log.url;
    try {
      if (pathStr.includes('://')) {
        const urlObj = new URL(pathStr);
        if (urlObj.protocol.toLowerCase() === 'mock:') {
          pathStr = '/' + urlObj.host + urlObj.pathname;
        } else {
          pathStr = urlObj.pathname;
        }
      } else {
        pathStr = pathStr.split('?')[0];
      }
    } catch {
      pathStr = pathStr.split('?')[0];
    }
    pathStr = pathStr.replace(/\/+/g, '/');
    if (!pathStr.startsWith('/')) pathStr = '/' + pathStr;
    const normalizedPath = normalizeUrlPath(pathStr);
    const key = `${log.method}:${normalizedPath}`;
    if (!map.has(key)) {
      map.set(key, {
        method: log.method,
        path: normalizedPath,
        count: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errorRate: 0,
        lastAccessed: log.timestamp,
        history: [],
      });
    }
    const stat = map.get(key)!;
    const isError = log.status >= 400 || log.status === 0;
    stat.count++;
    stat.avgDuration =
      stat.avgDuration + (log.duration - stat.avgDuration) / stat.count;
    stat.minDuration = Math.min(stat.minDuration, log.duration);
    stat.maxDuration = Math.max(stat.maxDuration, log.duration);
    if (isError) stat.errorRate++;
    if (log.timestamp > stat.lastAccessed) stat.lastAccessed = log.timestamp;
    stat.history.push(log.duration);
    if (stat.history.length > 20) stat.history.shift();
  });
  for (const stat of map.values()) {
    stat.errorRate = stat.errorRate / stat.count;
  }
  return Array.from(map.values()).sort(
    (a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime()
  );
};

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

const PerformanceTab: React.FC<PerformanceTabProps> = ({ logs }) => {
  const stats = useMemo(() => aggregateLogs(logs), [logs]);
  const totalReq = logs.filter((l) => l.url !== 'SYSTEM').length;
  const globalAvg =
    totalReq > 0
      ? logs.reduce(
          (acc, l) => acc + (l.url !== 'SYSTEM' ? l.duration : 0),
          0
        ) / totalReq
      : 0;
  const globalErr =
    totalReq > 0
      ? (logs.filter((l) => l.status >= 400 || l.status === 0).length /
          totalReq) *
        100
      : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-3 gap-2 p-2 md:p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-10 shadow-sm">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 md:p-3 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="p-1.5 md:p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Database size={16} />
          </div>
          <div>
            <div className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
              Total Requests
            </div>
            <div className="text-base md:text-lg font-mono text-slate-900 dark:text-white leading-none mt-0.5">
              {totalReq}
            </div>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 md:p-3 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div
            className={`p-1.5 md:p-2 rounded-full ${globalAvg > 500 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}
          >
            <Zap size={16} />
          </div>
          <div>
            <div className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
              Avg Latency
            </div>
            <div className="text-base md:text-lg font-mono text-slate-900 dark:text-white leading-none mt-0.5">
              {Math.round(globalAvg)}ms
            </div>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 md:p-3 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div
            className={`p-1.5 md:p-2 rounded-full ${globalErr > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}
          >
            <Activity size={16} />
          </div>
          <div>
            <div className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
              Error Rate
            </div>
            <div className="text-base md:text-lg font-mono text-slate-900 dark:text-white leading-none mt-0.5">
              {globalErr.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-1">
          Endpoint Performance
        </h3>
        {stats.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            message="No performance data collected yet."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.method + stat.path}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex flex-col gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${stat.method === 'GET' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' : 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300'}`}
                      >
                        {stat.method}
                      </span>
                      <span
                        className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate block w-full"
                        title={stat.path}
                      >
                        {stat.path}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {stat.count} reqs &bull;{' '}
                      {stat.lastAccessed.toLocaleTimeString('en-GB', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-base font-mono font-bold ${stat.avgDuration > 500 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                    >
                      {Math.round(stat.avgDuration)}ms
                    </div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">
                      Avg
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700/50">
                  <div className="flex gap-4">
                    <div>
                      <div className="text-slate-400 text-[9px] uppercase font-bold">
                        Min
                      </div>
                      <div className="font-mono text-xs text-slate-700 dark:text-slate-300">
                        {Math.round(stat.minDuration)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[9px] uppercase font-bold">
                        Max
                      </div>
                      <div className="font-mono text-xs text-slate-700 dark:text-slate-300">
                        {Math.round(stat.maxDuration)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[9px] uppercase font-bold">
                        OK
                      </div>
                      <div
                        className={`font-mono text-xs font-bold ${stat.errorRate > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                      >
                        {((1 - stat.errorRate) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 max-w-[120px] flex justify-end">
                    <Sparkline
                      data={stat.history}
                      max={Math.max(stat.maxDuration, 100)}
                      height={16}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceTab;
