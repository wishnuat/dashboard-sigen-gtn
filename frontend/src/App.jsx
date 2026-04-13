import { useEffect, useState, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarDataset } from 'recharts';
import './index.css';

// Mock data fallback jika WebSocket gagal (sesuai request awal, tapi prioritas real data)
const MOCK_VESSELS = [
  { systemId: 'SAVAM1754471999', systemName: 'dragonet(印尼 轮渡)', pvCapacity: 9.6, batteryCapacity: 16.12, addr: 'Labenggi, Indonesia', lat: -4.5678, lng: 122.4321 },
  { systemId: 'WMYFE1769301241', systemName: 'TB.Ricky 印尼轮渡自投', pvCapacity: 12.4, batteryCapacity: 28.5, addr: 'Central Sulawesi, Indonesia', lat: -1.2345, lng: 120.8765 },
  { systemId: 'VXPTD1765947181', systemName: 'TB.Edward 印尼轮渡 自投', pvCapacity: 10.8, batteryCapacity: 21.3, addr: 'Southeast Sulawesi, Indonesia', lat: -3.9876, lng: 122.1234 },
  { systemId: 'HEBYX1765277002', systemName: 'TB.Orca 印尼轮渡 自投', pvCapacity: 11.2, batteryCapacity: 24.8, addr: 'Southeast Sulawesi, Indonesia', lat: -2.1543, lng: 118.7654 }
];

function App() {
  const [vessels, setVessels] = useState(MOCK_VESSELS);
  const [selectedSystemId, setSelectedSystemId] = useState('SAVAM1754471999');
  const [realtimeData, setRealtimeData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [countdown, setCountdown] = useState(5);
  const [activeTab, setActiveTab] = useState('system');
  const [rangeDays, setRangeDays] = useState(7);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Menu State
  const [expandedMenus, setExpandedMenus] = useState({
    'companyGroup': true,
    'subco1': true,
    'subco1-tugboat': true
  });

  // Load Script for Chart.js dynamically if needed, but we use Recharts mostly
  // For the sparklines in mockup, we will use Recharts
  
  // Simulate WebSocket Connection
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log('[WS] Connected');
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'error') {
          console.warn('[WS] Error from server:', data.message);
          return;
        }
        
        if (data.systems && data.systems.length > 0) {
          // Map backend data to frontend format if needed
          // Assuming backend sends normalized data
          setVessels(data.systems);
        }
        
        if (data.realtime) {
          setRealtimeData(data.realtime);
        }

        if (data.countdown !== undefined) {
          setCountdown(data.countdown);
        }
      } catch (e) {
        console.error('[WS] Parse error', e);
      }
    };

    ws.onerror = (err) => console.error('[WS] Error', err);
    ws.onclose = () => console.log('[WS] Disconnected');

    return () => ws.close();
  }, []);

  // Helper to toggle menus
  const toggleMenu = (id) => {
    setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectVessel = (id) => {
    setSelectedSystemId(id);
    // Reset realtime for effect
    setRealtimeData(null); 
  };

  const filteredVessels = vessels.filter(v => 
    v.systemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.systemId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current vessel details
  const currentVessel = vessels.find(v => v.systemId === selectedSystemId) || vessels[0];

  // Generate dummy history data for charts if not received
  const generateHistory = (days) => {
    return Array.from({ length: days }, (_, i) => ({
      day: `Day ${i + 1}`,
      battery: Math.floor(Math.random() * 10) + 4,
      generator: Math.floor(Math.random() * 10) + 4
    }));
  };

  useEffect(() => {
    setHistoryData(generateHistory(rangeDays));
  }, [rangeDays]);

  // Calculate metrics
  const totalBatt = historyData.reduce((acc, cur) => acc + cur.battery, 0);
  const totalGen = historyData.reduce((acc, cur) => acc + cur.generator, 0);
  const ratio = totalGen > 0 ? (totalBatt / totalGen).toFixed(2) : 0;
  const pct = Math.round((totalBatt / (totalBatt + totalGen)) * 100) || 0;

  // Realtime simulation if no data yet (for visual demo only, will be replaced by WS)
  const rt = realtimeData || {
    isGenOn: false,
    genLoad: 0,
    battLoad: 8.5,
    soc: 67.5,
    charge: 0
  };

  return (
    <div className="dash">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="search-box">
          <div className="search-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              placeholder="Search System Name or ID" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div id="menuContainer">
          {/* Company Group */}
          <div className="menu-section">
            <div className={`menu-header ${expandedMenus['companyGroup'] ? 'expanded' : ''}`} onClick={() => toggleMenu('companyGroup')}>
              <span className="menu-title">Meranti Group</span>
              <svg className={`chevron-icon menu-icon ${expandedMenus['companyGroup'] ? 'rotate' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
            <div className={`menu-content ${expandedMenus['companyGroup'] ? 'show' : ''}`}>
              
              {/* Sub Company 1 */}
              <div className={`submenu-item ${expandedMenus['subco1'] ? 'expanded' : ''}`} onClick={() => toggleMenu('subco1')}>
                <span className="submenu-title">PT. Samudera Empat Sekawan</span>
                <svg className={`chevron-icon ${expandedMenus['subco1'] ? 'rotate' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
              <div className={`submenu-content ${expandedMenus['subco1'] ? 'show' : ''}`}>
                
                {/* Tugboat */}
                <div className={`vessel-type-item ${expandedMenus['subco1-tugboat'] ? 'expanded' : ''}`} onClick={() => toggleMenu('subco1-tugboat')}>
                  <span className="vessel-type-title">Tugboat</span>
                  <svg className={`chevron-icon ${expandedMenus['subco1-tugboat'] ? 'rotate' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
                <div className={`vessel-type-content ${expandedMenus['subco1-tugboat'] ? 'show' : ''}`}>
                  {filteredVessels.map(v => (
                    <div 
                      key={v.systemId} 
                      className={`vessel-card ${v.systemId === selectedSystemId ? 'active' : ''}`}
                      onClick={() => handleSelectVessel(v.systemId)}
                    >
                      <div>
                        <div className="vessel-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f9eff" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="11" rx="2"/><path d="M8 19h8m-4-5v5"/>
                          </svg>
                        </div>
                        <div style={{display:'inline-block',verticalAlign:'top'}}>
                          <div className="vessel-name">{v.systemName}</div>
                          <div className="vessel-id">{v.systemId}</div>
                          <div className="vessel-metrics">{v.pvCapacity} kWp · {v.batteryCapacity} kWh</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tanker Placeholder */}
                <div className="vessel-type-item" onClick={() => toggleMenu('subco1-tanker')}>
                  <span className="vessel-type-title">Tanker</span>
                  <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
                <div className="vessel-type-content" id="content-subco1-tanker">
                  <div style={{padding:'12px 48px',fontSize:'10px',color:'#4f6080',fontStyle:'italic'}}>No tanker vessels</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main">
        <div className="main-header">
          <div className="sys-title">{currentVessel?.systemName || 'Select a vessel'}</div>
          <div className="tab-nav">
            <div className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>System</div>
            <div className={`tab-btn ${activeTab === 'location' ? 'active' : ''}`} onClick={() => setActiveTab('location')}>Location</div>
          </div>
        </div>

        {/* SYSTEM TAB */}
        {activeTab === 'system' && (
          <>
            <div className="ship-section">
              <div className="ship-canvas">
                <svg width="100%" height="210" viewBox="0 0 680 210" xmlns="http://www.w3.org/2000/svg">
                  <rect width="680" height="210" fill="#0d1320"/>
                  <ellipse cx="340" cy="195" rx="285" ry="18" fill="#0d2040" opacity="0.45"/>
                  <path d="M75 155 L98 115 L582 115 L605 155 L560 172 L120 172 Z" fill="#1a2a45" stroke="#2a3d5e" strokeWidth="1.5"/>
                  <path d="M120 115 L132 85 L438 85 L450 115" fill="#1e3255" stroke="#2a3d5e" strokeWidth="1"/>
                  
                  {/* Home Load Box */}
                  <rect x="170" y="120" width="68" height="28" rx="3" fill="#12243a" stroke="#1a3555" strokeWidth="1"/>
                  <text x="188" y="137" fontSize="9" fill="#8aaac8" fontWeight="500">HOME</text>
                  
                  {/* SigenStor Box */}
                  <rect x="460" y="80" width="72" height="52" rx="4" fill="#0f2535" stroke="#1e3d50" strokeWidth="1"/>
                  <rect x="466" y="85" width="28" height="42" rx="3" fill="#1a3a55" stroke="#2a5070" strokeWidth="0.8"/>
                  <rect x="498" y="85" width="27" height="42" rx="3" fill="#f5f6f8" stroke="#dde0e8" strokeWidth="0.8"/>
                  <text x="500" y="105" fontSize="6" fill="#334" fontWeight="500">Sigen</text>
                  <text x="501" y="115" fontSize="6" fill="#334">Stor</text>
                  <text x="452" y="76" fontSize="9" fill="#3dd68c" fontWeight="500">SigenStor</text>

                  {/* Flow Lines */}
                  {/* Gen to Batt */}
                  <path d="M498 106 Q485 106 475 106" stroke="#f0b840" strokeWidth="2.5" fill="none" opacity={rt.isGenOn ? 0.9 : 0} strokeDasharray="3 2"/>
                  {/* Gen to Load */}
                  <path d="M498 106 Q460 106 400 106 L250 106 Q230 106 220 118" stroke="#f0b840" strokeWidth="2.5" fill="none" opacity={rt.isGenOn ? 0.9 : 0} strokeDasharray="3 2"/>
                  {/* Batt to Load */}
                  <path d="M475 106 Q400 106 250 106 Q230 106 220 118" stroke="#3dd68c" strokeWidth="2.5" fill="none" opacity={!rt.isGenOn ? 0.9 : 0} strokeDasharray="3 2"/>

                  {/* Labels */}
                  <text x="510" y="68" fontSize="8" fill="#f0b840" fontWeight="500" opacity={rt.isGenOn ? 1 : 0}>{rt.isGenOn ? rt.genLoad?.toFixed(1) : 0} kW</text>
                  <text x="455" y="68" fontSize="8" fill="#3dd68c" fontWeight="500" opacity={!rt.isGenOn ? 1 : 0}>{!rt.isGenOn ? rt.battLoad?.toFixed(1) : 0} kW</text>
                  <text x="475" y="98" fontSize="7" fill="#f0b840" opacity={rt.isGenOn ? 1 : 0}>Charging +{rt.charge?.toFixed(1)}kW</text>
                  <text x="30" y="100" fontSize="10" fill={rt.isGenOn ? '#f0b840' : '#3dd68c'} fontWeight="500">
                    {rt.isGenOn ? 'Generator ON — Charging & Supply' : 'Battery ON — Discharging'}
                  </text>
                  <circle cx="205" cy="134" r="2" fill={rt.isGenOn ? '#f0b840' : '#3dd68c'} className="pulse"/>
                </svg>

                {/* Overlay Stats */}
                <div className="rt-overlay">
                  <div className="rt-item">
                    <span className="rt-lbl">Generator Load</span>
                    <span className={`rt-val ${rt.isGenOn ? 'amber' : 'gray'}`}>{rt.isGenOn ? rt.genLoad?.toFixed(1) : 0} kW</span>
                    <span style={{fontSize:'8px',color:'#4f6080'}}>{rt.isGenOn ? 'Load + Charge' : 'Standby / OFF'}</span>
                  </div>
                  <div className="divider-v"></div>
                  <div className="rt-item">
                    <span className="rt-lbl">Battery Load</span>
                    <span className={`rt-val ${!rt.isGenOn ? 'green' : 'gray'}`}>{!rt.isGenOn ? rt.battLoad?.toFixed(1) : 0} kW</span>
                    <span style={{fontSize:'8px',color:'#4f6080'}}>{!rt.isGenOn ? 'Discharging' : 'Being Charged'}</span>
                  </div>
                  <div className="divider-v"></div>
                  <div className="rt-item">
                    <span className="rt-lbl">Charging</span>
                    <span className="rt-val gray">{rt.charge?.toFixed(1) || 0} kW</span>
                  </div>
                  <div className="divider-v"></div>
                  <div className="rt-item">
                    <span className="rt-lbl">Battery SOC</span>
                    <span className={`rt-val ${rt.soc > 60 ? 'green' : rt.soc > 30 ? 'amber' : 'red'}`}>{rt.soc?.toFixed(1) || 0} %</span>
                  </div>
                  <div className="divider-v"></div>
                  <div className="rt-item">
                    <span className="rt-lbl" style={{color: rt.isGenOn ? '#f0b840' : '#3dd68c'}}>{rt.isGenOn ? 'Generator ON' : 'Battery ON'}</span>
                    <span className={`rt-mode ${rt.isGenOn ? 'gen-on' : 'batt-on'}`}>{rt.isGenOn ? 'Battery Charging' : 'Generator Standby'}</span>
                  </div>
                  <div style={{marginLeft:'auto'}}>
                    <div className="rt-item">
                      <span className="rt-lbl">Update in {countdown}s</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Energy Labels */}
              <div className="energy-labels">
                <div className="elabel green">
                  <span className="val">{rt.isGenOn ? 'Generator ON' : 'Generator Standby'}</span> · <span className="desc">{rt.isGenOn ? `supply + charge` : 'OFF — waiting for Battery'}</span>
                </div>
                <div className="elabel amber">
                  <span className="val">{!rt.isGenOn ? 'Battery ON' : 'Battery'}</span> · <span className="desc">{!rt.isGenOn ? `Discharging ${rt.battLoad?.toFixed(1)} kW` : `Charging @ ${rt.charge?.toFixed(1)} kW`}</span>
                </div>
              </div>
              <div className="realtime-bar">
                <div className="pulse-dot pulse"></div>
                LIVE MONITORING — Auto-refresh every 5s
              </div>
            </div>

            {/* Charts Area */}
            <div className="area-charts">
              <div className="charts-row">
                <div className="chart-card">
                  <div className="chart-lbl">Battery Runtime Today <span className={`badge ${!rt.isGenOn ? 'on' : 'standby'}`}>{!rt.isGenOn ? 'ON' : 'STANDBY'}</span></div>
                  <div className="chart-main-val">{(!rt.isGenOn ? rt.battLoad : 0).toFixed(1)} hours</div>
                  <div className="chart-sub" style={{color:'#3dd68c'}}>Discharging to supply load</div>
                  <div className="chart-area-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyData}>
                        <Line type="monotone" dataKey="battery" stroke="#3dd68c" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="chart-card">
                  <div className="chart-lbl">Generator Runtime Today <span className={`badge ${rt.isGenOn ? 'gen' : 'standby'}`}>{rt.isGenOn ? 'ON' : 'STANDBY'}</span></div>
                  <div className="chart-main-val">{(rt.isGenOn ? rt.genLoad : 0).toFixed(1)} hours</div>
                  <div className="chart-sub" style={{color:'#f0b840'}}>Charging + supplying load</div>
                  <div className="chart-area-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyData}>
                        <Line type="monotone" dataKey="generator" stroke="#f0b840" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Section */}
            <div className="report-section">
              <div className="sec-hdr">
                Runtime Summary
                <div className="range-btns">
                  <button className={`rbtn ${rangeDays===7?'active':''}`} onClick={()=>setRangeDays(7)}>7D</button>
                  <button className={`rbtn ${rangeDays===14?'active':''}`} onClick={()=>setRangeDays(14)}>14D</button>
                  <button className={`rbtn ${rangeDays===30?'active':''}`} onClick={()=>setRangeDays(30)}>30D</button>
                </div>
              </div>
              <div className="metrics-grid">
                <div className="mg-item batt">
                  <div className="mg-val">{totalBatt} hours</div>
                  <div className="mg-lbl">Total Battery Runtime</div>
                </div>
                <div className="mg-item gen">
                  <div className="mg-val">{totalGen} hours</div>
                  <div className="mg-lbl">Total Generator Runtime</div>
                </div>
                <div className="mg-item ratio">
                  <div className="mg-val">{ratio}</div>
                  <div className="mg-lbl">Battery / Generator Ratio</div>
                </div>
                <div className="mg-item pct">
                  <div className="mg-val">{pct}%</div>
                  <div className="mg-lbl">Battery Usage Percentage</div>
                </div>
              </div>
              <div className="legend-row">
                <div className="leg-item"><div className="leg-sq" style={{background:'#3dd68c'}}></div> Battery ON (hours)</div>
                <div className="leg-item"><div className="leg-sq" style={{background:'#f0b840'}}></div> Generator ON (hours)</div>
              </div>
              <div className="bar-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
                    <XAxis dataKey="day" tick={{fontSize: 9, fill: '#3d5070'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 9, fill: '#3d5070'}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{background:'#131a28', border:'1px solid #1e2a3a', color:'#e0e6f0'}} itemStyle={{fontSize:10}} />
                    <Bar dataKey="battery" stackId="a" fill="#3dd68c" radius={[3,3,0,0]} />
                    <Bar dataKey="generator" stackId="a" fill="#f0b840" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* LOCATION TAB */}
        {activeTab === 'location' && (
          <div className="location-section active">
            <div className="vessel-info">
              <div className="vessel-info-title">Vessel Information</div>
              <div className="vessel-info-grid">
                <div className="vessel-info-item">
                  <div className="vessel-info-label">Vessel Name</div>
                  <div className="vessel-info-value">{currentVessel?.systemName}</div>
                </div>
                <div className="vessel-info-item">
                  <div className="vessel-info-label">Vessel ID</div>
                  <div className="vessel-info-value">{currentVessel?.systemId}</div>
                </div>
                <div className="vessel-info-item">
                  <div className="vessel-info-label">Current Status</div>
                  <div className="vessel-info-value" style={{color:'#3dd68c'}}>Active</div>
                </div>
                <div className="vessel-info-item">
                  <div className="vessel-info-label">Latitude</div>
                  <div className="vessel-info-value">{currentVessel?.lat?.toFixed(4)}</div>
                </div>
                <div className="vessel-info-item">
                  <div className="vessel-info-label">Longitude</div>
                  <div className="vessel-info-value">{currentVessel?.lng?.toFixed(4)}</div>
                </div>
                <div className="vessel-info-item">
                  <div className="vessel-info-label">Last Update</div>
                  <div className="vessel-info-value">Just now</div>
                </div>
              </div>
            </div>
            <div className="map-container" id="mapContainer">
              {/* Map Placeholder - Integrate Google Maps/Leaflet here if API Key available */}
              <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#4f6080'}}>
                Map Visualization Placeholder (Integrate Google Maps API)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;