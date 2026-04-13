/**
 * Data mapper for Sigen API responses to UI format
 */

/**
 * Map battery power status to human-readable status
 * @param {number} batteryPower - Battery power in W (positive = charging, negative = discharging)
 * @returns {string} Battery status
 */
export function mapBatteryStatus(batteryPower) {
  if (!batteryPower && batteryPower !== 0) return 'Idle';
  
  const powerKw = batteryPower / 1000;
  
  if (powerKw > 0.1) return 'Charging';
  if (powerKw < -0.1) return 'Discharging';
  return 'Idle';
}

/**
 * Map grid power status to human-readable status
 * @param {number} gridPower - Grid power in W (positive = export, negative = import)
 * @returns {string} Grid status
 */
export function mapGridStatus(gridPower) {
  if (!gridPower && gridPower !== 0) return 'Disconnected';
  
  const powerKw = gridPower / 1000;
  
  if (powerKw > 0.1) return 'Export to Grid';
  if (powerKw < -0.1) return 'Import from Grid';
  return 'Neutral';
}

/**
 * Format power value for display
 * @param {number} value - Power value in W
 * @returns {string} Formatted power string
 */
export function formatPower(value) {
  if (value === null || value === undefined) return '0 kW';
  
  const kw = value / 1000;
  const absKw = Math.abs(kw);
  
  if (absKw >= 1000) {
    return `${(kw / 1000).toFixed(2)} MW`;
  }
  
  return `${kw.toFixed(2)} kW`;
}

/**
 * Format energy value for display
 * @param {number} value - Energy value in Wh
 * @returns {string} Formatted energy string
 */
export function formatEnergy(value) {
  if (value === null || value === undefined) return '0 kWh';
  
  const kwh = value / 1000;
  const absKwh = Math.abs(kwh);
  
  if (absKwh >= 1000) {
    return `${(kwh / 1000).toFixed(2)} MWh`;
  }
  
  return `${kwh.toFixed(2)} kWh`;
}

/**
 * Format percentage value
 * @param {number} value - Percentage value (0-100)
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value) {
  if (value === null || value === undefined) return '0%';
  return `${Math.round(value)}%`;
}

/**
 * Map Sigen realtime data to UI format
 * @param {object} data - Raw Sigen realtime data
 * @returns {object} Mapped data for UI
 */
export function mapRealtimeData(data) {
  if (!data) return null;
  
  return {
    pvPower: data.pvPower || 0,
    pvPowerFormatted: formatPower(data.pvPower),
    
    batteryPower: data.batteryPower || 0,
    batteryPowerFormatted: formatPower(data.batteryPower),
    batteryStatus: mapBatteryStatus(data.batteryPower),
    batterySoc: data.batterySoc || 0,
    batterySocFormatted: formatPercentage(data.batterySoc),
    
    gridPower: data.gridPower || 0,
    gridPowerFormatted: formatPower(data.gridPower),
    gridStatus: mapGridStatus(data.gridPower),
    
    loadPower: data.loadPower || 0,
    loadPowerFormatted: formatPower(data.loadPower),
    
    timestamp: data.timestamp || Date.now(),
  };
}

/**
 * Map Sigen system list to UI format
 * @param {array} systems - Raw Sigen system list
 * @returns {array} Mapped systems for UI
 */
export function mapSystemList(systems) {
  if (!Array.isArray(systems)) return [];
  
  return systems.map(system => ({
    id: system.id || system.systemId,
    name: system.name || system.systemName || `Vessel ${system.systemId || 'Unknown'}`,
    pvCapacity: system.pvCapacity || 0,
    pvCapacityFormatted: formatPower(system.pvCapacity),
    batteryCapacity: system.batteryCapacity || 0,
    batteryCapacityFormatted: formatEnergy(system.batteryCapacity),
    status: system.status || 'offline',
    latitude: system.latitude,
    longitude: system.longitude,
  }));
}

/**
 * Map historical data to chart format
 * @param {object} historyData - Raw Sigen historical data
 * @returns {object} Mapped data for Recharts
 */
export function mapHistoricalData(historyData) {
  if (!historyData) return { labels: [], series: [] };
  
  const labels = historyData.labels || [];
  const dataSeries = historyData.dataSeries || [];
  
  // Transform to array of objects for Recharts
  const chartData = labels.map((label, index) => {
    const point = {
      name: label,
      timestamp: label, // Keep original label as timestamp
    };
    
    dataSeries.forEach(series => {
      point[series.name] = series.data[index] || 0;
    });
    
    return point;
  });
  
  return {
    labels,
    series: dataSeries,
    chartData,
  };
}

/**
 * Get color for energy type
 * @param {string} type - Energy type (pv, battery, grid, load, generator)
 * @returns {string} Tailwind color class
 */
export function getEnergyColor(type) {
  const colors = {
    pv: 'text-energy-pv',
    battery: 'text-energy-battery',
    grid: 'text-energy-grid',
    load: 'text-energy-load',
    generator: 'text-energy-generator',
  };
  
  return colors[type] || 'text-gray-500';
}

/**
 * Get background color for energy type
 * @param {string} type - Energy type
 * @returns {string} Tailwind bg color class
 */
export function getEnergyBgColor(type) {
  const colors = {
    pv: 'bg-energy-pv',
    battery: 'bg-energy-battery',
    grid: 'bg-energy-grid',
    load: 'bg-energy-load',
    generator: 'bg-energy-generator',
  };
  
  return colors[type] || 'bg-gray-500';
}
