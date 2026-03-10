import React, { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { ExploreQueryConfig, StopScope } from '../types';
import { DEFAULT_EXPLORE_CONFIG } from '../constants';
import ResponsiveDialog from './common/ResponsiveDialog';

interface ExploreConfigDialogProps {
  config: ExploreQueryConfig;
  onChange: (c: ExploreQueryConfig) => void;
  onClose: () => void;
}

const ExploreConfigDialog: React.FC<ExploreConfigDialogProps> = ({
  config: initialConfig,
  onChange,
  onClose,
}) => {
  const [localConfig, setLocalConfig] =
    useState<ExploreQueryConfig>(initialConfig);

  const updateConfig = <K extends keyof ExploreQueryConfig>(
    key: K,
    value: ExploreQueryConfig[K]
  ) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_EXPLORE_CONFIG);
  };

  const handleApply = () => {
    onChange(localConfig);
    onClose();
  };

  return (
    <ResponsiveDialog title="Explore Options" onClose={onClose}>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Stop Scope */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
            Stop Scope
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(StopScope).map((scope) => (
              <button
                key={scope}
                onClick={() => updateConfig('stopScope', scope)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  localConfig.stopScope === scope
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {scope}
              </button>
            ))}
          </div>
        </div>

        {/* Constraints */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
            Constraints
          </label>
          <div className="space-y-4">
            {/* Time Window (To Time) */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Time Window
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {localConfig.timeWindowMinutes >= 60
                    ? `${Math.floor(localConfig.timeWindowMinutes / 60)}h ${localConfig.timeWindowMinutes % 60}m`
                    : `${localConfig.timeWindowMinutes}m`}
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="1440"
                step="15"
                value={localConfig.timeWindowMinutes}
                onChange={(e) =>
                  updateConfig('timeWindowMinutes', parseInt(e.target.value))
                }
                className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>15m</span>
                <span>24h</span>
              </div>
            </div>

            {/* Result Limit */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Result Limit
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {localConfig.limit}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={localConfig.limit}
                onChange={(e) =>
                  updateConfig('limit', parseInt(e.target.value))
                }
                className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0 flex gap-3">
        <button
          onClick={handleReset}
          className="flex-1 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Reset to Defaults"
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={handleApply}
          className="flex-1 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-lg font-bold shadow-sm hover:bg-indigo-700 transition-colors"
          title="Apply Configuration"
        >
          <Check size={18} />
        </button>
      </div>
    </ResponsiveDialog>
  );
};

export default ExploreConfigDialog;
