import { HashRouter, Route, Routes } from 'react-router-dom';

import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/Layout';
import ConnectPage from './pages/ConnectPage';
import ExplorePage from './pages/ExplorePage';
import IsolinePage from './pages/IsolinePage';
import SettingsPage from './pages/SettingsPage';
import SystemMonitorPage from './pages/SystemMonitorPage';
import Providers from './Providers';

const App = () => {
  return (
    <ErrorBoundary>
      <Providers>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<ExplorePage />} />
              <Route path="/connect" element={<ConnectPage />} />
              <Route path="/isolines" element={<IsolinePage />} />
              <Route path="/monitor" element={<SystemMonitorPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Layout>
        </HashRouter>
      </Providers>
    </ErrorBoundary>
  );
};

export default App;
