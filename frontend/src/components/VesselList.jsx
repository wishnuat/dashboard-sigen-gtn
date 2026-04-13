import React from 'react';

/**
 * Vessel List Sidebar Component
 * Displays list of vessels/systems with status indicators
 */
export function VesselList({ vessels, selectedSystem, onSelect }) {
  if (!vessels || vessels.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No vessels available
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Vessels
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {vessels.length} system{vessels.length !== 1 ? 's' : ''} connected
        </p>
      </div>
      
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {vessels.map((vessel) => (
          <li key={vessel.id}>
            <button
              onClick={() => onSelect(vessel)}
              className={`w-full p-4 text-left transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                selectedSystem?.id === vessel.id
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
                  : 'border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {vessel.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ID: {vessel.id}
                  </p>
                </div>
                
                <StatusBadge status={vessel.status} />
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">PV:</span> {vessel.pvCapacityFormatted || `${(vessel.pvCapacity / 1000).toFixed(1)} kW`}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Battery:</span> {vessel.batteryCapacityFormatted || `${(vessel.batteryCapacity / 1000).toFixed(1)} kWh`}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Status Badge Component
 * Shows vessel/system status with color coding
 */
function StatusBadge({ status }) {
  const statusConfig = {
    online: { color: 'bg-green-500', label: 'Online' },
    offline: { color: 'bg-red-500', label: 'Offline' },
    maintenance: { color: 'bg-yellow-500', label: 'Maintenance' },
    warning: { color: 'bg-orange-500', label: 'Warning' },
  };

  const config = statusConfig[status] || statusConfig.offline;

  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
        {config.label}
      </span>
    </div>
  );
}

export default VesselList;
