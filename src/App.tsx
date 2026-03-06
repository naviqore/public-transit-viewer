import React, { ErrorInfo, ReactNode } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import SettingsPage from './pages/SettingsPage';
import ExplorePage from './pages/ExplorePage';
import ConnectPage from './pages/ConnectPage';
import IsolinePage from './pages/IsolinePage';
import SystemMonitorPage from './pages/SystemMonitorPage';
import Providers from './Providers';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = { hasError: false };
  readonly props: Readonly<ErrorBoundaryProps>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-800">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Something went wrong.</h1>
            <p className="mb-4 text-slate-500">Please refresh the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
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
