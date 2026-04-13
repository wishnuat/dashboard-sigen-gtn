/**
 * Status Badge Component - Menampilkan status koneksi dan countdown
 */
export default function StatusBadge({ connectionStatus, countdown }) {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': 
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'LIVE MONITORING';
      case 'connecting': return 'CONNECTING';
      case 'error': return 'CONNECTION ERROR';
      case 'disconnected': return 'DISCONNECTED';
      default: return 'UNKNOWN';
    }
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Connection Status */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getStatusText()}
        </span>
      </div>

      {/* Countdown Timer */}
      {connectionStatus === 'connected' && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          <svg className="w-4 h-4 text-primary-600 dark:text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-primary-700 dark:text-primary-300">
            Auto-refresh in 0:{countdown.toString().padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  );
}
