import { Activity, BarChart3, Gauge, Terminal, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import PageHeader from '../components/common/PageHeader';
import SystemMonitorPanel from '../components/SystemMonitorPanel';
import { DISABLE_BENCHMARK } from '../constants';
import { useMonitoring } from '../contexts/MonitoringContext';
import './PageStyles.css';

const SystemMonitorPage: React.FC = () => {
  const { logs, clearLogs, clearBenchmarkLogs } = useMonitoring();
  const [activeTab, setActiveTab] = useState<
    'logs' | 'performance' | 'benchmark'
  >('performance');

  const handleClearAll = () => {
    clearLogs();
    clearBenchmarkLogs();
  };

  return (
    <div className="page-wrapper bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col h-full overflow-hidden">
      <div className="flex flex-col h-full w-full overflow-hidden">
        <PageHeader title="System Monitor" icon={Activity} />

        {/* Content Area - Constrained Flex Child */}
        <div className="flex-1 min-h-0 overflow-hidden relative w-full max-w-5xl mx-auto p-4 md:pb-6 flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 h-9 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('performance')}
                className={`flex items-center justify-center gap-2 px-3 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'performance' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                <BarChart3 size={14} /> Performance
              </button>
              {!DISABLE_BENCHMARK && (
                <button
                  onClick={() => setActiveTab('benchmark')}
                  className={`flex items-center justify-center gap-2 px-3 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'benchmark' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  <Gauge size={14} /> Benchmark
                </button>
              )}
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex items-center justify-center gap-2 px-3 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'logs' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                <Terminal size={14} /> Logs
              </button>
            </div>
            <button
              onClick={handleClearAll}
              className="flex-shrink-0 h-9 w-9 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 transition-colors shadow-sm"
              title="Clear History"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <SystemMonitorPanel logs={logs} activeTab={activeTab} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitorPage;
