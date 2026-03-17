import {
  Activity,
  CalendarDays,
  CircleDot,
  List,
  Map as MapIcon,
  Route as RouteIcon,
  Settings,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import AboutDialog from './AboutDialog';
import { useDomain } from '../contexts/DomainContext';
import { useMonitoring } from '../contexts/MonitoringContext';
import { useSettings } from '../contexts/SettingsContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logs } = useMonitoring();
  const { backendStatus } = useDomain();
  const { mobileMapOpen, setMobileMapOpen, showAbout, setShowAbout } =
    useSettings();

  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);

  const isSettingsPage = location.pathname === '/settings';
  const isMonitorPage = location.pathname === '/monitor';

  const isFullPage = isSettingsPage || isMonitorPage;
  const wasFullPage =
    prevLocationRef.current === '/settings' ||
    prevLocationRef.current === '/monitor';

  const shouldAnimate = !(isFullPage || wasFullPage);

  useEffect(() => {
    prevLocationRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    setMobileMapOpen(false);
  }, [location.pathname, setMobileMapOpen]);

  const avgLatency = useMemo(() => {
    const validLogs = logs.filter((l) => l.url !== 'SYSTEM');
    if (validLogs.length === 0) return 0;
    const total = validLogs.reduce((acc, l) => acc + l.duration, 0);
    return Math.round(total / validLogs.length);
  }, [logs]);

  const getNavLinkClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center text-[10px] font-medium p-2 rounded-lg transition-all duration-200 ${
      isActive
        ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 shadow-sm'
        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
    }`;

  return (
    <div
      className={`flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300 ${mobileMapOpen ? 'mobile-map-open' : ''}`}
    >
      <nav className="order-2 md:order-none h-[60px] md:h-full w-full md:w-[72px] bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-800 flex md:flex-col items-center justify-between md:justify-start md:pt-4 z-[100] flex-shrink-0 transition-colors">
        <div className="hidden md:flex mb-6 justify-center">
          <button
            onClick={() => setShowAbout(true)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-visible bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:scale-105 transition-transform cursor-pointer active:scale-95"
            title="About Naviqore"
          >
            <span className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center">
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
            </span>
            {backendStatus === 'error' && (
              <span
                aria-label="Backend unreachable"
                className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 pointer-events-none"
              />
            )}
          </button>
        </div>

        <div className="flex flex-1 md:flex-none md:flex-col gap-1 md:gap-2 w-full md:w-auto px-2 md:px-0 justify-around md:justify-start">
          <NavLink
            to="/"
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            <CalendarDays size={22} />
            <span className="mt-1 md:hidden lg:block">Explore</span>
          </NavLink>
          <NavLink
            to="/connect"
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            <RouteIcon size={22} />
            <span className="mt-1 md:hidden lg:block">Connect</span>
          </NavLink>
          <NavLink
            to="/isolines"
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            <CircleDot size={22} />
            <span className="mt-1 md:hidden lg:block">Isoline</span>
          </NavLink>
          <NavLink
            to="/monitor"
            className={({ isActive }) =>
              `${getNavLinkClass(isActive)} md:hidden`
            }
          >
            <Activity size={22} />
            <span>Monitor</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${getNavLinkClass(isActive)} md:hidden`
            }
          >
            <Settings size={22} />
            <span>Settings</span>
          </NavLink>
        </div>

        <div className="hidden md:flex flex-col mt-auto items-center gap-2 pb-4 w-full">
          <NavLink
            to="/monitor"
            className={({ isActive }) => getNavLinkClass(isActive)}
            title="System Monitor"
          >
            <Activity
              size={22}
              className={avgLatency > 500 ? 'text-amber-500' : 'currentColor'}
            />
            <span className="font-mono mt-1">{avgLatency}ms</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => getNavLinkClass(isActive)}
            title="Settings"
          >
            <Settings size={22} />
          </NavLink>
        </div>
      </nav>

      <main className="flex-1 order-1 md:order-none relative overflow-hidden flex flex-col md:flex-row">
        {isFullPage ? (
          <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
            {children}
          </div>
        ) : (
          <>
            <div
              className={`flex-shrink-0 relative z-20 bg-slate-50 dark:bg-slate-950 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 ${shouldAnimate ? 'transition-all duration-300' : ''} flex flex-col ${mobileMapOpen ? 'h-0 md:h-full overflow-hidden' : 'h-full md:w-[400px]'}`}
            >
              {children}
            </div>

            <div
              className={`flex-1 bg-slate-200 dark:bg-slate-900 ${shouldAnimate ? 'transition-all duration-300' : ''} relative flex flex-col ${!mobileMapOpen ? 'hidden md:flex' : 'flex'}`}
            >
              <div className="flex-1 relative overflow-hidden"></div>
            </div>

            <button
              onClick={() => setMobileMapOpen(!mobileMapOpen)}
              className="md:hidden fixed bottom-20 right-4 z-[90] h-12 w-12 rounded-full bg-brand-600 text-white border-2 border-white/90 dark:border-slate-800 shadow-xl shadow-brand-600/35 flex items-center justify-center hover:bg-brand-700 active:scale-95 transition-all"
              aria-label={mobileMapOpen ? 'Show List' : 'Show Map'}
            >
              {mobileMapOpen ? <List size={24} /> : <MapIcon size={24} />}
            </button>
          </>
        )}
      </main>

      {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}
    </div>
  );
};

export default Layout;
