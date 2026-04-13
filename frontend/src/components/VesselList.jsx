import { useState } from 'react';

/**
 * Sidebar component untuk hierarchical vessel list
 */
export default function VesselList({ vessels, selectedVessel, onSelectVessel }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMenus, setExpandedMenus] = useState({
    companyGroup: true,
    subco1: true,
    'subco1-tugboat': true,
  });

  const toggleMenu = (id) => {
    setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredVessels = vessels.filter(v => 
    !searchTerm || 
    v.systemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.systemId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-69 min-w-69 bg-[#161b27] border-r border-[#2a3045] flex flex-col overflow-y-auto">
      {/* Search Box */}
      <div className="p-3.5 border-b border-[#2a3045]">
        <div className="flex items-center gap-2 bg-[#1e2535] border border-[#2a3045] rounded-lg px-2.5 py-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            placeholder="Search System Name or ID"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-none border-none outline-none text-xs text-[#9aaac8] w-full placeholder-[#4f6080]"
          />
        </div>
      </div>

      {/* Menu Container */}
      <div className="flex-1 overflow-y-auto">
        {filteredVessels.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#4f6080]">
            No vessels available
          </div>
        ) : (
          /* Company Group */
          <div className="border-b border-[#1e2535]">
            <div 
              className={`px-3.5 py-3 cursor-pointer flex items-center justify-between hover:bg-[#1c2233] ${expandedMenus.companyGroup ? 'bg-[#1a2340]' : ''}`}
              onClick={() => toggleMenu('companyGroup')}
            >
              <span className="text-xs font-semibold text-[#c8d8f0] uppercase tracking-wider">
                Meranti Group
              </span>
              <svg 
                className={`w-3.5 h-3.5 stroke-[#6b7a99] stroke-2 transition-transform ${expandedMenus.companyGroup ? 'rotate-90' : ''}`}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
              >
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>

            {expandedMenus.companyGroup && (
              <div className="bg-[#13171f]">
                {/* Sub Company */}
                <div className="px-3.5 py-2.5 cursor-pointer flex items-center justify-between hover:bg-[#1c2233] border-l-2 border-transparent pl-6">
                  <span className="text-[10px] text-[#9aaac8] font-medium">
                    PT. Samudera Empat Sekawan
                  </span>
                  <svg className="w-3.5 h-3.5 stroke-[#6b7a99] stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>

                {/* Vessel Type */}
                <div className="px-3.5 py-2.25 cursor-pointer flex items-center justify-between hover:bg-[#1c2233] border-l-2 border-transparent pl-9">
                  <span className="text-[10px] text-[#8a9abf] font-medium">Tugboat</span>
                  <svg className="w-3.5 h-3.5 stroke-[#6b7a99] stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>

                {/* Vessel Cards */}
                <div className="bg-[#0a0d12]">
                  {filteredVessels.map((vessel) => (
                    <div
                      key={vessel.systemId}
                      onClick={() => onSelectVessel(vessel)}
                      className={`px-3.5 py-2.5 cursor-pointer border-b border-[#0f1117] transition-all border-l-2 pl-12 hover:bg-[#1c2233] ${
                        selectedVessel?.systemId === vessel.systemId 
                          ? 'bg-[#1a2340] border-l-[#3dd68c]' 
                          : 'border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#1e2a42] rounded-md inline-flex items-center justify-center flex-shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f9eff" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="11" rx="2"/>
                            <path d="M8 19h8m-4-5v5"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-[#c8d8f0] truncate">
                            {vessel.systemName}
                          </div>
                          <div className="text-[8px] text-[#4f6080] font-mono">
                            {vessel.systemId}
                          </div>
                          <div className="text-[8px] text-[#6b8aaa]">
                            {(vessel.pvCapacity || 0).toFixed(1)} kWp · {(vessel.batteryCapacity || 0).toFixed(2)} kWh
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
