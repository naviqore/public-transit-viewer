import React, { ReactNode } from 'react';

import { DomainProvider } from './contexts/DomainContext';
import { MonitoringProvider } from './contexts/MonitoringContext';
import { SettingsProvider } from './contexts/SettingsContext';

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
