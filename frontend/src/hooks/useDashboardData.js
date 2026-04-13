import { useState, useEffect } from 'react';

/**
 * Hook untuk manage hierarchical menu state
 */
export function useHierarchicalMenu() {
  const [expandedMenus, setExpandedMenus] = useState({
    companyGroup: true,
    subco1: true,
    'subco1-tugboat': true,
  });

  const toggleMenu = (id) => {
    setExpandedMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return { expandedMenus, toggleMenu };
}

/**
 * Hook untuk search filter vessels
 */
export function useVesselSearch(vessels) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVessels, setFilteredVessels] = useState(vessels);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVessels(vessels);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = vessels.filter(vessel => 
      vessel.systemName?.toLowerCase().includes(term) ||
      vessel.systemId?.toLowerCase().includes(term)
    );

    setFilteredVessels(filtered);
  }, [searchTerm, vessels]);

  return { searchTerm, setSearchTerm, filteredVessels };
}

/**
 * Hook untuk realtime data simulation (fallback)
 */
export function useRealtimeSimulation(enabled = false) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const soc = 50 + Math.random() * 40;
      const isGenOn = soc < 30 || Math.random() > 0.6;
      
      setData({
        isGenOn,
        genLoad: isGenOn ? (8.5 + Math.random() * 6) : 0,
        genCharge: isGenOn ? (2.5 + Math.random() * 3) : 0,
        battLoad: !isGenOn ? (5 + Math.random() * 7) : 0,
        soc,
        timestamp: Date.now()
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [enabled]);

  return data;
}
