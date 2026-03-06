import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Ban,
  Check,
  Cpu,
  Database,
  ExternalLink,
  Github,
  Globe,
  X,
} from 'lucide-react';
import { useDomain } from '../contexts/DomainContext';

interface AboutDialogProps {
  onClose: () => void;
}

const FeatureRow: React.FC<{ label: string; supported: boolean }> = ({
  label,
  supported,
}) => (
  <div
    className={`flex items-center justify-between py-1.5 ${supported ? 'opacity-100' : 'opacity-50'}`}
  >
    <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
    {supported ? (
      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
        <Check size={12} /> Supported
      </span>
    ) : (
      <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
        <Ban size={12} /> Not Supported
      </span>
    )}
  </div>
);

const AboutDialog: React.FC<AboutDialogProps> = ({ onClose }) => {
  const { serverInfo } = useDomain();
  const [mounted, setMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        {/* Header / Brand */}
        <div className="flex flex-col items-center justify-center p-8 pb-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>

          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg mb-4 overflow-hidden ${logoError ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-white dark:bg-slate-800'}`}
          >
            {!logoError ? (
              <img
                src="/logo.png"
                alt="Naviqore"
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-4xl font-bold">N</span>
            )}
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center">
            Public Transit Viewer
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            by{' '}
            <a
              href="https://naviqore.org"
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Naviqore
            </a>{' '}
            &bull; v1.0.0
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Schedule Info */}
          <div>
            <h3 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              <Database size={14} className="hidden md:block" /> Schedule Info
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 border border-slate-200/50 dark:border-slate-700/50">
              {serverInfo.schedule ? (
                <>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200/50 dark:border-slate-700/50 pb-2.5 mb-1">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Validity
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {serverInfo.schedule.scheduleValidity.startDate}{' '}
                      <span className="text-slate-400 mx-1">to</span>{' '}
                      {serverInfo.schedule.scheduleValidity.endDate}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <FeatureRow
                      label="Accessibility Data"
                      supported={serverInfo.schedule.hasAccessibility}
                    />
                    <FeatureRow
                      label="Bike Accessibility"
                      supported={serverInfo.schedule.hasBikes}
                    />
                    <FeatureRow
                      label="Travel Modes"
                      supported={serverInfo.schedule.hasTravelModes}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center text-sm text-slate-400 italic py-2">
                  Loading schedule info...
                </div>
              )}
            </div>
          </div>

          {/* Routing Info */}
          <div>
            <h3 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              <Cpu size={14} className="hidden md:block" /> Router Capabilities
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-1 border border-slate-200/50 dark:border-slate-700/50">
              {serverInfo.routing ? (
                <>
                  <FeatureRow
                    label="Max Transfers Limit"
                    supported={serverInfo.routing.supportsMaxTransfers}
                  />
                  <FeatureRow
                    label="Max Travel Duration"
                    supported={serverInfo.routing.supportsMaxTravelDuration}
                  />
                  <FeatureRow
                    label="Max Walk Duration"
                    supported={serverInfo.routing.supportsMaxWalkDuration}
                  />
                  <FeatureRow
                    label="Min Transfer Time"
                    supported={serverInfo.routing.supportsMinTransferDuration}
                  />
                  <FeatureRow
                    label="Wheelchair Routing"
                    supported={serverInfo.routing.supportsAccessibility}
                  />
                  <FeatureRow
                    label="Bike Transport"
                    supported={serverInfo.routing.supportsBikes}
                  />
                  <FeatureRow
                    label="Mode Selection"
                    supported={serverInfo.routing.supportsTravelModes}
                  />
                </>
              ) : (
                <div className="text-center text-sm text-slate-400 italic py-2">
                  Loading router info...
                </div>
              )}
            </div>
          </div>

          {/* Links Section */}
          <div>
            <h3 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Links
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden divide-y divide-slate-200/50 dark:divide-slate-700/50 border border-slate-200/50 dark:border-slate-700/50">
              <a
                href="https://naviqore.org"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Globe
                    size={16}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Naviqore Website
                  </span>
                </div>
                <ExternalLink size={14} className="text-slate-400" />
              </a>
              <a
                href="https://github.com/naviqore/public-transit-viewer"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Github
                    size={16}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Frontend Repository
                  </span>
                </div>
                <ExternalLink size={14} className="text-slate-400" />
              </a>
              <a
                href="https://github.com/naviqore/public-transit-service"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Github
                    size={16}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Backend Repository
                  </span>
                </div>
                <ExternalLink size={14} className="text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
};

export default AboutDialog;
