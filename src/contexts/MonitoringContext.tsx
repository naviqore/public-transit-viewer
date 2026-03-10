import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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
import { useDomain } from './DomainContext';

interface MonitoringContextType {
  lastResponseTime: number;
  logs: RequestLog[];
  clearLogs: () => void;
  addToast: (notification: Notification) => void;

  // Benchmark Interface
  benchmarkState: {
    isRunning: boolean;
    isPreloading: boolean;
    config: BenchmarkConfig;
    stats: BenchmarkStats;
    logs: { time: string; msg: string; type: 'info' | 'success' | 'error' }[];
    latencyHistory: number[];
  };
  setBenchmarkConfig: React.Dispatch<React.SetStateAction<BenchmarkConfig>>;
  toggleBenchmark: () => void;
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
const STATS_WINDOW_MS = 5000; // 5 Second Rolling Window for Stats

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

// Box-Muller transform for Gaussian distribution
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

  useEffect(() => {
    configRef.current = bmConfig;
    if (bmIsRunning) {
      const current = activeWorkers.current;
      const target = bmConfig.concurrency;
      if (target > current) {
        const toAdd = target - current;
        for (let i = 0; i < toAdd; i++) {
          runWorker();
        }
      }
      const summary = `Config Update: ${bmConfig.scenario.toUpperCase().replace('_', ' ')} | ${bmConfig.concurrency} threads | ${bmConfig.delayMs}ms delay | ${bmConfig.timeWindowDuration}m window`;
      addBmLog(summary, 'info');
    }
  }, [bmConfig, bmIsRunning]);

  useEffect(() => {
    const unsubscribe = naviqoreService.subscribe((log: RequestLog) => {
      pendingLogsRef.current.push(log);

      if ((log.status >= 400 || log.status === 0) && !runningRef.current) {
        const notification: Notification = {
          id: crypto.randomUUID(),
          type: 'error',
          message:
            log.status === 0
              ? 'Network Request Failed'
              : `API Error ${log.status}`,
          details: log.error || `Failed to fetch ${log.url}`,
        };
        setToasts((prev) => [notification, ...prev]);
      }
    });

    const flushInterval = setInterval(() => {
      if (pendingLogsRef.current.length > 0) {
        const newLogs = pendingLogsRef.current;
        pendingLogsRef.current = [];

        setLogs((prev) => {
          const updated = [...prev, ...newLogs];
          if (updated.length > MAX_LOGS) {
            return updated.slice(updated.length - MAX_LOGS);
          }
          return updated;
        });

        if (newLogs.length > 0) {
          setLastResponseTime(newLogs[newLogs.length - 1].duration);
        }
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(flushInterval);
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
    pendingLogsRef.current = [];
  };

  const addToast = (notification: Notification) =>
    setToasts((prev) => [notification, ...prev]);
  const dismissToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));
  const clearBenchmarkLogs = () => {
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
    lifetimeStatsRef.current = { sent: 0, success: 0, error: 0, lastError: '' };
  };

  const addBmLog = (
    msg: string,
    type: 'info' | 'success' | 'error' = 'info'
  ) => {
    const time = new Date().toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setBmLogs((prev) => {
      const newLogs = [...prev, { time, msg, type }];
      if (newLogs.length > MAX_BM_LOGS) {
        return newLogs.slice(-MAX_BM_LOGS);
      }
      return newLogs;
    });
  };

  /** Fetches a pool of stops from SEED_CITIES so benchmark workers have real stop IDs to query. */
  const preloadStops = async () => {
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
        if (res.data && Array.isArray(res.data)) {
          pool.push(...res.data);
        }
      });

      const unique = Array.from(new Map(pool.map((s) => [s.id, s])).values());
      stopsRef.current = unique;
      if (unique.length > 0) {
        addBmLog(`Pool ready with ${unique.length} stops.`, 'success');
      } else {
        addBmLog(
          'Warning: Stop pool is empty. Autocomplete might be failing.',
          'error'
        );
      }
    } catch {
      addBmLog('Failed to preload stops. Using fallback.', 'error');
    } finally {
      setBmIsPreloading(false);
    }
  };

  const getRandomStop = () => {
    const pool = stopsRef.current;
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  /**
   * Builds a randomised routing request based on the current benchmark scenario.
   * Returns `null` when the stop pool is empty.
   */
  const generateRandomRequest = () => {
    const currentConfig = configRef.current;
    const serverInfo = serverInfoRef.current;
    const caps = serverInfo.routing;
    const scheduleValidity = serverInfo.schedule?.scheduleValidity;

    const from = getRandomStop();
    let to = getRandomStop();
    while (to?.id === from?.id && stopsRef.current.length > 1) {
      to = getRandomStop();
    }

    if (!from || !to) return null;

    const scenario = currentConfig.scenario;

    let dateStr: string;
    let timeType: TimeType;
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

    if (scheduleValidity) {
      startLimit = new Date(scheduleValidity.startDate).getTime();
      endLimit =
        new Date(scheduleValidity.endDate).getTime() + 24 * 3600 * 1000;
    }

    if (scenario === 'fixed') {
      const fixedDate = currentConfig.fixedDate
        ? new Date(currentConfig.fixedDate)
        : new Date();
      const randomTimeMs = Math.random() * 24 * 60 * 60 * 1000;
      fixedDate.setHours(0, 0, 0, 0);
      const targetTime = fixedDate.getTime() + randomTimeMs;
      dateStr = new Date(targetTime).toISOString();
      timeType = TimeType.DEPARTURE;
    } else if (scenario === 'real_life') {
      const stdDev = 4 * 60 * 60 * 1000;
      const offset = Math.abs(gaussianRandom(0, stdDev));
      let targetTime = now + offset;
      if (targetTime < startLimit) targetTime = startLimit;
      if (targetTime > endLimit) targetTime = endLimit;
      dateStr = new Date(targetTime).toISOString();
      timeType = Math.random() > 0.9 ? TimeType.ARRIVAL : TimeType.DEPARTURE;
      if (caps?.supportsAccessibility)
        queryConfig.wheelchairAccessible = Math.random() < 0.02;
      if (caps?.supportsBikes) queryConfig.bikeAllowed = Math.random() < 0.02;
      if (caps?.supportsTravelModes && Math.random() > 0.9) {
        const allModes = Object.values(TransportMode);
        const selectedModes = allModes.filter(() => Math.random() > 0.5);
        queryConfig.travelModes =
          selectedModes.length > 0 ? selectedModes : [TransportMode.RAIL];
      }
      if (caps?.supportsMaxTransfers && Math.random() < 0.05)
        queryConfig.maxTransfers = 1 + Math.floor(Math.random() * 3);
    } else {
      const randomTs = startLimit + Math.random() * (endLimit - startLimit);
      dateStr = new Date(randomTs).toISOString();
      timeType = Math.random() > 0.5 ? TimeType.ARRIVAL : TimeType.DEPARTURE;
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
        const selectedModes = allModes.filter(() => Math.random() > 0.5);
        queryConfig.travelModes =
          selectedModes.length > 0
            ? selectedModes
            : [allModes[Math.floor(Math.random() * allModes.length)]];
      }
    }
    return { from, to, dateStr, queryConfig, timeType };
  };

  /**
   * Long-running async loop that fires routing requests until `runningRef` is false.
   * Respects the configured concurrency ceiling and per-request delay with ±20 % jitter.
   */
  const runWorker = async () => {
    activeWorkers.current++;
    const randomStartDelay = Math.random() * 1000;
    await new Promise((r) => setTimeout(r, randomStartDelay));

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
        const duration = performance.now() - start;

        // Push to history ref (no state update)
        historyRef.current.push({ ts: Date.now(), lat: duration, err: false });
        lifetimeStatsRef.current.sent++;
        lifetimeStatsRef.current.success++;
      } catch (error: unknown) {
        historyRef.current.push({ ts: Date.now(), lat: 0, err: true });
        lifetimeStatsRef.current.sent++;
        lifetimeStatsRef.current.error++;
        lifetimeStatsRef.current.lastError = toErrorMessage(error);

        if (lifetimeStatsRef.current.error < 5) {
          addBmLog(
            `Request Failed: ${toErrorMessage(error) || 'Unknown Error'}`,
            'error'
          );
        }
      }

      const currentDelay = configRef.current.delayMs;
      if (currentDelay > 0) {
        const jitter = currentDelay * 0.2 * (Math.random() - 0.5);
        const actualDelay = Math.max(0, currentDelay + jitter);
        await new Promise((r) => setTimeout(r, actualDelay));
      }
    }
    activeWorkers.current--;
  };

  const toggleBenchmark = async () => {
    if (bmIsRunning) {
      runningRef.current = false;
      setBmIsRunning(false);
      addBmLog('Stopping benchmark...', 'info');
    } else {
      if (stopsRef.current.length === 0) {
        await preloadStops();
      }
      if (stopsRef.current.length === 0) {
        addBmLog('Cannot start: No stops available.', 'error');
        return;
      }

      // Reset Stats
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
      const labels: Record<string, string> = {
        fixed: 'Fixed Date',
        real_life: 'Real Life',
        random: 'Stress Test',
      };
      addBmLog(`Starting ${labels[bmConfig.scenario]} benchmark...`, 'success');

      for (let i = 0; i < bmConfig.concurrency; i++) {
        runWorker();
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!runningRef.current) return;

      const now = Date.now();
      const windowStart = now - STATS_WINDOW_MS;

      const history = historyRef.current;
      let validIndex = 0;

      // Simple heuristic: if array is huge, this might slow down,
      // but at 100 RPS * 5s = 500 items, loop is trivial.
      while (
        validIndex < history.length &&
        history[validIndex].ts < windowStart
      ) {
        validIndex++;
      }
      if (validIndex > 0) {
        historyRef.current = history.slice(validIndex);
      }

      const validWindow = historyRef.current;

      let sumLat = 0;
      let minLat = Infinity;
      let maxLat = 0;
      let successCount = 0;

      validWindow.forEach((pt) => {
        if (!pt.err) {
          sumLat += pt.lat;
          minLat = Math.min(minLat, pt.lat);
          maxLat = Math.max(maxLat, pt.lat);
          successCount++;
        }
      });

      const avgLat = successCount > 0 ? sumLat / successCount : 0;
      // RPS is request count in window divided by window size (or actual elapsed if < window)
      // To be responsive at start, we divide by elapsed since start or window size
      const rps = validWindow.length / (STATS_WINDOW_MS / 1000);

      setBmStats({
        totalSent: lifetimeStatsRef.current.sent,
        totalSuccess: lifetimeStatsRef.current.success,
        totalError: lifetimeStatsRef.current.error,
        currentRps: Math.round(rps * 10) / 10,
        avgLatency: avgLat,
        minLatency: minLat === Infinity ? 0 : minLat,
        maxLatency: maxLat,
        errors: lifetimeStatsRef.current.lastError
          ? [lifetimeStatsRef.current.lastError]
          : [],
      });

      setBmLatencyHistory((prev) => [...prev.slice(1), avgLat || 0]);
    }, 500); // Update UI at 2 FPS

    return () => clearInterval(interval);
  }, []);

  const value = useMemo(
    () => ({
      lastResponseTime,
      logs,
      clearLogs,
      addToast,
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
      clearBenchmarkLogs,
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
    ]
  );

  return (
    <MonitoringContext.Provider value={value}>
      {children}
      <div className="fixed bottom-24 md:bottom-6 inset-x-0 z-[9999] flex flex-col-reverse items-center gap-2 pointer-events-none px-4">
        {toasts.map((toast) => (
          <Toast key={toast.id} notification={toast} onDismiss={dismissToast} />
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
