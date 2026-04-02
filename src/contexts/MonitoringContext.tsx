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
import { Notification, RequestLog } from '../types';

interface MonitoringContextType {
  lastResponseTime: number;
  logs: RequestLog[];
  clearLogs: () => void;
  addToast: (notification: Notification) => void;
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(
  undefined
);

const MAX_LOGS = 500;

export const sanitiseToastDetail = (detail: string): string =>
  detail
    .replace(/ \| requestId=\S+/g, '')
    .replace(/ \| type=\S+/g, '')
    .trim();

export const MonitoringProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [lastResponseTime, setLastResponseTime] = useState(0);
  const [toasts, setToasts] = useState<Notification[]>([]);

  const pendingLogsRef = useRef<RequestLog[]>([]);

  useEffect(() => {
    const unsubscribe = naviqoreService.subscribe((log: RequestLog) => {
      pendingLogsRef.current.push(log);
      if (log.status >= 400 || log.status === 0) {
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
    }),
    [lastResponseTime, logs]
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
