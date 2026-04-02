import {
  Check,
  Clock,
  Database,
  Globe,
  Link,
  Lock,
  Moon,
  Search,
  Settings,
  Sun,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import PageHeader from '../components/common/PageHeader';
import { ENABLE_MOCK_DATA, IS_API_URL_CONFIGURED } from '../constants';
import { useDomain } from '../contexts/DomainContext';
import { useSettings } from '../contexts/SettingsContext';
import { getAllTimezones } from '../utils/dateUtils';
import './PageStyles.css';

const SettingsPage: React.FC = () => {
  const { backendStatus } = useDomain();
  const {
    timezone,
    setTimezone,
    useStationTime,
    setUseStationTime,
    mockMode,
    setMockMode,
    apiBaseUrl,
    setApiBaseUrl,
    darkMode,
    setDarkMode,
    setShowAbout,
  } = useSettings();

  const [tzQuery, setTzQuery] = useState('');
  const [isTzOpen, setIsTzOpen] = useState(false);
  const tzWrapperRef = useRef<HTMLDivElement>(null);

  const allTimezones = useMemo(() => getAllTimezones(), []);

  const filteredTimezones = useMemo(() => {
    if (!tzQuery) return allTimezones;
    return allTimezones.filter((tz) =>
      tz.toLowerCase().includes(tzQuery.toLowerCase())
    );
  }, [allTimezones, tzQuery]);

  // Handle click outside for timezone dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tzWrapperRef.current &&
        !tzWrapperRef.current.contains(event.target as Node)
      ) {
        setIsTzOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="page-wrapper bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col h-full overflow-hidden">
      <PageHeader title="Settings" icon={Settings} />
      <div className="flex-1 overflow-y-auto">
        <div className="panel-content max-w-2xl mx-auto w-full p-4">
          <div className="space-y-6 py-4">
            {/* Mobile About Section */}
            <section className="md:hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div
                className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                onClick={() => setShowAbout(true)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <img
                        src="/logo.png"
                        alt="Naviqore"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const parent = target.parentElement;
                          if (parent) {
                            target.style.display = 'none';
                            parent.classList.remove(
                              'bg-white',
                              'border-slate-100',
                              'dark:bg-slate-800',
                              'dark:border-slate-700'
                            );
                            parent.classList.add(
                              'bg-brand-600',
                              'text-white',
                              'font-bold'
                            );
                            parent.innerText = 'N';
                          }
                        }}
                      />
                    </div>
                    {backendStatus === 'error' && (
                      <span
                        aria-label="Backend unreachable"
                        className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 pointer-events-none"
                      />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white text-base">
                      About Naviqore
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Version, credits and system info
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 1. General Section */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-20">
              <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 rounded-t-xl">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  General
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <div
                  className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => setDarkMode(!darkMode)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-900 text-indigo-400' : 'bg-amber-100 text-amber-600'}`}
                    >
                      {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        Dark Mode
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {darkMode ? 'Use light theme' : 'Use dark theme'}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${darkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out ${darkMode ? 'left-[22px]' : 'left-[2px]'}`}
                    />
                  </div>
                </div>

                {/* Timezone Settings */}
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                      <Globe size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        Timezone
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Display times in specific zone
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-2" ref={tzWrapperRef}>
                    <button
                      onClick={() => {
                        setIsTzOpen(!isTzOpen);
                        setTimeout(
                          () => document.getElementById('tz-search')?.focus(),
                          50
                        );
                      }}
                      className="w-full text-left rounded-lg border border-slate-300 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none flex items-center justify-between"
                    >
                      <span>{timezone}</span>
                      <Search size={14} className="text-slate-400" />
                    </button>

                    {isTzOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                          <input
                            id="tz-search"
                            type="text"
                            className="w-full px-2 py-1.5 text-base bg-slate-100 dark:bg-slate-800 rounded-md focus:outline-none"
                            placeholder="Search timezone..."
                            value={tzQuery}
                            onChange={(e) => setTzQuery(e.target.value)}
                          />
                        </div>
                        <div className="overflow-y-auto flex-1 p-1">
                          {filteredTimezones.length === 0 && (
                            <div className="p-2 text-xs text-slate-400 text-center">
                              No results
                            </div>
                          )}
                          {filteredTimezones.map((tz) => (
                            <button
                              key={tz}
                              onClick={() => {
                                setTimezone(tz);
                                setIsTzOpen(false);
                                setTzQuery('');
                              }}
                              className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between ${timezone === tz ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                              {tz}
                              {timezone === tz && <Check size={14} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer rounded-b-xl"
                  onClick={() => setUseStationTime(!useStationTime)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${useStationTime ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                    >
                      <Clock size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        Station Local Time
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {useStationTime
                          ? 'Times shown in station timezone'
                          : 'Times converted to your timezone'}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${useStationTime ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out ${useStationTime ? 'left-[22px]' : 'left-[2px]'}`}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Backend Section */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Backend
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                      <Link size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        API Endpoint
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Base URL for Naviqore service
                      </div>
                    </div>
                  </div>

                  {IS_API_URL_CONFIGURED || mockMode ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                      <Lock size={14} className="text-emerald-500" />
                      <code className="text-xs font-mono flex-1">
                        {apiBaseUrl}
                      </code>
                      <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {IS_API_URL_CONFIGURED
                          ? 'ENV Configured'
                          : 'Mock Active'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={apiBaseUrl}
                        onChange={(e) => setApiBaseUrl(e.target.value)}
                        placeholder="http://localhost:8080"
                        className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 p-2.5 text-base focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950"
                      />
                    </div>
                  )}
                </div>

                {(!IS_API_URL_CONFIGURED || ENABLE_MOCK_DATA) && (
                  <div
                    className={`p-4 flex items-center justify-between transition-colors ${ENABLE_MOCK_DATA ? 'opacity-60' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'}`}
                    onClick={
                      ENABLE_MOCK_DATA
                        ? undefined
                        : () => setMockMode(!mockMode)
                    }
                    aria-disabled={ENABLE_MOCK_DATA}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${mockMode ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                      >
                        <Database size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          Mock Data Mode
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {ENABLE_MOCK_DATA
                            ? 'Fixed by environment'
                            : 'Use simulated data'}
                        </div>
                      </div>
                    </div>
                    {ENABLE_MOCK_DATA ? (
                      <Lock
                        size={16}
                        className="text-emerald-500 flex-shrink-0"
                      />
                    ) : (
                      <div
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${mockMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out ${mockMode ? 'left-[22px]' : 'left-[2px]'}`}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
