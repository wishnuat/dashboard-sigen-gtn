/**
 * Utility mapper untuk transformasi data dari Sigen API ke format UI
 */

/**
 * Map data sistem/vessel dari API ke format UI
 */
export function mapSystemData(apiData) {
  if (!apiData || !apiData.data) return [];
  
  // Handle nested JSON string jika ada
  let systems = apiData.data;
  if (typeof systems === 'string') {
    try {
      systems = JSON.parse(systems);
    } catch (e) {
      console.error('[Mapper] Failed to parse nested JSON:', e);
      return [];
    }
  }
  
  return systems.map(sys => ({
    systemId: sys.systemId,
    systemName: sys.systemName,
    addr: sys.addr,
    status: sys.status,
    isActivate: sys.isActivate,
    onOffGridStatus: sys.onOffGridStatus,
    pvCapacity: sys.pvCapacity || 0,
    batteryCapacity: sys.batteryCapacity || 0,
    timeZone: sys.timeZone,
  }));
}

/**
 * Map realtime energy flow data ke format UI
 */
export function mapRealtimeData(apiData, devices) {
  if (!apiData || !apiData.data) return null;
  
  // Parse data jika berupa string
  let data = apiData.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error('[Mapper] Failed to parse realtime data:', e);
      return null;
    }
  }
  
  // Extract key metrics
  const batSoc = parseFloat(data.batSoc) || 0;
  const batPower = parseFloat(data.batPower) || 0;
  const pcsActivePower = parseFloat(data.pcsActivePower) || 0;
  const pvPower = parseFloat(data.pvPower) || 0;
  
  // Determine battery state
  const batteryState = batPower > 0 ? 'charging' : batPower < 0 ? 'discharging' : 'idle';
  
  // Generator inference: ON jika gridPower < -2kW dan batterySoc < 20%
  // Karena tidak ada gridPower di data, kita infer dari PCS active power dan SOC
  const isGenOn = batSoc < 20 && pcsActivePower > 2;
  
  return {
    soc: batSoc,
    batteryPower: Math.abs(batPower),
    batteryState,
    pcsActivePower,
    pvPower,
    isGenOn,
    genLoad: isGenOn ? pcsActivePower : 0,
    genCharge: isGenOn && batPower > 0 ? batPower : 0,
    battLoad: !isGenOn && batPower < 0 ? Math.abs(batPower) : 0,
    timestamp: Date.now(),
  };
}

/**
 * Map historical data ke format chart
 */
export function mapHistoricalData(apiData, level) {
  if (!apiData || !apiData.data || !apiData.data.dataSeries) return [];
  
  const series = apiData.data.dataSeries;
  const labels = series[0]?.data?.map(item => item.x) || [];
  
  // Ambil data battery dan generator dari series
  const batteryData = series.find(s => s.name?.includes('battery'))?.data?.map(d => d.y) || [];
  const generatorData = series.find(s => s.name?.includes('generator'))?.data?.map(d => d.y) || [];
  
  return labels.map((label, idx) => ({
    day: label,
    battery: batteryData[idx] || 0,
    generator: generatorData[idx] || 0,
  }));
}

/**
 * Format power value dengan satuan
 */
export function formatPower(kw) {
  if (!kw && kw !== 0) return '0 kW';
  const value = Math.abs(kw);
  return `${value.toFixed(1)} kW`;
}

/**
 * Format energy value dengan satuan
 */
export function formatEnergy(kwh) {
  if (!kwh && kwh !== 0) return '0 kWh';
  return `${kwh.toFixed(2)} kWh`;
}

/**
 * Get status badge color berdasarkan SOC
 */
export function getSocColor(soc) {
  if (soc > 60) return '#3dd68c'; // green
  if (soc > 30) return '#f0b840'; // amber
  return '#e05050'; // red
}
