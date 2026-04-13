import React, { useState } from 'react';
import { useDashboardData } from './hooks/useDashboardData';
import VesselList from './components/VesselList';
import EnergyFlowDiagram from './components/EnergyFlowDiagram';
import RuntimeChart from './components/RuntimeChart';
import VesselInfoPanel from './components/VesselInfoPanel';
import StatusBadge from './components/StatusBadge';
import { mapBatteryStatus } from './utils/mapper';

/**
 * Error Boundary Component
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Main Dashboard Component
 */
function Dashboard() {
  const {
    vesselList,
    selectedSystem,
    energyFlow,
    historicalData,
    countdown,
    generatorStatus,
    lastUpdated,
    error,
    warning,
    isConnected,
    isConnecting,
    selectSystem,
    fetchHistoricalData,
  } = useDashboardData();

  const [currentPeriod, setCurrentPeriod] = useState('7d');
  const [darkMode, setDarkMode] = useState(false);

  const handlePeriodChange = (period) => {
    setCurrentPeriod(period);
    fetchHistoricalData(period);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const batteryStatus = energyFlow ? mapBatteryStatus(energyFlow.batteryPower) : null;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Sigen Energy Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Hybrid Energy Management System
                </p>
              </div>

              <div className="flex items-center gap-4">
                <StatusBadge
                  isConnected={isConnected}
                  isConnecting={isConnecting}
                  countdown={countdown}
                  generatorStatus={generatorStatus}
                  batteryStatus={batteryStatus}
                  warning={warning}
                />

                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.92l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zM6.343 14.92l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex h-[calc(100vh-80px)]">
          {/* Sidebar - Vessel List */}
          <aside className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
            <VesselList
              vessels={vesselList}
              selectedSystem={selectedSystem}
              onSelect={selectSystem}
            />
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Top Row - Energy Flow and Info Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Energy Flow Diagram */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <EnergyFlowDiagram
                    energyFlow={energyFlow}
                    generatorStatus={generatorStatus}
                  />
                </div>

                {/* Vessel Info Panel */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <VesselInfoPanel
                    vessel={selectedSystem}
                    lastUpdated={lastUpdated}
                    countdown={countdown}
                  />
                </div>
              </div>

              {/* Bottom Row - Historical Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <RuntimeChart
                  historicalData={historicalData}
                  onPeriodChange={handlePeriodChange}
                  currentPeriod={currentPeriod}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * App Component with Error Boundary
 */
function App() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}

export default App;
