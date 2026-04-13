import { useState, useEffect, useRef } from 'react';
import VesselList from './components/VesselList';
import EnergyFlowDiagram from './components/EnergyFlowDiagram';
import RuntimeChart from './components/RuntimeChart';
import VesselInfoPanel from './components/VesselInfoPanel';
import StatusBadge from './components/StatusBadge';
import { useHierarchicalMenu, useVesselSearch } from './hooks/useDashboardData';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws';

function App() {
  const [activeTab, setActiveTab] = useState('system');
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [vessels, setVessels] = useState([]);
  const [realtimeData, setRealtimeData] = useState(null);
  const [historicalData, setHistoricalData] = useState({});
  const [countdown, setCountdown] = useState(5);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const wsRef = useRef(null);

  // Connect to WebSocket
  useEffect(() => {
    const connectWS = () => {
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log('[WS] Connected');
        setConnectionStatus('connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.systems) {
            setVessels(data.systems);
            if (!selectedVessel && data.systems.length > 0) {
              setSelectedVessel(data.systems[0]);
            }
          }
          
          if (data.realtime) {
            setRealtimeData(data.realtime);
          }
          
          if (data.countdown !== undefined) {
            setCountdown(data.countdown);
          }

          if (data.generatorStatus) {
            setRealtimeData(prev => ({
              ...prev,
              generatorStatus: data.generatorStatus
            }));
          }
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      wsRef.current.onclose = () => {
        console.log('[WS] Disconnected');
        setConnectionStatus('disconnected');
        setTimeout(connectWS, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('[WS] Error:', error);
        setConnectionStatus('error');
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleSelectVessel = (vessel) => {
    setSelectedVessel(vessel);
  };

  return (
    <div className="flex h-screen min-h-[750px] bg-[#0f1117] text-[#e0e6f0] font-sans overflow-hidden">
      {/* Sidebar */}
      <VesselList 
        vessels={vessels}
        selectedVessel={selectedVessel}
        onSelectVessel={handleSelectVessel}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#0f1117]">
        {/* Header */}
        <header className="px-5 py-3.5 border-b border-[#1e2535]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-sm text-[#8a9abf] mb-2">
                {selectedVessel?.systemName || 'Select a vessel'}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('system')}
                  className={`px-4.5 py-1.5 text-xs rounded-md transition-all ${
                    activeTab === 'system'
                      ? 'bg-[#2d5090] border border-[#4f9eff] text-[#4f9eff]'
                      : 'bg-[#1e3060] border border-[#2d4a80] text-[#4f9eff] hover:bg-[#2a4080]'
                  }`}
                >
                  System
                </button>
                <button
                  onClick={() => setActiveTab('location')}
                  className={`px-4.5 py-1.5 text-xs rounded-md transition-all ${
                    activeTab === 'location'
                      ? 'bg-[#2d5090] border border-[#4f9eff] text-[#4f9eff]'
                      : 'bg-[#1e3060] border border-[#2d4a80] text-[#4f9eff] hover:bg-[#2a4080]'
                  }`}
                >
                  Location
                </button>
              </div>
            </div>
            
            <StatusBadge 
              connectionStatus={connectionStatus}
              countdown={countdown}
            />
          </div>
        </header>

        {/* Tab Content */}
        {activeTab === 'system' ? (
          <>
            {/* Ship Section with Energy Flow */}
            {selectedVessel && realtimeData ? (
              <EnergyFlowDiagram 
                vessel={selectedVessel}
                realtimeData={realtimeData}
                countdown={countdown}
              />
            ) : (
              <div className="p-5 text-center text-[#6b7a99]">
                {connectionStatus === 'connecting' ? 'Connecting...' : 'No data available'}
              </div>
            )}

            {/* Runtime Charts */}
            <RuntimeChart 
              vessel={selectedVessel}
              historicalData={historicalData}
            />
          </>
        ) : (
          /* Location Tab */
          <VesselInfoPanel vessel={selectedVessel} />
        )}
      </div>
    </div>
  );
}

export default App;
