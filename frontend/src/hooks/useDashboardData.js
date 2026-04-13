import { useState, useEffect, useCallback, useRef } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Mock data for testing without backend connection
 */
const MOCK_SYSTEMS = [
  { id: 'SYS001', name: 'Vessel Alpha', pvCapacity: 5000, batteryCapacity: 10000, status: 'online', latitude: -6.2088, longitude: 106.8456 },
  { id: 'SYS002', name: 'Vessel Beta', pvCapacity: 3500, batteryCapacity: 7500, status: 'online', latitude: -6.1751, longitude: 106.8650 },
  { id: 'SYS003', name: 'Vessel Gamma', pvCapacity: 4200, batteryCapacity: 9000, status: 'maintenance', latitude: -6.2297, longitude: 106.8200 },
];

const generateMockRealtime = () => ({
  pvPower: Math.floor(Math.random() * 5000),
  batteryPower: Math.floor((Math.random() - 0.5) * 3000),
  gridPower: Math.floor((Math.random() - 0.5) * 4000),
  loadPower: Math.floor(Math.random() * 3000 + 1000),
  batterySoc: Math.floor(Math.random() * 100),
  timestamp: Date.now(),
});

const generateMockHistory = (days = 7) => {
  const labels = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  
  return {
    labels,
    dataSeries: [
      { name: 'PV', data: Array.from({ length: days }, () => Math.floor(Math.random() * 5000)) },
      { name: 'Battery', data: Array.from({ length: days }, () => Math.floor((Math.random() - 0.5) * 3000)) },
      { name: 'Grid', data: Array.from({ length: days }, () => Math.floor((Math.random() - 0.5) * 4000)) },
      { name: 'Load', data: Array.from({ length: days }, () => Math.floor(Math.random() * 3000 + 1000)) },
    ],
  };
};

/**
 * Custom hook for dashboard data management
 * Connects to WebSocket for real-time updates
 * Falls back to mock data if connection fails
 * @returns {object} Dashboard state and handlers
 */
export function useDashboardData() {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // State
  const [vesselList, setVesselList] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [energyFlow, setEnergyFlow] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [countdown, setCountdown] = useState(300);
  const [generatorStatus, setGeneratorStatus] = useState({ isRunning: false, runtimeHours: 0 });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [useMockData, setUseMockData] = useState(false);

  /**
   * Connect to WebSocket server
   */
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WS] Already connected');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('[WS] Connected');
        setIsConnected(true);
        setIsConnecting(false);
        setUseMockData(false);
        
        // Fetch initial data
        fetchInitialData();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WS] Message received:', data.type);

          if (data.type === 'update') {
            if (data.systems) {
              setVesselList(data.systems);
            }
            if (data.realtime && selectedSystem) {
              setEnergyFlow(data.realtime[selectedSystem.id] || null);
            }
            if (data.generatorStatus && selectedSystem) {
              setGeneratorStatus(data.generatorStatus[selectedSystem.id] || { isRunning: false, runtimeHours: 0 });
            }
            if (data.lastUpdated) {
              setLastUpdated(new Date(data.lastUpdated));
            }
            if (data.countdown !== undefined) {
              setCountdown(data.countdown);
            }
          } else if (data.type === 'countdown') {
            setCountdown(data.countdown);
            if (data.lastUpdated) {
              setLastUpdated(new Date(data.lastUpdated));
            }
          }
        } catch (err) {
          console.error('[WS] Error parsing message:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        setIsConnected(false);
        
        // Attempt reconnection after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WS] Attempting reconnection...');
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        setError('WebSocket connection failed');
        setIsConnected(false);
        setIsConnecting(false);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[WS] Connection error:', err);
      setError('Failed to connect to server');
      setIsConnecting(false);
      setUseMockData(true);
    }
  }, [selectedSystem]);

  /**
   * Disconnect WebSocket
   */
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  /**
   * Fetch initial data from REST API
   */
  const fetchInitialData = async () => {
    try {
      // Fetch systems list
      const systemsRes = await fetch(`${API_URL}/systems`);
      const systemsData = await systemsRes.json();
      
      if (systemsData.success && systemsData.data.length > 0) {
        setVesselList(systemsData.data);
        if (!selectedSystem) {
          setSelectedSystem(systemsData.data[0]);
        }
      } else if (systemsData.warning) {
        setWarning(systemsData.warning);
      }
    } catch (err) {
      console.error('[API] Error fetching initial data:', err);
      // Use mock data on error
      setVesselList(MOCK_SYSTEMS);
      if (!selectedSystem) {
        setSelectedSystem(MOCK_SYSTEMS[0]);
      }
      setUseMockData(true);
    }
  };

  /**
   * Fetch historical data for selected system
   */
  const fetchHistoricalData = async (period = '7d') => {
    if (!selectedSystem) return;

    try {
      const res = await fetch(`${API_URL}/system/${selectedSystem.id}/history?period=${period}`);
      const data = await res.json();
      
      if (data.success) {
        setHistoricalData({
          ...data.data,
          period,
        });
      }
    } catch (err) {
      console.error('[API] Error fetching historical data:', err);
      // Use mock data
      setHistoricalData({
        ...generateMockHistory(period === '14d' ? 14 : period === '30d' ? 30 : 7),
        period,
        warning: 'Mock data',
      });
    }
  };

  /**
   * Select a system/vessel
   */
  const selectSystem = useCallback((system) => {
    setSelectedSystem(system);
    setEnergyFlow(null);
    setGeneratorStatus({ isRunning: false, runtimeHours: 0 });
    
    // Fetch realtime data for selected system
    if (isConnected) {
      // Data will come via WebSocket
    } else {
      // Fetch via REST API
      fetch(`${API_URL}/system/${system.id}/realtime`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setEnergyFlow(data.data);
            setGeneratorStatus(data.generatorStatus || { isRunning: false, runtimeHours: 0 });
          }
        })
        .catch(err => {
          console.error('[API] Error fetching realtime:', err);
          setEnergyFlow(generateMockRealtime());
        });
    }
    
    // Fetch historical data
    fetchHistoricalData('7d');
  }, [isConnected]);

  /**
   * Initialize dashboard
   */
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  /**
   * Update countdown locally every second
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) return 300;
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  /**
   * Generate mock energy flow for demo
   */
  useEffect(() => {
    if (useMockData && selectedSystem) {
      const interval = setInterval(() => {
        setEnergyFlow(generateMockRealtime());
        setCountdown(prev => {
          if (prev <= 1) return 300;
          return prev - 1;
        });
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [useMockData, selectedSystem]);

  return {
    // State
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
    useMockData,
    
    // Actions
    connectWebSocket,
    disconnectWebSocket,
    selectSystem,
    fetchHistoricalData,
    setError,
    setWarning,
  };
}
