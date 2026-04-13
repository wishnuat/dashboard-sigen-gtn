import WebSocket from 'ws';

/**
 * WebSocket Broadcaster for Sigen Energy Dashboard
 * Broadcasts cached data to all connected clients every 5 seconds
 */
export class DataBroadcaster {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.broadcastInterval = null;
    this.countdown = 300; // 5 minutes countdown
  }

  /**
   * Initialize WebSocket server
   * @param {import('http').Server} httpServer - HTTP server to attach to
   */
  init(httpServer) {
    this.wss = new WebSocket.WebSocketServer({ 
      server: httpServer,
      path: '/ws'
    });

    this.wss.on('connection', (ws) => {
      this.handleConnection(ws);
    });

    console.log('[WebSocket] Server initialized on /ws');
  }

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket client
   */
  handleConnection(ws) {
    console.log('[WebSocket] Client connected');
    this.clients.add(ws);

    // Send initial data immediately
    this.sendToClient(ws, {
      type: 'connected',
      message: 'Connected to Sigen Energy Dashboard',
      timestamp: Date.now(),
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Client error:', error.message);
      this.handleDisconnect(ws);
    });

    ws.on('pong', () => {
      ws.isAlive = true;
    });
  }

  /**
   * Handle client disconnect
   * @param {WebSocket} ws - WebSocket client
   */
  handleDisconnect(ws) {
    this.clients.delete(ws);
    console.log(`[WebSocket] Client disconnected. Remaining clients: ${this.clients.size}`);
  }

  /**
   * Send data to specific client
   * @param {WebSocket} ws - WebSocket client
   * @param {object} data - Data to send
   */
  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Broadcast data to all connected clients
   * @param {object} data - Data to broadcast
   */
  broadcast(data) {
    const message = JSON.stringify(data);
    let sentCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        sentCount++;
      }
    });

    if (sentCount > 0) {
      console.log(`[WebSocket] Broadcast to ${sentCount} client(s)`);
    }
  }

  /**
   * Start broadcasting loop
   * @param {Function} getDataFn - Function to get current data to broadcast
   */
  startBroadcast(getDataFn) {
    // Reset countdown
    this.countdown = 300;

    this.broadcastInterval = setInterval(() => {
      // Decrement countdown
      this.countdown = Math.max(0, this.countdown - 5);

      // Get current data
      const data = getDataFn();
      
      // Add countdown and timestamp
      const broadcastData = {
        ...data,
        countdown: this.countdown,
        timestamp: Date.now(),
      };

      this.broadcast(broadcastData);

      // Reset countdown when it reaches 0
      if (this.countdown === 0) {
        this.countdown = 300;
      }
    }, 5000); // Every 5 seconds

    console.log('[WebSocket] Broadcasting started (5s interval)');
  }

  /**
   * Stop broadcasting loop
   */
  stopBroadcast() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
      console.log('[WebSocket] Broadcasting stopped');
    }
  }

  /**
   * Heartbeat check - ping all clients
   */
  heartbeat() {
    this.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return this.handleDisconnect(ws);
      }
      ws.isAlive = false;
      ws.ping();
    });
  }

  /**
   * Get number of connected clients
   * @returns {number}
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Close all connections and stop server
   */
  close() {
    this.stopBroadcast();
    
    this.clients.forEach((client) => {
      client.close(1000, 'Server shutting down');
    });
    
    if (this.wss) {
      this.wss.close();
      console.log('[WebSocket] Server closed');
    }
  }
}

// Export singleton instance
export const broadcaster = new DataBroadcaster();
