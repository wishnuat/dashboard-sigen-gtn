import React from 'react';

/**
 * Status Badge Component
 * Displays monitoring status with countdown and system indicators
 */
export function StatusBadge({ 
  isConnected, 
  isConnecting, 
  countdown, 
  generatorStatus, 
  batteryStatus,
  warning 
}) {
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Connection Status */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className={`w-2 h-2 rounded-full ${
          isConnected 
            ? 'bg-green-500 animate-pulse' 
            : isConnecting
            ? 'bg-yellow-500 animate-pulse'
            : 'bg-red-500'
        }`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isConnected ? 'LIVE MONITORING' : isConnecting ? 'CONNECTING' : 'DISCONNECTED'}
        </span>
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
        <svg className="w-4 h-4 text-primary-600 dark:text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm text-primary-700 dark:text-primary-300">
          Auto-refresh in {formatCountdown(countdown)}
        </span>
      </div>

      {/* Generator Status */}
      {generatorStatus?.isRunning && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-energy-generator/10 border border-energy-generator/30 rounded-lg">
          <svg className="w-4 h-4 text-energy-generator" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
          </svg>
          <span className="text-sm font-medium text-energy-generator">
            Generator Running
          </span>
          {generatorStatus.runtimeHours > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({generatorStatus.runtimeHours.toFixed(1)}h total)
            </span>
          )}
        </div>
      )}

      {/* Battery Status */}
      {batteryStatus && batteryStatus !== 'Idle' && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
          batteryStatus === 'Charging'
            ? 'bg-energy-battery/10 border border-energy-battery/30'
            : 'bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700'
        }`}>
          <svg className={`w-4 h-4 ${
            batteryStatus === 'Charging' 
              ? 'text-energy-battery' 
              : 'text-orange-600 dark:text-orange-400'
          }`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
          </svg>
          <span className={`text-sm font-medium ${
            batteryStatus === 'Charging'
              ? 'text-energy-battery'
              : 'text-orange-600 dark:text-orange-400'
          }`}>
            Battery {batteryStatus}
          </span>
        </div>
      )}

      {/* Warning Badge */}
      {warning && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
          <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            {warning}
          </span>
        </div>
      )}
    </div>
  );
}

export default StatusBadge;
