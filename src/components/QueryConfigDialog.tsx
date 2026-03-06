import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, RotateCcw, X } from 'lucide-react';
import { QueryConfig, TransportMode } from '../types';
import { DEFAULT_QUERY_CONFIG } from '../constants';
import { useDomain } from '../contexts/DomainContext';

interface QueryConfigDialogProps {
  config: QueryConfig;
  onChange: (c: QueryConfig) => void;
  onClose: () => void;
  showMaxTravelDuration?: boolean;
}

const QueryConfigDialog: React.FC<QueryConfigDialogProps> = ({
  config: initialConfig,
  onChange,
  onClose,
  showMaxTravelDuration = true,
}) => {
  const [mounted, setMounted] = useState(false);
  const [localConfig, setLocalConfig] = useState<QueryConfig>(initialConfig);
  const { serverInfo } = useDomain();
  const routingCaps = serverInfo.routing;

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const updateConfig = <K extends keyof QueryConfig>(
    key: K,
    value: QueryConfig[K]
  ) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMode = (mode: TransportMode) => {
    if (routingCaps && !routingCaps.supportsTravelModes) return;
    const current = localConfig.travelModes || [];
    if (current.includes(mode)) {
      updateConfig(
        'travelModes',
        current.filter((m) => m !== mode)
      );
    } else {
      updateConfig('travelModes', [...current, mode]);
    }
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_QUERY_CONFIG);
  };

  const handleApply = () => {
    onChange(localConfig);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Helper for disabled style
  const disabledStyle = (supported: boolean | undefined) => {
    if (supported === false) return 'opacity-50 pointer-events-none grayscale';
    return '';
  };

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">
            Query Options
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Modes */}
          <div className={disabledStyle(routingCaps?.supportsTravelModes)}>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
              Transport Modes
              {!routingCaps?.supportsTravelModes && (
                <span className="text-xs text-red-400 font-normal normal-case">
                  Not supported
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(TransportMode).map((mode) => {
                const isSelected = localConfig.travelModes.includes(mode);
                return (
                  <button
                    key={mode}
                    onClick={() => toggleMode(mode)}
                    disabled={routingCaps?.supportsTravelModes === false}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accessibility */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Accessibility
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${disabledStyle(routingCaps?.supportsAccessibility)}`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Wheelchair Accessible
                  </span>
                  {!routingCaps?.supportsAccessibility && (
                    <span className="text-[10px] text-red-400">
                      Not supported by router
                    </span>
                  )}
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800"
                  checked={localConfig.wheelchairAccessible}
                  disabled={routingCaps?.supportsAccessibility === false}
                  onChange={(e) =>
                    updateConfig('wheelchairAccessible', e.target.checked)
                  }
                />
              </label>
              <label
                className={`flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${disabledStyle(routingCaps?.supportsBikes)}`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Bike Allowed
                  </span>
                  {!routingCaps?.supportsBikes && (
                    <span className="text-[10px] text-red-400">
                      Not supported by router
                    </span>
                  )}
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800"
                  checked={localConfig.bikeAllowed}
                  disabled={routingCaps?.supportsBikes === false}
                  onChange={(e) =>
                    updateConfig('bikeAllowed', e.target.checked)
                  }
                />
              </label>
            </div>
          </div>

          {/* Constraints & Window */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
              Constraints & Window
            </label>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Time Window
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {localConfig.timeWindowDuration} min
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="240"
                  step="5"
                  value={localConfig.timeWindowDuration ?? 60}
                  onChange={(e) =>
                    updateConfig('timeWindowDuration', parseInt(e.target.value))
                  }
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div
                className={`space-y-1 ${disabledStyle(routingCaps?.supportsMaxTransfers)}`}
              >
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Max Transfers
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {localConfig.maxTransfers ?? 'Unlimited'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={localConfig.maxTransfers ?? 10}
                  disabled={routingCaps?.supportsMaxTransfers === false}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateConfig('maxTransfers', val === 10 ? undefined : val);
                  }}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:accent-slate-400"
                />
              </div>

              <div
                className={`space-y-1 ${disabledStyle(routingCaps?.supportsMaxWalkDuration)}`}
              >
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Max Walk Duration
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {localConfig.maxWalkDuration
                      ? `${localConfig.maxWalkDuration}m`
                      : 'Unlimited'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={localConfig.maxWalkDuration ?? 60}
                  disabled={routingCaps?.supportsMaxWalkDuration === false}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateConfig(
                      'maxWalkDuration',
                      val === 60 ? undefined : val
                    );
                  }}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:accent-slate-400"
                />
              </div>

              <div
                className={`space-y-1 ${disabledStyle(routingCaps?.supportsMinTransferDuration)}`}
              >
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Min Transfer Duration
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {localConfig.minTransferDuration
                      ? `${localConfig.minTransferDuration}m`
                      : '0m'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={localConfig.minTransferDuration ?? 0}
                  disabled={routingCaps?.supportsMinTransferDuration === false}
                  onChange={(e) =>
                    updateConfig(
                      'minTransferDuration',
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:accent-slate-400"
                />
              </div>

              {showMaxTravelDuration && (
                <div
                  className={`space-y-1 ${disabledStyle(routingCaps?.supportsMaxTravelDuration)}`}
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Max Travel Duration
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {localConfig.maxTravelDuration
                        ? `${localConfig.maxTravelDuration}m`
                        : 'Unlimited'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="10"
                    value={localConfig.maxTravelDuration ?? 300}
                    disabled={routingCaps?.supportsMaxTravelDuration === false}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateConfig(
                        'maxTravelDuration',
                        val === 300 ? undefined : val
                      );
                    }}
                    className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:accent-slate-400"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
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
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(content, document.body);
};

export default QueryConfigDialog;
