import React, { ReactNode } from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import { MonitoringProvider } from './contexts/MonitoringContext';
import { DomainProvider } from './contexts/DomainContext';

interface ProvidersProps {
  children: ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <SettingsProvider>
      <DomainProvider>
        <MonitoringProvider>{children}</MonitoringProvider>
      </DomainProvider>
    </SettingsProvider>
  );
};

export default Providers;
