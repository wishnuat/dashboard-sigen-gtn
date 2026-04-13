import React from 'react';

/**
 * Vessel Info Panel Component
 * Displays detailed information about selected vessel
 */
export function VesselInfoPanel({ vessel, lastUpdated, countdown }) {
  if (!vessel) {
    return (
      <div className="p-6 text-center text-gray-500">
        Select a vessel to view details
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return 'Never';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Vessel Information
      </h3>

      <div className="space-y-4">
        {/* Vessel Name and ID */}
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Vessel Name
          </label>
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            {vessel.name}
          </p>
        </div>

        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            System ID
          </label>
          <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
            {vessel.id}
          </p>
        </div>

        {/* Location */}
        {(vessel.latitude || vessel.longitude) && (
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Location
            </label>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {vessel.latitude?.toFixed(4)}, {vessel.longitude?.toFixed(4)}
            </p>
          </div>
        )}

        {/* Status */}
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Status
          </label>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              vessel.status === 'online' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : vessel.status === 'maintenance'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {vessel.status}
            </span>
          </div>
        </div>

        {/* Capacities */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">
              PV Capacity
            </label>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {vessel.pvCapacityFormatted || `${(vessel.pvCapacity / 1000).toFixed(1)} kW`}
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">
              Battery Capacity
            </label>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {vessel.batteryCapacityFormatted || `${(vessel.batteryCapacity / 1000).toFixed(1)} kWh`}
            </p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="text-xs text-gray-500 dark:text-gray-400">
            Last Updated
          </label>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {formatDate(lastUpdated)}
          </p>
        </div>

        {/* Countdown */}
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400">
            Next API Refresh
          </label>
          <div className="flex items-center gap-2 mt-1">
            <div className={`text-sm font-mono ${
              countdown < 60 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {formatCountdown(countdown)}
            </div>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  countdown < 60 
                    ? 'bg-red-500' 
                    : countdown < 180
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${(countdown / 300) * 100}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Backend fetches from Sigen API every 5 minutes
          </p>
        </div>
      </div>
    </div>
  );
}

export default VesselInfoPanel;
