import React from 'react';
import { RequestLog } from '../types';
import BenchmarkTab from './BenchmarkTab';
import LogListTab from './monitor/LogListTab';
import PerformanceTab from './monitor/PerformanceTab';
import { DISABLE_BENCHMARK } from '../constants';

interface SystemMonitorPanelProps {
  logs: RequestLog[];
  activeTab: 'logs' | 'performance' | 'benchmark';
}

const SystemMonitorPanel: React.FC<SystemMonitorPanelProps> = ({
  logs,
  activeTab,
}) => {
  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {activeTab === 'logs' && <LogListTab logs={logs} />}
      {activeTab === 'performance' && <PerformanceTab logs={logs} />}
      {activeTab === 'benchmark' && !DISABLE_BENCHMARK && <BenchmarkTab />}
    </div>
  );
};

export default SystemMonitorPanel;
