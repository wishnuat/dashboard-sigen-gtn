/**
 * Vessel Info Panel - Tab Location dengan informasi vessel dan peta
 */
export default function VesselInfoPanel({ vessel }) {
  if (!vessel) {
    return (
      <div className="p-5">
        <div className="text-center text-[#6b7a99]">Select a vessel to view location</div>
      </div>
    );
  }

  return (
    <div className="p-5">
      {/* Vessel Info Card */}
      <div className="bg-[#131a28] border border-[#1e2a3a] rounded-lg p-3 mb-3">
        <div className="text-xs text-[#6b7a99] font-medium uppercase mb-2">Vessel Information</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0f1117] rounded-md p-2">
            <div className="text-[9px] text-[#4f6080] mb-0.5">Vessel Name</div>
            <div className="text-xs text-[#c8d8f0] font-medium">{vessel.systemName || 'N/A'}</div>
          </div>
          <div className="bg-[#0f1117] rounded-md p-2">
            <div className="text-[9px] text-[#4f6080] mb-0.5">Vessel ID</div>
            <div className="text-xs text-[#c8d8f0] font-medium font-mono">{vessel.systemId || 'N/A'}</div>
          </div>
          <div className="bg-[#0f1117] rounded-md p-2">
            <div className="text-[9px] text-[#4f6080] mb-0.5">Current Status</div>
            <div className="text-xs text-[#3dd68c] font-medium">Active</div>
          </div>
          <div className="bg-[#0f1117] rounded-md p-2">
            <div className="text-[9px] text-[#4f6080] mb-0.5">Address</div>
            <div className="text-xs text-[#c8d8f0] font-medium">{vessel.addr || 'Unknown'}</div>
          </div>
          <div className="bg-[#0f1117] rounded-md p-2">
            <div className="text-[9px] text-[#4f6080] mb-0.5">PV Capacity</div>
            <div className="text-xs text-[#c8d8f0] font-medium">{(vessel.pvCapacity || 0).toFixed(1)} kWp</div>
          </div>
          <div className="bg-[#0f1117] rounded-md p-2">
            <div className="text-[9px] text-[#4f6080] mb-0.5">Battery Capacity</div>
            <div className="text-xs text-[#c8d8f0] font-medium">{(vessel.batteryCapacity || 0).toFixed(2)} kWh</div>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="w-full h-[500px] bg-[#131a28] border border-[#1e2a3a] rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center text-[#4f6080]">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="text-sm">Map integration requires Google Maps API key</div>
          <div className="text-xs mt-1">Location: {vessel.addr || 'Unknown'}</div>
        </div>
      </div>
    </div>
  );
}
