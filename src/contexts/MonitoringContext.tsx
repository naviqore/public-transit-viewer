import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';

import { useDomain } from './DomainContext';
import Toast from '../components/Toast';
import { naviqoreService } from '../services/naviqoreService';
import {
  BenchmarkConfig,
  BenchmarkStats,
  Notification,
  QueryConfig,
  RequestLog,
  Stop,
  TimeType,
  TransportMode,
} from '../types';

interface MonitoringContextType {
  lastResponseTime: number;
  logs: RequestLog[];
  clearLogs: () => void;
  addToast: (notification: Notification) => void;

  benchmarkState: {
    isRunning: boolean;
    isPreloading: boolean;
    config: BenchmarkConfig;
    stats: BenchmarkStats;
    logs: { time: string; msg: string; type: 'info' | 'success' | 'error' }[];
    latencyHistory: number[];
  };
  setBenchmarkConfig: React.Dispatch<React.SetStateAction<BenchmarkConfig>>;
  toggleBenchmark: () => Promise<void>;
  clearBenchmarkLogs: () => void;
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(
  undefined
);

const MAX_LOGS = 500;
const MAX_BM_LOGS = 150;
const SEED_CITIES = [
  'Zürich',
  'Bern',
  'Basel',
  'Genève',
  'Lausanne',
  'Lugano',
  'Luzern',
  'St. Gallen',
  'Winterthur',
  'Biel/Bienne',
];
const MAX_HISTORY = 60;
const STATS_WINDOW_MS = 5000;

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

export const sanitiseToastDetail = (detail: string): string =>
  detail
    .replace(/ \| requestId=\S+/g, '')
    .replace(/ \| type=\S+/g, '')
    .trim();

const gaussianRandom = (mean: number, stdev: number) => {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
};

export const MonitoringProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { serverInfo } = useDomain();

  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [lastResponseTime, setLastResponseTime] = useState(0);
  const [toasts, setToasts] = useState<Notification[]>([]);

  const pendingLogsRef = useRef<RequestLog[]>([]);

  const [bmConfig, setBmConfig] = useState<BenchmarkConfig>({
    concurrency: 5,
    delayMs: 100,
    timeWindowDuration: 0,
    scenario: 'real_life',
    fixedDate: new Date().toISOString().split('T')[0],
  });
  const [bmIsRunning, setBmIsRunning] = useState(false);
  const [bmIsPreloading, setBmIsPreloading] = useState(false);

  const [bmStats, setBmStats] = useState<BenchmarkStats>({
    totalSent: 0,
    totalSuccess: 0,
    totalError: 0,
    currentRps: 0,
    avgLatency: 0,
    minLatency: 0,
    maxLatency: 0,
    errors: [],
  });

  const [bmLogs, setBmLogs] = useState<
    { time: string; msg: string; type: 'info' | 'success' | 'error' }[]
  >([]);
  const [bmLatencyHistory, setBmLatencyHistory] = useState<number[]>(
    new Array(MAX_HISTORY).fill(0)
  );

  const runningRef = useRef(false);
  const stopsRef = useRef<Stop[]>([]);
  const activeWorkers = useRef(0);

  const historyRef = useRef<{ ts: number; lat: number; err: boolean }[]>([]);
  const lifetimeStatsRef = useRef({
    sent: 0,
    success: 0,
    error: 0,
    lastError: '',
  });

  const configRef = useRef(bmConfig);
  const serverInfoRef = useRef(serverInfo);

  useEffect(() => {
    serverInfoRef.current = serverInfo;
  }, [serverInfo]);

  const addBmLog = useCallback(
    (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
      const time = new Date().toLocaleTimeString('en-GB', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setBmLogs((prev) => {
        const newLogs = [...prev, { time, msg, type }];
        return newLogs.length > MAX_BM_LOGS
          ? newLogs.slice(-MAX_BM_LOGS)
          : newLogs;
      });
    },
    []
  );

  const preloadStops = useCallback(async () => {
    if (stopsRef.current.length > 0) return;

    setBmIsPreloading(true);
    addBmLog('Fetching stops for test queries...', 'info');

    const pool: Stop[] = [];
    const promises = SEED_CITIES.map((city) =>
      naviqoreService.autocompleteStops(city)
    );

    try {
      const results = await Promise.all(promises);
      results.forEach((res) => {
        if (res.data && Array.isArray(res.data)) pool.push(...res.data);
      });

      const unique = Array.from(new Map(pool.map((s) => [s.id, s])).values());
      stopsRef.current = unique;
      if (unique.length > 0)
        addBmLog(`Pool ready with ${unique.length} stops.`, 'success');
      else addBmLog('Warning: Stop pool is empty.', 'error');
    } catch {
      addBmLog('Failed to preload stops. Using fallback.', 'error');
    } finally {
      setBmIsPreloading(false);
    }
  }, [addBmLog]);

  const generateRandomRequest = useCallback(() => {
    const currentConfig = configRef.current;
    const pool = stopsRef.current;
    if (pool.length === 0) return null;

    const from = pool[Math.floor(Math.random() * pool.length)];
    let to = pool[Math.floor(Math.random() * pool.length)];
    while (to.id === from.id && pool.length > 1)
      to = pool[Math.floor(Math.random() * pool.length)];

    const queryConfig: QueryConfig = {
      wheelchairAccessible: false,
      bikeAllowed: false,
      travelModes: Object.values(TransportMode),
      maxTransfers: undefined,
      maxWalkDuration: undefined,
      minTransferDuration: undefined,
      maxTravelDuration: undefined,
      timeWindowDuration: currentConfig.timeWindowDuration,
    };

    const now = Date.now();
    let startLimit = now - 86400000;
    let endLimit = now + 365 * 24 * 3600 * 1000;

    if (serverInfoRef.current.schedule?.scheduleValidity) {
      const validity = serverInfoRef.current.schedule.scheduleValidity;
      startLimit = new Date(validity.startDate).getTime();
      endLimit = new Date(validity.endDate).getTime() + 24 * 3600 * 1000;
    }

    let dateStr: string;
    let timeType: TimeType;

    if (currentConfig.scenario === 'fixed') {
      const fixedDate = currentConfig.fixedDate
        ? new Date(currentConfig.fixedDate)
        : new Date();
      fixedDate.setHours(0, 0, 0, 0);
      dateStr = new Date(
        fixedDate.getTime() + Math.random() * 86400000
      ).toISOString();
      timeType = TimeType.DEPARTURE;
    } else {
      const stdDev = 4 * 60 * 60 * 1000;
      const offset =
        currentConfig.scenario === 'real_life'
          ? Math.abs(gaussianRandom(0, stdDev))
          : Math.random() * (endLimit - startLimit);
      const targetTime =
        currentConfig.scenario === 'real_life'
          ? now + offset
          : startLimit + offset;
      dateStr = new Date(
        Math.max(startLimit, Math.min(endLimit, targetTime))
      ).toISOString();
      timeType = Math.random() > 0.5 ? TimeType.ARRIVAL : TimeType.DEPARTURE;

      const caps = serverInfoRef.current.routing;
      if (caps?.supportsAccessibility)
        queryConfig.wheelchairAccessible = Math.random() > 0.5;
      if (caps?.supportsBikes) queryConfig.bikeAllowed = Math.random() > 0.5;
      if (caps?.supportsMaxTransfers)
        queryConfig.maxTransfers =
          Math.random() > 0.5 ? Math.floor(Math.random() * 6) : undefined;
      if (caps?.supportsMaxWalkDuration)
        queryConfig.maxWalkDuration =
          Math.random() > 0.5 ? Math.floor(Math.random() * 60) : undefined;
      if (caps?.supportsTravelModes) {
        const allModes = Object.values(TransportMode);
        queryConfig.travelModes =
          Math.random() > 0.5
            ? allModes.filter(() => Math.random() > 0.5)
            : [allModes[Math.floor(Math.random() * allModes.length)]];
      }
    }
    return { from, to, dateStr, queryConfig, timeType };
  }, []);

  const runWorker = useCallback(async () => {
    activeWorkers.current++;
    await new Promise((r) => setTimeout(r, Math.random() * 1000));

    while (runningRef.current) {
      if (activeWorkers.current > configRef.current.concurrency) {
        activeWorkers.current--;
        return;
      }

      const req = generateRandomRequest();
      if (!req) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      const start = performance.now();
      try {
        await naviqoreService.getConnections(
          req.from.id,
          req.to.id,
          req.dateStr,
          req.timeType,
          req.queryConfig
        );
        historyRef.current.push({
          ts: Date.now(),
          lat: performance.now() - start,
          err: false,
        });
        lifetimeStatsRef.current.success++;
      } catch (error) {
        historyRef.current.push({ ts: Date.now(), lat: 0, err: true });
        lifetimeStatsRef.current.error++;
        lifetimeStatsRef.current.lastError = toErrorMessage(error);
        if (lifetimeStatsRef.current.error < 5)
          addBmLog(`Request Failed: ${toErrorMessage(error)}`, 'error');
      }

      const currentDelay = configRef.current.delayMs;
      if (currentDelay > 0) {
        await new Promise((r) =>
          setTimeout(
            r,
            Math.max(
              0,
              currentDelay + currentDelay * 0.2 * (Math.random() - 0.5)
            )
          )
        );
      }
      lifetimeStatsRef.current.sent++;
    }
    activeWorkers.current--;
  }, [addBmLog, generateRandomRequest]);

  const toggleBenchmark = useCallback(async () => {
    if (bmIsRunning) {
      runningRef.current = false;
      setBmIsRunning(false);
      addBmLog('Stopping benchmark...', 'info');
    } else {
      if (stopsRef.current.length === 0) await preloadStops();
      if (stopsRef.current.length === 0) {
        addBmLog('No stops available.', 'error');
        return;
      }

      setBmStats({
        totalSent: 0,
        totalSuccess: 0,
        totalError: 0,
        currentRps: 0,
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        errors: [],
      });
      setBmLatencyHistory(new Array(MAX_HISTORY).fill(0));
      historyRef.current = [];
      lifetimeStatsRef.current = {
        sent: 0,
        success: 0,
        error: 0,
        lastError: '',
      };

      runningRef.current = true;
      setBmIsRunning(true);
      addBmLog('Starting benchmark...', 'success');
      for (let i = 0; i < configRef.current.concurrency; i++) runWorker();
    }
  }, [bmIsRunning, addBmLog, preloadStops, runWorker]);

  useEffect(() => {
    configRef.current = bmConfig;
    if (bmIsRunning) {
      const current = activeWorkers.current;
      const target = bmConfig.concurrency;
      if (target > current) {
        for (let i = 0; i < target - current; i++) runWorker();
      }
      addBmLog(
        `Config Update: ${bmConfig.scenario} | ${bmConfig.concurrency} threads`,
        'info'
      );
    }
  }, [bmConfig, bmIsRunning, runWorker, addBmLog]);

  useEffect(() => {
    const unsubscribe = naviqoreService.subscribe((log: RequestLog) => {
      pendingLogsRef.current.push(log);
      if ((log.status >= 400 || log.status === 0) && !runningRef.current) {
        setToasts((prev) => [
          {
            id: crypto.randomUUID(),
            type: 'error',
            message:
              log.status === 0 ? 'Network Failed' : `API Error ${log.status}`,
            details: log.error
              ? sanitiseToastDetail(log.error)
              : 'Unknown error',
          },
          ...prev,
        ]);
      }
    });

    const flushInterval = setInterval(() => {
      if (pendingLogsRef.current.length > 0) {
        const newLogs = pendingLogsRef.current;
        pendingLogsRef.current = [];
        setLogs((prev) => [...prev, ...newLogs].slice(-MAX_LOGS));
        setLastResponseTime(newLogs[newLogs.length - 1].duration);
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(flushInterval);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!runningRef.current) return;
      const now = Date.now();
      const windowStart = now - STATS_WINDOW_MS;
      historyRef.current = historyRef.current.filter(
        (pt) => pt.ts >= windowStart
      );

      const validWindow = historyRef.current;
      const success = validWindow.filter((pt) => !pt.err);
      const avgLat =
        success.length > 0
          ? success.reduce((acc, pt) => acc + pt.lat, 0) / success.length
          : 0;

      setBmStats({
        totalSent: lifetimeStatsRef.current.sent,
        totalSuccess: lifetimeStatsRef.current.success,
        totalError: lifetimeStatsRef.current.error,
        currentRps:
          Math.round((validWindow.length / (STATS_WINDOW_MS / 1000)) * 10) / 10,
        avgLatency: avgLat,
        minLatency:
          success.length > 0 ? Math.min(...success.map((p) => p.lat)) : 0,
        maxLatency:
          success.length > 0 ? Math.max(...success.map((p) => p.lat)) : 0,
        errors: lifetimeStatsRef.current.lastError
          ? [lifetimeStatsRef.current.lastError]
          : [],
      });
      setBmLatencyHistory((prev) => [...prev.slice(1), avgLat || 0]);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const value = useMemo(
    () => ({
      lastResponseTime,
      logs,
      clearLogs: () => {
        setLogs([]);
        pendingLogsRef.current = [];
      },
      addToast: (notification: Notification) =>
        setToasts((prev) => [notification, ...prev]),
      benchmarkState: {
        isRunning: bmIsRunning,
        isPreloading: bmIsPreloading,
        config: bmConfig,
        stats: bmStats,
        logs: bmLogs,
        latencyHistory: bmLatencyHistory,
      },
      setBenchmarkConfig: setBmConfig,
      toggleBenchmark,
      clearBenchmarkLogs: () => {
        setBmLogs([]);
        setBmStats({
          totalSent: 0,
          totalSuccess: 0,
          totalError: 0,
          currentRps: 0,
          avgLatency: 0,
          minLatency: 0,
          maxLatency: 0,
          errors: [],
        });
        setBmLatencyHistory(new Array(MAX_HISTORY).fill(0));
        historyRef.current = [];
        lifetimeStatsRef.current = {
          sent: 0,
          success: 0,
          error: 0,
          lastError: '',
        };
      },
    }),
    [
      lastResponseTime,
      logs,
      bmIsRunning,
      bmIsPreloading,
      bmConfig,
      bmStats,
      bmLogs,
      bmLatencyHistory,
      toggleBenchmark,
    ]
  );

  return (
    <MonitoringContext.Provider value={value}>
      {children}
      <div className="fixed bottom-24 md:bottom-6 inset-x-0 z-[9999] flex flex-col-reverse items-center gap-2 pointer-events-none px-4">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            notification={toast}
            onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
          />
        ))}
      </div>
    </MonitoringContext.Provider>
  );
};

export const useMonitoring = () => {
  const context = useContext(MonitoringContext);
  if (!context)
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  return context;
};
