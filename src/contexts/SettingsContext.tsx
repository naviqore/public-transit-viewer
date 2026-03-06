import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  API_BASE_URL,
  DEFAULT_QUERY_CONFIG,
  ENABLE_MOCK_DATA,
  IS_API_URL_CONFIGURED,
} from '../constants';
import { naviqoreService } from '../services/naviqoreService';
import { QueryConfig } from '../types';
import { getLocalTimezone } from '../utils/dateUtils';

interface SettingsContextType {
  timezone: string;
  setTimezone: (tz: string) => void;
  useStationTime: boolean;
  setUseStationTime: (enabled: boolean) => void;
  mockMode: boolean;
  setMockMode: (enabled: boolean) => void;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  mobileMapOpen: boolean;
  setMobileMapOpen: (isOpen: boolean) => void;
  showAbout: boolean;
  setShowAbout: (show: boolean) => void;
  queryConfig: QueryConfig;
  setQueryConfig: React.Dispatch<React.SetStateAction<QueryConfig>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [timezone, setTimezone] = useState(getLocalTimezone());
  const [useStationTime, setUseStationTime] = useState(false);
  const [mockMode, setMockMode] = useState(
    ENABLE_MOCK_DATA && !IS_API_URL_CONFIGURED
  );
  const [apiBaseUrl, setApiBaseUrl] = useState(API_BASE_URL);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [queryConfig, setQueryConfig] =
    useState<QueryConfig>(DEFAULT_QUERY_CONFIG);

  // Effect: Dark Mode Sync
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Effect: Service Config Sync
  useEffect(() => {
    naviqoreService.setBaseUrl(apiBaseUrl);
  }, [apiBaseUrl]);

  useEffect(() => {
    naviqoreService.setMockMode(mockMode);
  }, [mockMode]);

  return (
    <SettingsContext.Provider
      value={{
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
        mobileMapOpen,
        setMobileMapOpen,
        showAbout,
        setShowAbout,
        queryConfig,
        setQueryConfig,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context)
    throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
