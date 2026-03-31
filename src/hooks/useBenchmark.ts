import React, { useCallback, useEffect, useRef, useState } from 'react';

import { DEFAULT_MAP_CENTER } from '../constants';
import { useDomain } from '../contexts/DomainContext';
import { naviqoreService } from '../services/naviqoreService';
import {
  BenchmarkConfig,
  BenchmarkStats,
  QueryConfig,
  Stop,
  TimeType,
  TransportMode,
} from '../types';

const MAX_BM_LOGS = 150;
const MAX_HISTORY = 60;
const STATS_WINDOW_MS = 5000;

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

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

const gaussianRandom = (mean: number, stdev: number) => {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
};

export interface BenchmarkState {
  isRunning: boolean;
  isPreloading: boolean;
  config: BenchmarkConfig;
  stats: BenchmarkStats;
  logs: { time: string; msg: string; type: 'info' | 'success' | 'error' }[];
  latencyHistory: number[];
}

export interface UseBenchmarkReturn {
  benchmarkState: BenchmarkState;
  setBenchmarkConfig: React.Dispatch<React.SetStateAction<BenchmarkConfig>>;
  toggleBenchmark: () => Promise<void>;
  clearBenchmarkLogs: () => void;
}

export const useBenchmark = (): UseBenchmarkReturn => {
  const { serverInfo } = useDomain();

  const [config, setConfig] = useState<BenchmarkConfig>({
    concurrency: 5,
    delayMs: 100,
    timeWindowDuration: 0,
    scenario: 'real_life',
    fixedDate: new Date().toISOString().split('T')[0],
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);

  const [stats, setStats] = useState<BenchmarkStats>({
    totalSent: 0,
    totalSuccess: 0,
    totalError: 0,
    currentRps: 0,
    avgLatency: 0,
    minLatency: 0,
    maxLatency: 0,
    errors: [],
  });

  const [logs, setLogs] = useState<
    { time: string; msg: string; type: 'info' | 'success' | 'error' }[]
  >([]);
  const [latencyHistory, setLatencyHistory] = useState<number[]>(
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

  const configRef = useRef(config);
  const serverInfoRef = useRef(serverInfo);

  useEffect(() => {
    serverInfoRef.current = serverInfo;
  }, [serverInfo]);

  const addLog = useCallback(
    (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
      const time = new Date().toLocaleTimeString('en-GB', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLogs((prev) => {
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

    setIsPreloading(true);
    addLog('Fetching stops for test queries...', 'info');

    const pool: Stop[] = [];

    try {
      const autocompleteResults = await Promise.all(
        SEED_CITIES.map((city) => naviqoreService.autocompleteStops(city))
      );
      autocompleteResults.forEach((res) => {
        if (res.data && Array.isArray(res.data)) pool.push(...res.data);
      });
    } catch {
      addLog('Autocomplete seed fetch failed.', 'error');
    }

    if (pool.length === 0) {
      addLog('Seed cities returned no stops, trying nearest stops...', 'info');
      try {
        const nearestRes = await naviqoreService.getNearestStops(
          DEFAULT_MAP_CENTER[0],
          DEFAULT_MAP_CENTER[1]
        );
        if (nearestRes.data && Array.isArray(nearestRes.data)) {
          nearestRes.data.forEach((ds) => pool.push(ds.stop));
        }
      } catch {
        addLog('Nearest-stops fallback also failed.', 'error');
      }
    }

    const unique = Array.from(new Map(pool.map((s) => [s.id, s])).values());
    stopsRef.current = unique;

    if (unique.length > 0) {
      addLog(`Pool ready with ${unique.length} stops.`, 'success');
    } else {
      addLog(
        'Stop pool is empty — the benchmark cannot run. Check that the backend has valid stop data.',
        'error'
      );
    }

    setIsPreloading(false);
  }, [addLog]);

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
          addLog(`Request Failed: ${toErrorMessage(error)}`, 'error');
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
  }, [addLog, generateRandomRequest]);

  const toggleBenchmark = useCallback(async () => {
    if (isRunning) {
      runningRef.current = false;
      setIsRunning(false);
      addLog('Stopping benchmark...', 'info');
    } else {
      if (stopsRef.current.length === 0) await preloadStops();
      if (stopsRef.current.length === 0) {
        addLog('No stops available.', 'error');
        return;
      }

      setStats({
        totalSent: 0,
        totalSuccess: 0,
        totalError: 0,
        currentRps: 0,
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        errors: [],
      });
      setLatencyHistory(new Array(MAX_HISTORY).fill(0));
      historyRef.current = [];
      lifetimeStatsRef.current = {
        sent: 0,
        success: 0,
        error: 0,
        lastError: '',
      };

      runningRef.current = true;
      setIsRunning(true);
      addLog('Starting benchmark...', 'success');
      for (let i = 0; i < configRef.current.concurrency; i++) runWorker();
    }
  }, [isRunning, addLog, preloadStops, runWorker]);

  useEffect(() => {
    configRef.current = config;
    if (isRunning) {
      const current = activeWorkers.current;
      const target = config.concurrency;
      if (target > current) {
        for (let i = 0; i < target - current; i++) runWorker();
      }
      addLog(
        `Config Update: ${config.scenario} | ${config.concurrency} threads`,
        'info'
      );
    }
  }, [config, isRunning, runWorker, addLog]);

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

      setStats({
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
      setLatencyHistory((prev) => [...prev.slice(1), avgLat || 0]);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const clearBenchmarkLogs = useCallback(() => {
    setLogs([]);
    setStats({
      totalSent: 0,
      totalSuccess: 0,
      totalError: 0,
      currentRps: 0,
      avgLatency: 0,
      minLatency: 0,
      maxLatency: 0,
      errors: [],
    });
    setLatencyHistory(new Array(MAX_HISTORY).fill(0));
    historyRef.current = [];
    lifetimeStatsRef.current = {
      sent: 0,
      success: 0,
      error: 0,
      lastError: '',
    };
  }, []);

  return {
    benchmarkState: {
      isRunning,
      isPreloading,
      config,
      stats,
      logs,
      latencyHistory,
    },
    setBenchmarkConfig: setConfig,
    toggleBenchmark,
    clearBenchmarkLogs,
  };
};
