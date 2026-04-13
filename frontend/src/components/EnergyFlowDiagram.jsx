import React from 'react';
import { formatPower, mapBatteryStatus, mapGridStatus } from '../utils/mapper';

/**
 * Energy Flow Diagram Component
 * Visual representation of energy flow between PV, Battery, Grid, and Load
 */
export function EnergyFlowDiagram({ energyFlow, generatorStatus }) {
  if (!energyFlow) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No energy flow data available
      </div>
    );
  }

  const {
    pvPower = 0,
    batteryPower = 0,
    gridPower = 0,
    loadPower = 0,
    batterySoc = 0,
  } = energyFlow;

  const batteryStatus = mapBatteryStatus(batteryPower);
  const gridStatus = mapGridStatus(gridPower);
  const isGeneratorRunning = generatorStatus?.isRunning || (gridPower < -2000 && batterySoc < 20);

  // Calculate flow directions
  const batteryCharging = batteryPower > 0;
  const batteryDischarging = batteryPower < 0;
  const gridExport = gridPower > 0;
  const gridImport = gridPower < 0;

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Energy Flow
      </h3>

      <div className="relative max-w-2xl mx-auto">
        {/* Main flow diagram */}
        <div className="grid grid-cols-3 gap-8">
          {/* Left column - PV and Generator */}
          <div className="space-y-4">
            {/* PV Panel */}
            <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
              pvPower > 0 
                ? 'border-energy-pv bg-energy-pv/10 flow-active' 
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
            }`}>
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto mb-2 text-energy-pv" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.92l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zM6.343 14.92l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414z"/>
                </svg>
                <div className="text-xs text-gray-600 dark:text-gray-400">Solar PV</div>
                <div className="text-sm font-bold text-energy-pv">{formatPower(pvPower)}</div>
              </div>
            </div>

            {/* Generator */}
            <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
              isGeneratorRunning 
                ? 'border-energy-generator bg-energy-generator/10 flow-active' 
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
            }`}>
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto mb-2 text-energy-generator" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                </svg>
                <div className="text-xs text-gray-600 dark:text-gray-400">Generator</div>
                <div className={`text-sm font-bold ${isGeneratorRunning ? 'text-energy-generator' : 'text-gray-400'}`}>
                  {isGeneratorRunning ? 'RUNNING' : 'OFF'}
                </div>
              </div>
            </div>
          </div>

          {/* Center column - Battery */}
          <div className="space-y-4">
            {/* Battery */}
            <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
              batteryCharging 
                ? 'border-energy-battery bg-energy-battery/10 flow-active' 
                : batteryDischarging
                ? 'border-energy-battery bg-energy-battery/10'
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
            }`}>
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto mb-2 text-energy-battery" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                </svg>
                <div className="text-xs text-gray-600 dark:text-gray-400">Battery</div>
                <div className="text-sm font-bold text-energy-battery">{formatPower(batteryPower)}</div>
                <div className="text-xs text-gray-500 mt-1">{batteryStatus}</div>
                
                {/* SOC Indicator */}
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      batterySoc > 80 ? 'bg-green-500' : batterySoc > 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${batterySoc}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{batterySoc}%</div>
              </div>
            </div>
          </div>

          {/* Right column - Grid and Load */}
          <div className="space-y-4">
            {/* Grid */}
            <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
              gridExport 
                ? 'border-energy-grid bg-energy-grid/10 flow-active' 
                : gridImport
                ? 'border-energy-grid bg-energy-grid/10'
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
            }`}>
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto mb-2 text-energy-grid" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                </svg>
                <div className="text-xs text-gray-600 dark:text-gray-400">Grid</div>
                <div className="text-sm font-bold text-energy-grid">{formatPower(gridPower)}</div>
                <div className="text-xs text-gray-500 mt-1">{gridStatus}</div>
              </div>
            </div>

            {/* Load */}
            <div className="p-4 rounded-lg border-2 border-energy-load bg-energy-load/10">
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto mb-2 text-energy-load" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/>
                </svg>
                <div className="text-xs text-gray-600 dark:text-gray-400">Load</div>
                <div className="text-sm font-bold text-energy-load">{formatPower(loadPower)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Flow arrows (simplified visual representation) */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Horizontal flows */}
          {pvPower > 0 && (
            <div className="absolute top-1/2 left-1/4 w-1/4 h-0.5 bg-energy-pv/50 transform -translate-y-1/2" />
          )}
          {batteryCharging && (
            <div className="absolute top-1/2 left-[37%] w-[8%] h-0.5 bg-energy-battery/50 transform -translate-y-1/2" />
          )}
          {batteryDischarging && (
            <div className="absolute top-1/2 left-[37%] w-[8%] h-0.5 bg-energy-battery/50 transform -translate-y-1/2" />
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400">PV Generation</div>
          <div className="text-lg font-bold text-energy-pv">{formatPower(pvPower)}</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400">Battery</div>
          <div className="text-lg font-bold text-energy-battery">{formatPower(batteryPower)}</div>
          <div className="text-xs text-gray-500">{batteryStatus}</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400">Grid</div>
          <div className="text-lg font-bold text-energy-grid">{formatPower(gridPower)}</div>
          <div className="text-xs text-gray-500">{gridStatus}</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400">Load</div>
          <div className="text-lg font-bold text-energy-load">{formatPower(loadPower)}</div>
        </div>
      </div>
    </div>
  );
}

export default EnergyFlowDiagram;
