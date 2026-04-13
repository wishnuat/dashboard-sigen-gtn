import axios from 'axios';
import { getAccessToken } from '../auth/sigenAuth.js';
import NodeCache from 'node-cache';

const API_BASE_URL = 'https://api-apac.sigencloud.com';
const dataCache = new NodeCache({ stdTTL: 300 }); // 300 seconds TTL

/**
 * Retry with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<any>}
 */
async function retryWithBackoff(fn, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Handle rate limit error (1110)
      if (error.response?.data?.code === 1110) {
        console.log(`[API] Rate limited, attempt ${attempt}/${maxRetries}`);
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30s
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Make authenticated request to Sigen API
 * @param {string} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @param {string} method - HTTP method
 * @param {object} data - Request body
 * @returns {Promise<any>}
 */
export async function sigenRequest(endpoint, params = {}, method = 'GET', data = null) {
  const token = await getAccessToken();
  
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    method,
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    params: method === 'GET' ? params : undefined,
    data: method !== 'GET' ? data : undefined,
  };

  return retryWithBackoff(async () => {
    const response = await axios(config);
    
    // Handle different response structures
    const responseData = response.data;
    
    // Check for error codes in various formats
    if (responseData.code && responseData.code !== 0 && responseData.code !== 200) {
      throw new Error(`Sigen API Error: ${responseData.msg || responseData.message} (code: ${responseData.code})`);
    }
    
    return responseData;
  });
}

/**
 * Get system list (vessels)
 * GET /openapi/system
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @returns {Promise<any>}
 */
export async function getSystemList(page = 1, pageSize = 100) {
  const cacheKey = `systems:${page}:${pageSize}`;
  const cached = dataCache.get(cacheKey);
  
  if (cached) {
    console.log('[API] Returning cached system list');
    return cached;
  }

  try {
    // Using the endpoint structure you provided: GET /openapi/system
    const result = await sigenRequest('/openapi/system', { page, pageSize });
    dataCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('[API] Failed to fetch system list:', error.message);
    // Return cached data on error if available
    const fallback = dataCache.get(cacheKey);
    if (fallback) {
      console.log('[API] Returning stale cache due to error');
      return fallback;
    }
    throw error;
  }
}

/**
 * Get realtime energy flow data
 * @param {string} systemId - System ID
 * @returns {Promise<any>}
 */
export async function getRealtimeEnergyFlow(systemId) {
  const cacheKey = `realtime:${systemId}`;
  const cached = dataCache.get(cacheKey);
  
  if (cached) {
    console.log('[API] Returning cached realtime data');
    return cached;
  }

  try {
    // Adjust endpoint based on actual API - common patterns
    const result = await sigenRequest('/openapi/system/realtime', { systemId });
    dataCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('[API] Failed to fetch realtime data:', error.message);
    const fallback = dataCache.get(cacheKey);
    if (fallback) {
      console.log('[API] Returning stale cache due to error');
      return fallback;
    }
    throw error;
  }
}

/**
 * Get historical data
 * @param {string} systemId - System ID
 * @param {string} level - Data level: Hour, Day, Week, Month
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<any>}
 */
export async function getHistoricalData(systemId, level, startDate, endDate) {
  const cacheKey = `history:${systemId}:${level}:${startDate}:${endDate}`;
  const cached = dataCache.get(cacheKey);
  
  if (cached) {
    console.log('[API] Returning cached historical data');
    return cached;
  }

  try {
    // Adjust endpoint based on actual API
    const result = await sigenRequest('/openapi/system/history', {
      systemId,
      level,
      startDate,
      endDate,
    });
    dataCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('[API] Failed to fetch historical data:', error.message);
    const fallback = dataCache.get(cacheKey);
    if (fallback) {
      console.log('[API] Returning stale cache due to error');
      return fallback;
    }
    throw error;
  }
}

/**
 * Get cached data or null
 * @param {string} key - Cache key
 * @returns {any|null}
 */
export function getCachedData(key) {
  return dataCache.get(key) || null;
}

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 */
export function setCachedData(key, value, ttl = 300) {
  dataCache.set(key, value, ttl);
}

/**
 * Clear all data cache
 */
export function clearDataCache() {
  dataCache.flushAll();
  console.log('[API] Data cache cleared');
}
