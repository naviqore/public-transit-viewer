import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import {
  AlertTriangle,
  ArrowDownCircle,
  Calendar,
  CheckCircle,
  Clock,
  Cpu,
  HelpCircle,
  Play,
  Server,
  Shuffle,
  Square,
  Target,
  Timer,
  Trash2,
  Users,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { useBenchmark } from '../hooks/useBenchmark';
import { BenchmarkScenario } from '../types';

const MAX_HISTORY = 60;

// --- Helper Components ---

const ScenarioTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top',
    middleware: [offset(8), flip({ padding: 10 }), shift({ padding: 10 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const click = useClick(context, { event: 'click' });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    click,
    dismiss,
    role,
  ]);

  return (
    <>
      <span
        ref={refs.setReference}
        {...getReferenceProps({
          role: 'button',
          tabIndex: 0,
          'aria-label': 'Show scenario description',
          onClick: (event) => {
            event.stopPropagation();
          },
        })}
        className="group relative inline-flex items-center ml-1 cursor-help"
      >
        <HelpCircle
          size={12}
          className="text-slate-400 group-hover:text-indigo-500 transition-colors"
        />
      </span>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-[9999] px-3 py-2 bg-slate-800 text-white text-[11px] font-medium rounded-lg shadow-xl pointer-events-none w-max max-w-[280px] text-left leading-relaxed whitespace-pre-line"
          >
            {text}
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

const SCENARIO_ACTIVE_STYLES: Record<BenchmarkScenario, string> = {
  real_life:
    'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 shadow-sm',
  fixed:
    'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 shadow-sm',
  random:
    'bg-fuchsia-50 dark:bg-fuchsia-900/30 border-fuchsia-200 dark:border-fuchsia-800 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm',
};

const ScenarioButton: React.FC<{
  label: string;
  value: BenchmarkScenario;
  current: BenchmarkScenario;
  icon: React.ElementType;
  color: string;
  description: string;
  onClick: (v: BenchmarkScenario) => void;
}> = ({ label, value, current, icon: Icon, color, description, onClick }) => {
  const isSelected = value === current;
  return (
    <button
      onClick={() => onClick(value)}
      className={`flex items-center px-2 py-1 text-[10px] md:px-3 md:py-1.5 md:text-xs font-bold rounded-lg transition-all border ${
        isSelected
          ? SCENARIO_ACTIVE_STYLES[value]
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
      }`}
    >
      <Icon size={12} className={`mr-1 md:mr-1.5 ${isSelected ? '' : color}`} />
      {label}
      <ScenarioTooltip text={description} />
    </button>
  );
};

const FullWidthLatencyChart: React.FC<{ data: number[] }> = ({ data }) => {
  const height = 48;
  const width = 200;
  const max = Math.max(...data, 200);

  const points = data
    .map((val, i) => {
      const x = (i / (MAX_HISTORY - 1)) * width;
      const y = height - (val / max) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 p-2 flex flex-col gap-1">
      <div className="flex justify-between items-end px-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Latency Trend
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          Peak: {Math.round(max)}ms
        </span>
      </div>
      <div className="h-12 w-full relative overflow-hidden rounded">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient
              id="latencyGradientFull"
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`M0,${height} ${points} L${width},${height} Z`}
            fill="url(#latencyGradientFull)"
          />
          <polyline
            points={points}
            fill="none"
            stroke="#6366f1"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
};

const StatItem: React.FC<{
  label: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  color: string;
}> = ({ label, value, subValue, icon: Icon, color }) => (
  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 border border-slate-200 dark:border-slate-800 flex items-center gap-3 min-w-0">
    <div
      className={`p-1.5 rounded-md ${color.replace('text-', 'bg-').replace('600', '100').replace('400', '900/30')} ${color}`}
    >
      <Icon size={16} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="text-sm font-mono font-bold text-slate-900 dark:text-white leading-none">
          {value}
        </span>
        {subValue && (
          <span className={`text-[10px] font-mono leading-none ${color}`}>
            {subValue}
          </span>
        )}
      </div>
    </div>
  </div>
);

// --- Main Component ---

const BenchmarkTab: React.FC = () => {
  const {
    benchmarkState,
    setBenchmarkConfig,
    toggleBenchmark,
    clearBenchmarkLogs,
  } = useBenchmark();

  const { isRunning, config, stats, logs, latencyHistory } = benchmarkState;

  // Console State
  const [autoScroll, setAutoScroll] = useState(true);
  const consoleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && consoleContainerRef.current) {
      const container = consoleContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'auto', // Use auto for instant scrolling during high frequency updates
      });
    }
  }, [logs, autoScroll]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900/50">
      {/* CONTROL PANEL */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 space-y-3 overflow-y-auto max-h-[50vh] md:max-h-none">
        {/* Top Row: Play & Scenarios */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          {/* Play Button & Main Controls Group */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={toggleBenchmark}
              className={`h-12 w-12 rounded-full flex items-center justify-center transition-all shadow-md flex-shrink-0 ${
                isRunning
                  ? 'bg-brand-500 hover:bg-brand-600 text-white animate-pulse ring-4 ring-brand-100 dark:ring-brand-900/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/20'
              }`}
              title={isRunning ? 'Stop Benchmark' : 'Start Benchmark'}
            >
              {isRunning ? (
                <Square fill="currentColor" size={20} />
              ) : (
                <Play fill="currentColor" size={24} className="ml-1" />
              )}
            </button>

            <div className="flex-1 flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              <ScenarioButton
                label="Real Life"
                value="real_life"
                current={config.scenario}
                icon={Users}
                color="text-indigo-600 dark:text-indigo-400"
                description={`Simulates realistic traffic:
• Time: Gaussian (forward skew from 'now') inside validity.
• Params: Mostly default, some variations based on capabilities.`}
                onClick={(s) =>
                  setBenchmarkConfig((prev) => ({ ...prev, scenario: s }))
                }
              />
              <ScenarioButton
                label="Fixed"
                value="fixed"
                current={config.scenario}
                icon={Target}
                color="text-amber-600 dark:text-amber-400"
                description={`Controlled testing:
• Time: Random time on fixed date.
• Params: Fixed default parameters.
• Random Origin/Destination.`}
                onClick={(s) =>
                  setBenchmarkConfig((prev) => ({ ...prev, scenario: s }))
                }
              />
              <ScenarioButton
                label="Random"
                value="random"
                current={config.scenario}
                icon={Shuffle}
                color="text-fuchsia-600 dark:text-fuchsia-400"
                description={`Maximum variance:
• Time: Uniform random across entire schedule validity.
• Params: Fully randomized (within capabilities).`}
                onClick={(s) =>
                  setBenchmarkConfig((prev) => ({ ...prev, scenario: s }))
                }
              />
            </div>
          </div>

          {/* Date Picker (Only if Fixed) */}
          {config.scenario === 'fixed' && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-left-2 duration-200 w-full md:w-auto">
              <Calendar size={16} className="text-amber-500" />
              <input
                type="date"
                value={config.fixedDate}
                onChange={(e) =>
                  setBenchmarkConfig((prev) => ({
                    ...prev,
                    fixedDate: e.target.value,
                  }))
                }
                className="bg-transparent border-none p-0 text-base text-slate-700 dark:text-slate-200 focus:ring-0 font-bold font-mono w-full"
              />
            </div>
          )}
        </div>

        {/* Middle Row: Sliders */}
        <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-3 flex-1 min-w-[140px]">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                <Cpu size={10} className="text-indigo-400" /> Threads
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={config.concurrency}
                onChange={(e) =>
                  setBenchmarkConfig((prev) => ({
                    ...prev,
                    concurrency: parseInt(e.target.value),
                  }))
                }
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-xs font-mono font-bold w-6 text-right">
                {config.concurrency}
              </span>
            </div>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

            <div className="flex items-center gap-3 flex-1 min-w-[140px]">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                <Timer size={10} className="text-indigo-400" /> Delay
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={config.delayMs}
                onChange={(e) =>
                  setBenchmarkConfig((prev) => ({
                    ...prev,
                    delayMs: parseInt(e.target.value),
                  }))
                }
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-xs font-mono font-bold w-12 text-right">
                {config.delayMs}ms
              </span>
            </div>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

            <div className="flex items-center gap-3 flex-1 min-w-[160px]">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                <Clock size={10} className="text-indigo-400" /> Window
              </div>
              <input
                type="range"
                min="0"
                max="240"
                step="15"
                value={config.timeWindowDuration}
                onChange={(e) =>
                  setBenchmarkConfig((prev) => ({
                    ...prev,
                    timeWindowDuration: parseInt(e.target.value),
                  }))
                }
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-xs font-mono font-bold w-12 text-right">
                {config.timeWindowDuration}m
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
          <StatItem
            label="Requests"
            value={stats.totalSent.toLocaleString()}
            subValue={isRunning ? `(${stats.currentRps}/s)` : undefined}
            icon={Server}
            color="text-indigo-600 dark:text-indigo-400"
          />
          <StatItem
            label="Avg Latency"
            value={`${Math.round(stats.avgLatency)}ms`}
            icon={Timer}
            color={
              stats.avgLatency > 1000
                ? 'text-amber-500'
                : 'text-slate-600 dark:text-slate-400'
            }
          />
          <StatItem
            label="Success"
            value={`${stats.totalSent > 0 ? ((stats.totalSuccess / stats.totalSent) * 100).toFixed(0) : 0}%`}
            icon={CheckCircle}
            color="text-emerald-600 dark:text-emerald-400"
          />
          <StatItem
            label="Errors"
            value={stats.totalError.toLocaleString()}
            icon={AlertTriangle}
            color={stats.totalError > 0 ? 'text-red-500' : 'text-slate-400'}
          />
        </div>

        {/* Chart */}
        <div className="pt-1">
          <FullWidthLatencyChart data={latencyHistory} />
        </div>
      </div>

      {/* CONSOLE OUTPUT */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-slate-300 font-mono text-xs overflow-hidden border-t border-slate-800">
        <div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-b border-slate-800 shrink-0">
          <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">
            Console Output
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`p-1 rounded hover:bg-slate-800 ${autoScroll ? 'text-indigo-400' : 'text-slate-600'}`}
              title="Auto-scroll"
            >
              <ArrowDownCircle size={12} />
            </button>
            <button
              onClick={clearBenchmarkLogs}
              className="p-1 rounded hover:bg-slate-800 text-slate-600 hover:text-red-400"
              title="Clear"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        <div
          ref={consoleContainerRef}
          className="flex-1 min-h-0 overflow-y-auto p-2 custom-scrollbar overscroll-contain flex flex-col"
        >
          <div className="space-y-1">
            {logs.map((l, i) => (
              <div
                key={i}
                className="flex gap-2 hover:bg-white/5 -mx-2 px-2 py-px"
              >
                <span className="text-slate-600 shrink-0 select-none">
                  [{l.time}]
                </span>
                <span
                  className={`${l.type === 'error' ? 'text-red-400' : l.type === 'success' ? 'text-emerald-400' : 'text-slate-300'} break-all`}
                >
                  {l.type === 'success'
                    ? '✓ '
                    : l.type === 'error'
                      ? '✗ '
                      : '> '}
                  {l.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkTab;
