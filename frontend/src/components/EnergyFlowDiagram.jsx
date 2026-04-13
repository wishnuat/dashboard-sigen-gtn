/**
 * Energy Flow Diagram dengan SVG ship dan animasi aliran energi
 */
export default function EnergyFlowDiagram({ vessel, realtimeData, countdown }) {
  const { 
    isGenOn = false, 
    genLoad = 0, 
    genCharge = 0, 
    battLoad = 0, 
    soc = 0,
    generatorStatus = {}
  } = realtimeData || {};

  const genSupply = isGenOn ? (genLoad - genCharge) : 0;

  return (
    <div className="px-5 py-3.5 border-b border-[#1e2535]">
      {/* Ship Canvas */}
      <div className="w-full h-52 bg-[#0d1320] rounded-lg overflow-hidden mb-2.5 relative">
        <svg width="100%" height="210" viewBox="0 0 680 210" xmlns="http://www.w3.org/2000/svg">
          <rect width="680" height="210" fill="#0d1320"/>
          
          {/* Ship Hull */}
          <ellipse cx="340" cy="195" rx="285" ry="18" fill="#0d2040" opacity="0.45"/>
          <path d="M75 155 L98 115 L582 115 L605 155 L560 172 L120 172 Z" fill="#1a2a45" stroke="#2a3d5e" strokeWidth="1.5"/>
          <path d="M120 115 L132 85 L438 85 L450 115" fill="#1e3255" stroke="#2a3d5e" strokeWidth="1"/>
          
          {/* Home Load Box */}
          <rect x="170" y="120" width="68" height="28" rx="3" fill="#12243a" stroke="#1a3555" strokeWidth="1"/>
          <text x="188" y="137" fontSize="9" fill="#8aaac8" fontWeight="500">HOME</text>
          
          {/* SigenStor Battery */}
          <rect x="460" y="80" width="72" height="52" rx="4" fill="#0f2535" stroke="#1e3d50" strokeWidth="1"/>
          <rect x="466" y="85" width="28" height="42" rx="3" fill="#1a3a55" stroke="#2a5070" strokeWidth="0.8"/>
          <rect x="498" y="85" width="27" height="42" rx="3" fill="#f5f6f8" stroke="#dde0e8" strokeWidth="0.8"/>
          <text x="500" y="105" fontSize="6" fill="#334" fontWeight="500">Sigen</text>
          <text x="501" y="115" fontSize="6" fill="#334">Stor</text>
          <text x="452" y="76" fontSize="9" fill="#3dd68c" fontWeight="500">SigenStor</text>
          
          {/* Energy Flow Paths */}
          {/* Generator to Battery */}
          <path 
            id="genToBattPath" 
            d="M498 106 Q485 106 475 106" 
            stroke="#f0b840" 
            strokeWidth="2.5" 
            fill="none" 
            opacity={isGenOn ? "0.9" : "0"}
            strokeDasharray="3 2"
            className={isGenOn ? "flow-active" : ""}
          />
          
          {/* Generator to Load */}
          <path 
            id="genToLoadPath" 
            d="M498 106 Q460 106 400 106 L250 106 Q230 106 220 118" 
            stroke="#f0b840" 
            strokeWidth="2.5" 
            fill="none" 
            opacity={isGenOn ? "0.9" : "0"}
            strokeDasharray="3 2"
            className={isGenOn ? "flow-active" : ""}
          />
          
          {/* Battery to Load */}
          <path 
            id="battToLoadPath" 
            d="M475 106 Q400 106 250 106 Q230 106 220 118" 
            stroke="#3dd68c" 
            strokeWidth="2.5" 
            fill="none" 
            opacity={!isGenOn ? "0.9" : "0"}
            strokeDasharray="3 2"
            className={!isGenOn ? "flow-active" : ""}
          />
          
          {/* Labels */}
          <text 
            x="510" 
            y="68" 
            fontSize="8" 
            fill="#f0b840" 
            fontWeight="500" 
            opacity={isGenOn ? "1" : "0"}
          >
            {genLoad.toFixed(1)} kW
          </text>
          
          <text 
            x="455" 
            y="68" 
            fontSize="8" 
            fill="#3dd68c" 
            fontWeight="500" 
            opacity={!isGenOn ? "1" : "0"}
          >
            {battLoad.toFixed(1)} kW
          </text>
          
          <text 
            x="475" 
            y="98" 
            fontSize="7" 
            fill="#f0b840" 
            opacity={isGenOn ? "1" : "0"}
          >
            Charging +{genCharge.toFixed(1)}kW
          </text>
          
          <text 
            x="30" 
            y="100" 
            fontSize="10" 
            fill={isGenOn ? "#f0b840" : "#3dd68c"} 
            fontWeight="500"
          >
            {isGenOn ? 'Generator ON — Charging & Supply' : 'Battery ON — Discharging'}
          </text>
          
          {/* Pulse Dot */}
          <circle cx="205" cy="134" r="2" fill={isGenOn ? "#f0b840" : "#3dd68c"} className="pulse-dot"/>
        </svg>

        {/* Realtime Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-[rgba(10,16,28,0.88)] px-3.5 py-2 flex gap-4 flex-wrap items-center border-t border-[#1e2a3a]">
          {/* Generator Load */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-[#4f6080] uppercase tracking-wider">Generator Load</span>
            <span className={`text-sm font-medium ${isGenOn ? 'text-[#f0b840]' : 'text-[#5a6a80]'}`}>
              {isGenOn ? `${genLoad.toFixed(1)} kW` : '0 kW'}
            </span>
            <span className="text-[8px] text-[#4f6080]">
              {isGenOn ? `Load ${genSupply.toFixed(1)}kW + Charge ${genCharge.toFixed(1)}kW` : 'Standby / OFF'}
            </span>
          </div>
          
          <div className="w-px bg-[#1e2a3a] self-stretch"></div>
          
          {/* Battery Load */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-[#4f6080] uppercase tracking-wider">Battery Load</span>
            <span className={`text-sm font-medium ${!isGenOn ? 'text-[#3dd68c]' : 'text-[#5a6a80]'}`}>
              {!isGenOn ? `${battLoad.toFixed(1)} kW` : '0 kW'}
            </span>
            <span className="text-[8px] text-[#4f6080]">
              {!isGenOn ? 'Discharging to load' : 'Being Charged'}
            </span>
          </div>
          
          <div className="w-px bg-[#1e2a3a] self-stretch"></div>
          
          {/* Charging */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-[#4f6080] uppercase tracking-wider">Charging</span>
            <span className="text-sm font-medium text-[#5a6a80]">
              {isGenOn ? `${genCharge.toFixed(1)} kW` : '0 kW'}
            </span>
          </div>
          
          <div className="w-px bg-[#1e2a3a] self-stretch"></div>
          
          {/* Battery SOC */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-[#4f6080] uppercase tracking-wider">Battery SOC</span>
            <span className={`text-sm font-medium ${soc > 60 ? 'text-[#3dd68c]' : soc > 30 ? 'text-[#f0b840]' : 'text-[#e05050]'}`}>
              {soc.toFixed(1)} %
            </span>
          </div>
          
          <div className="w-px bg-[#1e2a3a] self-stretch"></div>
          
          {/* Mode Badge */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-[#4f6080] uppercase tracking-wider">{isGenOn ? 'Generator ON' : 'Battery ON'}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full self-start mt-0.5 border ${
              isGenOn 
                ? 'bg-[#2a1f0a] text-[#f0b840] border-[#3a2d0f]' 
                : 'bg-[#0a2a18] text-[#3dd68c] border-[#0f3a22]'
            }`}>
              {isGenOn ? 'Battery Charging' : 'Generator Standby'}
            </span>
          </div>
          
          {/* Timer */}
          <div className="ml-auto flex flex-col gap-0.5">
            <span className="text-[9px] text-[#4f6080]">Update in {countdown}s</span>
          </div>
        </div>
      </div>

      {/* Energy Labels */}
      <div className="flex gap-2 flex-wrap mb-2">
        <div className="bg-[#1a2235] border border-[#2a3550] rounded-md px-2.5 py-1.25 text-xs">
          <span className={`font-medium ${isGenOn ? 'text-[#f0b840]' : 'text-[#6b7a99]'}`}>
            {isGenOn ? 'Generator ON' : 'Generator Standby'}
          </span>
          {' · '}
          <span className="text-[#5a6a88]">
            {isGenOn ? `supply ${genSupply.toFixed(1)}kW + charge ${genCharge.toFixed(1)}kW` : 'OFF — waiting for Battery'}
          </span>
        </div>
        
        <div className="bg-[#1a2235] border border-[#2a3550] rounded-md px-2.5 py-1.25 text-xs">
          <span className={`font-medium ${!isGenOn ? 'text-[#3dd68c]' : 'text-[#6b7a99]'}`}>
            {!isGenOn ? 'Battery ON' : 'Battery'}
          </span>
          {' · '}
          <span className="text-[#5a6a88]">
            {!isGenOn ? `Discharging ${battLoad.toFixed(1)} kW to load` : `Charging @ ${genCharge.toFixed(1)} kW`}
          </span>
        </div>
      </div>

      {/* Live Monitoring Bar */}
      <div className="bg-[#1a2235] rounded-md px-3 py-1.75 text-xs text-[#6b7a99] font-medium tracking-wider uppercase flex items-center gap-2">
        <div className="w-1.75 h-1.75 rounded-full bg-[#3dd68c] pulse-dot flex-shrink-0"></div>
        LIVE MONITORING — Auto-refresh every 5s
      </div>
    </div>
  );
}
