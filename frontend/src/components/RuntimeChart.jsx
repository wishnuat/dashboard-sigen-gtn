import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { mapHistoricalData } from '../utils/mapper';

/**
 * Runtime Chart Component
 * Displays historical energy data using Recharts
 */
export function RuntimeChart({ historicalData, onPeriodChange, currentPeriod = '7d' }) {
  if (!historicalData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No historical data available
      </div>
    );
  }

  const { chartData, series } = mapHistoricalData(historicalData);

  const periodOptions = [
    { value: '7d', label: '7 Days' },
    { value: '14d', label: '14 Days' },
    { value: '30d', label: '30 Days' },
  ];

  // Color mapping for energy types
  const colorMap = {
    PV: '#fbbf24',
    Battery: '#10b981',
    Grid: '#6366f1',
    Load: '#ef4444',
    Generator: '#f97316',
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Energy History
        </h3>
        
        <div className="flex gap-2">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onPeriodChange(option.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                currentPeriod === option.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}kW`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value, name) => [`${(value / 1000).toFixed(2)} kW`, name]}
            />
            <Legend />
            
            {series.map((item) => (
              <Line
                key={item.name}
                type="monotone"
                dataKey={item.name}
                stroke={colorMap[item.name] || '#999'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name={item.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Data summary */}
      {historicalData.warning && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ {historicalData.warning}
          </p>
        </div>
      )}
    </div>
  );
}

export default RuntimeChart;
