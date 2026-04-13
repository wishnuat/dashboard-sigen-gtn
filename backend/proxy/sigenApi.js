import axios from 'axios';
import { getAccessToken } from '../auth/sigenAuth.js';
import NodeCache from 'node-cache';

const API_BASE_URL = 'https://api-apac.sigencloud.com/openapi';
const dataCache = new NodeCache({ stdTTL: 300 }); // 5 menit

/**
 * Helper untuk parsing respons API Sigen yang berbentuk Array
 * Format: [{ code: 0, msg: "success", data: "..." }]
 */
function parseSigenResponse(response) {
  const rawData = response.data;
  
  // 1. Pastikan respons adalah Array
  if (!Array.isArray(rawData) || rawData.length === 0) {
    console.error('[API] Unexpected response format: expected non-empty array', rawData);
    throw new Error('Unexpected response format: expected array');
  }

  const item = rawData[0];
  const { code, msg, data } = item;

  // 2. Cek error code
  if (code !== 0) {
    if (code === 1201) {
      throw new Error(`Sigen Rate Limit (1201): ${msg}`);
    }
    throw new Error(`Sigen API Error: ${msg} (code: ${code})`);
  }

  // 3. Parse data jika berupa string JSON (double encoded)
  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      console.error('[API] Failed to parse nested JSON string', e);
      // Jika gagal parse, kembalikan string asli (fallback)
      parsedData = data; 
    }
  }

  return parsedData;
}

/**
 * Make authenticated request
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

  try {
    const response = await axios(config);
    return parseSigenResponse(response);
  } catch (error) {
    if (error.response) {
      // Coba parse error juga jika bentuknya sama
      const raw = error.response.data;
      if (Array.isArray(raw) && raw[0]?.code === 1201) {
        throw new Error(`Sigen Rate Limit: ${raw[0].msg}`);
      }
    }
    throw error;
  }
}

/**
 * Get System List
 * Endpoint: GET /openapi/system
 */
export async function getSystemList(page = 1, pageSize = 100) {
  const cacheKey = 'systems:list';
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;

  // Sesuai contoh: GET /openapi/system (tanpa parameter page query di contoh, tapi bisa ditambahkan jika perlu)
  // Contoh Anda tidak menunjukkan parameter page pada URL, jadi kita panggil langsung
  const result = await sigenRequest('/system');
  
  // Result dari parseSigenResponse untuk endpoint ini adalah Array of Objects
  // Contoh: [{systemId:...}, {systemId:...}]
  dataCache.set(cacheKey, result);
  return result;
}

/**
 * Get Devices for a System
 * Endpoint: GET /openapi/system/{systemId}/devices
 */
export async function getSystemDevices(systemId) {
  const cacheKey = `devices:${systemId}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;

  const result = await sigenRequest(`/system/${systemId}/devices`);
  // Result adalah Array of Strings (JSON strings) yang sudah di-parse menjadi Array of Objects
  dataCache.set(cacheKey, result);
  return result;
}

/**
 * Get Realtime Info
 * Endpoint: GET /openapi/systems/{systemId}/devices/{serialNumber}/realtimeInfo
 * Note: Perlu loop untuk semua device atau ambil inverter saja
 */
export async function getDeviceRealtimeInfo(systemId, serialNumber) {
  const result = await sigenRequest(`/systems/${systemId}/devices/${serialNumber}/realtimeInfo`);
  // Result adalah Array of Objects (karena setiap item di array respons di-parse)
  return result;
}

/**
 * Get Aggregated Realtime Flow (Custom Logic)
 * Mengambil devices -> cari Inverter -> ambil realtimeInfo
 */
export async function getRealtimeEnergyFlow(systemId) {
  const cacheKey = `flow:${systemId}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;

  try {
    // 1. Ambil daftar device
    const devices = await getSystemDevices(systemId);
    
    // 2. Cari Inverter (biasanya sumber data utama untuk power flow)
    const inverter = devices.find(d => d.deviceType === 'Inverter');
    
    if (!inverter) {
      throw new Error('No Inverter found for system ' + systemId);
    }

    // 3. Ambil realtime info inverter
    // Endpoint: /openapi/systems/{id}/devices/{serial}/realtimeInfo
    // Respons: Array [{ code:0, data: "{...}" }] -> parse jadi Object realtimeInfo
    const realtimeRaw = await sigenRequest(`/systems/${systemId}/devices/${inverter.serialNumber}/realtimeInfo`);
    
    // realtimeRaw adalah array hasil parse, ambil yang pertama (inverter)
    const inverterData = realtimeRaw[0]; 
    
    // Gabungkan dengan info battery jika ada
    const batteries = devices.filter(d => d.deviceType === 'Battery');
    
    const flowData = {
      systemId,
      inverter: inverterData, // Berisi realTimeInfo: { activePower, batSoc, batPower, ... }
      batteries: batteries,
      timestamp: Date.now()
    };

    dataCache.set(cacheKey, flowData);
    return flowData;

  } catch (error) {
    console.error('[API] Error fetching realtime flow:', error.message);
    throw error;
  }
}

/**
 * Get historical data V1
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
    // Endpoint sesuai dokumentasi Sigen OpenAPI
    const result = await sigenRequest('/system/history/data', {
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
 * Get cached data by key
 * @param {string} key - Cache key
 * @returns {any|null}
 */
export function getCachedData(key) {
  return dataCache.get(key) || null;
}

export function clearDataCache() {
  dataCache.flushAll();
}