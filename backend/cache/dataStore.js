import NodeCache from 'node-cache';

const dataCache = new NodeCache({ stdTTL: 300 }); // 300 seconds default TTL

/**
 * Generator state storage
 * Tracks inferred generator status and runtime accumulation per system
 */
const generatorState = new Map();

/**
 * Get or initialize generator state for a system
 * @param {string} systemId - System ID
 * @returns {object} Generator state
 */
export function getGeneratorState(systemId) {
  if (!generatorState.has(systemId)) {
    generatorState.set(systemId, {
      isRunning: false,
      totalRuntimeMs: 0,
      lastStatusChange: Date.now(),
      lastCheck: Date.now(),
    });
  }
  return generatorState.get(systemId);
}

/**
 * Infer generator status from energy flow data
 * Logic: Generator ON when gridPower < -2.0kW AND batterySoc < 20%
 * @param {number} gridPower - Grid power in kW (negative = import)
 * @param {number} batterySoc - Battery state of charge percentage
 * @param {string} systemId - System ID
 * @returns {object} Updated generator state
 */
export function updateGeneratorStatus(systemId, gridPower, batterySoc) {
  const state = getGeneratorState(systemId);
  const now = Date.now();
  
  // Infer generator status
  // gridPower < 0 means importing from grid/generator
  // Strong negative grid power + low battery suggests generator is running
  const shouldbeRunning = gridPower < -2.0 && batterySoc < 20;
  
  // Status changed
  if (shouldbeRunning !== state.isRunning) {
    // Accumulate runtime for previous state
    const elapsed = now - state.lastStatusChange;
    
    if (state.isRunning) {
      // Was running, now stopping
      state.totalRuntimeMs += elapsed;
    }
    
    state.isRunning = shouldbeRunning;
    state.lastStatusChange = now;
    
    console.log(`[DataStore] System ${systemId}: Generator ${shouldbeRunning ? 'STARTED' : 'STOPPED'}`);
  }
  
  state.lastCheck = now;
  return state;
}

/**
 * Get accumulated generator runtime in hours
 * @param {string} systemId - System ID
 * @returns {number} Runtime in hours
 */
export function getGeneratorRuntimeHours(systemId) {
  const state = getGeneratorState(systemId);
  const now = Date.now();
  
  let totalMs = state.totalRuntimeMs;
  
  // Add current running session if generator is currently on
  if (state.isRunning) {
    totalMs += now - state.lastStatusChange;
  }
  
  return totalMs / (1000 * 60 * 60); // Convert to hours
}

/**
 * Cache Sigen API response with TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 */
export function cacheResponse(key, value, ttl = 300) {
  dataCache.set(key, value, ttl);
}

/**
 * Get cached response
 * @param {string} key - Cache key
 * @returns {any|null} Cached value or null
 */
export function getCachedResponse(key) {
  return dataCache.get(key) || null;
}

/**
 * Get all cache keys
 * @returns {string[]} Array of cache keys
 */
export function getCacheKeys() {
  return dataCache.keys();
}

/**
 * Delete specific cache entry
 * @param {string} key - Cache key
 */
export function deleteCacheEntry(key) {
  dataCache.del(key);
}

/**
 * Clear all caches
 */
export function clearAllCaches() {
  dataCache.flushAll();
  generatorState.clear();
  console.log('[DataStore] All caches cleared');
}

/**
 * Get cache statistics
 * @returns {object} Cache stats
 */
export function getCacheStats() {
  const stats = dataCache.getStats();
  return {
    keys: dataCache.keys().length,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits / (stats.hits + stats.misses + 0.001),
  };
}
