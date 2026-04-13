/**
 * Sigen Energy Dashboard Backend Server
 * 
 * Features:
 * - OAuth2 authentication with Sigen Cloud
 * - Rate-limited API proxy (1 request per 5 minutes per system)
 * - WebSocket broadcasting every 5 seconds
 * - Generator runtime inference and accumulation
 * - Graceful degradation on rate limit errors
 */

import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { getSystemList, getRealtimeEnergyFlow, getHistoricalData, getCachedData } from './proxy/sigenApi.js';
import { updateGeneratorStatus, getGeneratorRuntimeHours, getCachedResponse, cacheResponse } from './cache/dataStore.js';
import { broadcaster } from './ws/broadcaster.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    clientsConnected: broadcaster.getClientCount(),
  });
});

/**
 * GET /api/systems
 * Get list of all systems (vessels)
 */
app.get('/api/systems', async (req, res) => {
  try {
    const result = await getSystemList();
    
    // Map to UI-friendly format
    const systems = result.data?.list?.map(system => ({
      id: system.systemId,
      name: system.systemName || `Vessel ${system.systemId}`,
      pvCapacity: system.pvCapacity || 0,
      batteryCapacity: system.batteryCapacity || 0,
      status: system.status || 'online',
      latitude: system.latitude,
      longitude: system.longitude,
    })) || [];

    res.json({
      success: true,
      data: systems,
      total: result.data?.total || 0,
    });
  } catch (error) {
    console.error('[API] Error fetching systems:', error.message);
    
    // Try to return cached data
    const cached = getCachedResponse('systems:1:100');
    if (cached?.data?.list) {
      const systems = cached.data.list.map(system => ({
        id: system.systemId,
        name: system.systemName || `Vessel ${system.systemId}`,
        pvCapacity: system.pvCapacity || 0,
        batteryCapacity: system.batteryCapacity || 0,
        status: system.status || 'offline',
        latitude: system.latitude,
        longitude: system.longitude,
      }));
      
      return res.json({
        success: true,
        data: systems,
        total: cached.data.total || 0,
        warning: 'Rate limited - showing cached data',
      });
    }
    
    // Return mock data for testing without credentials
    if (process.env.NODE_ENV === 'development' && !process.env.SIGEN_APP_KEY) {
      return res.json({
        success: true,
        data: [
          { id: 'SYS001', name: 'Vessel Alpha', pvCapacity: 5000, batteryCapacity: 10000, status: 'online', latitude: -6.2088, longitude: 106.8456 },
          { id: 'SYS002', name: 'Vessel Beta', pvCapacity: 3500, batteryCapacity: 7500, status: 'online', latitude: -6.1751, longitude: 106.8650 },
          { id: 'SYS003', name: 'Vessel Gamma', pvCapacity: 4200, batteryCapacity: 9000, status: 'maintenance', latitude: -6.2297, longitude: 106.8200 },
        ],
        total: 3,
        warning: 'Mock data - no API credentials configured',
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/system/:id/realtime
 * Get realtime energy flow for a specific system
 */
app.get('/api/system/:id/realtime', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await getRealtimeEnergyFlow(id);
    
    // Extract energy flow data
    const flowData = result.data || {};
    
    // Update generator status based on energy flow
    const gridPower = flowData.gridPower || 0;
    const batterySoc = flowData.batterySoc || 100;
    updateGeneratorStatus(id, gridPower, batterySoc);
    
    // Cache the processed data
    cacheResponse(`realtime:${id}`, flowData);
    
    res.json({
      success: true,
      data: flowData,
      generatorStatus: {
        isRunning: gridPower < -2.0 && batterySoc < 20,
        runtimeHours: getGeneratorRuntimeHours(id),
      },
    });
  } catch (error) {
    console.error(`[API] Error fetching realtime data for ${id}:`, error.message);
    
    // Try cached data
    const cached = getCachedResponse(`realtime:${id}`);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        warning: 'Rate limited - showing cached data',
        generatorStatus: {
          isRunning: (cached.gridPower || 0) < -2.0 && (cached.batterySoc || 100) < 20,
          runtimeHours: getGeneratorRuntimeHours(id),
        },
      });
    }
    
    // Mock data for testing
    if (process.env.NODE_ENV === 'development') {
      const mockData = {
        pvPower: Math.random() * 5000,
        batteryPower: (Math.random() - 0.5) * 3000,
        gridPower: (Math.random() - 0.5) * 4000,
        loadPower: Math.random() * 3000 + 1000,
        batterySoc: Math.floor(Math.random() * 100),
        timestamp: Date.now(),
      };
      
      updateGeneratorStatus(id, mockData.gridPower, mockData.batterySoc);
      
      return res.json({
        success: true,
        data: mockData,
        generatorStatus: {
          isRunning: mockData.gridPower < -2.0 && mockData.batterySoc < 20,
          runtimeHours: getGeneratorRuntimeHours(id),
        },
        warning: 'Mock data',
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/system/:id/history
 * Get historical data for a specific system
 * Query params: period (7d, 14d, 30d), level (Hour, Day, Week, Month)
 */
app.get('/api/system/:id/history', async (req, res) => {
  const { id } = req.params;
  const { period = '7d', level } = req.query;
  
  try {
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    let dataLevel = level;
    
    switch (period.toLowerCase()) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        dataLevel = dataLevel || 'Day';
        break;
      case '14d':
        startDate.setDate(endDate.getDate() - 14);
        dataLevel = dataLevel || 'Day';
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        dataLevel = dataLevel || 'Day';
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
        dataLevel = dataLevel || 'Day';
    }
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    const result = await getHistoricalData(
      id,
      dataLevel,
      formatDate(startDate),
      formatDate(endDate)
    );
    
    res.json({
      success: true,
      data: result.data,
      period,
      level: dataLevel,
    });
  } catch (error) {
    console.error(`[API] Error fetching history for ${id}:`, error.message);
    
    // Mock data for testing
    if (process.env.NODE_ENV === 'development') {
      const mockHistory = {
        dataSeries: [
          { name: 'PV', data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 5000)) },
          { name: 'Battery', data: Array.from({ length: 7 }, () => Math.floor((Math.random() - 0.5) * 3000)) },
          { name: 'Grid', data: Array.from({ length: 7 }, () => Math.floor((Math.random() - 0.5) * 4000)) },
          { name: 'Load', data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 3000 + 1000)) },
        ],
        labels: Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
      };
      
      return res.json({
        success: true,
        data: mockHistory,
        period,
        warning: 'Mock data',
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/cache/stats
 * Get cache statistics (for debugging)
 */
app.get('/api/cache/stats', (req, res) => {
  const { getCacheStats } = require('./cache/dataStore.js');
  res.json({
    success: true,
    data: getCacheStats(),
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket broadcaster
broadcaster.init(server);

// Prepare broadcast data function
const getBroadcastData = () => {
  // This will be populated by the periodic fetch
  return {
    type: 'update',
  };
};

// Start broadcasting
broadcaster.startBroadcast(getBroadcastData);

// Periodic data fetch (every 5 minutes)
let lastFetchTime = 0;
const FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function fetchAndBroadcastData() {
  const now = Date.now();
  
  // Only fetch if 5 minutes have passed
  if (now - lastFetchTime >= FETCH_INTERVAL || lastFetchTime === 0) {
    console.log('[Server] Fetching fresh data from Sigen API...');
    lastFetchTime = now;
    
    try {
      // Fetch systems list
      const systemsResult = await getSystemList().catch(() => null);
      const systems = systemsResult?.data?.list || [];
      
      // Fetch realtime data for each system
      const realtimeData = {};
      const generatorStatus = {};
      
      for (const system of systems.slice(0, 10)) { // Limit to 10 systems
        const systemId = system.systemId;
        
        try {
          const flowResult = await getRealtimeEnergyFlow(systemId);
          const flowData = flowResult.data || {};
          
          realtimeData[systemId] = flowData;
          
          // Update generator status
          const gridPower = flowData.gridPower || 0;
          const batterySoc = flowData.batterySoc || 100;
          updateGeneratorStatus(systemId, gridPower, batterySoc);
          
          generatorStatus[systemId] = {
            isRunning: gridPower < -2.0 && batterySoc < 20,
            runtimeHours: getGeneratorRuntimeHours(systemId),
          };
        } catch (error) {
          console.error(`[Server] Error fetching data for ${systemId}:`, error.message);
          // Use cached data if available
          const cached = getCachedResponse(`realtime:${systemId}`);
          if (cached) {
            realtimeData[systemId] = cached;
          }
        }
      }
      
      // Broadcast to all clients
      broadcaster.broadcast({
        type: 'update',
        systems: systems.map(s => ({
          id: s.systemId,
          name: s.systemName || `Vessel ${s.systemId}`,
          pvCapacity: s.pvCapacity || 0,
          batteryCapacity: s.batteryCapacity || 0,
          status: s.status || 'online',
        })),
        realtime: realtimeData,
        generatorStatus,
        lastUpdated: Date.now(),
        countdown: 300,
      });
      
      console.log('[Server] Data fetched and broadcasted successfully');
    } catch (error) {
      console.error('[Server] Error during data fetch:', error.message);
      
      // Still broadcast something so clients know we're alive
      broadcaster.broadcast({
        type: 'update',
        error: 'Failed to fetch fresh data',
        lastUpdated: Date.now(),
        countdown: 300,
      });
    }
  } else {
    // Just send countdown update with cached data
    const timeUntilFetch = Math.ceil((FETCH_INTERVAL - (now - lastFetchTime)) / 1000);
    
    broadcaster.broadcast({
      type: 'countdown',
      countdown: Math.min(300, timeUntilFetch),
      lastUpdated: lastFetchTime,
    });
  }
}

// Initial fetch
fetchAndBroadcastData();

// Set up periodic fetch (check every 5 seconds, but only fetch every 5 minutes)
setInterval(fetchAndBroadcastData, 5000);

// Heartbeat for WebSocket connections
setInterval(() => {
  broadcaster.heartbeat();
}, 30000); // Every 30 seconds

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║     Sigen Energy Dashboard Backend Server                 ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                            
║  WebSocket endpoint: ws://localhost:${PORT}/ws             
║  REST API: http://localhost:${PORT}/api                    
║                                                            ║
║  Rate Limit: 1 request per 5 minutes per system           ║
║  WebSocket Broadcast: Every 5 seconds                     ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully...');
  broadcaster.close();
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down gracefully...');
  broadcaster.close();
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});
