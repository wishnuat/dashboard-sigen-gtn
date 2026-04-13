import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * Runtime Chart Component - Menampilkan Battery dan Generator runtime
 */
export default function RuntimeChart({ vessel, historicalData }) {
  const [timeRange, setTimeRange] = useState(7);
  const [chartData, setChartData] = useState([]);

  // Generate dummy data untuk demo (akan diganti dengan data real dari API)
  useEffect(() => {
    if (!vessel) return;

    const generateData = (days) => {
      const data = [];
      for (let i = days; i > 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
          day: `Day ${days - i + 1}`,
          battery: Math.random() * 12 + 4,
          generator: Math.random() * 12 + 4,
        });
      }
      return data;
    };

    setChartData(generateData(timeRange));
  }, [vessel, timeRange]);

  // Calculate metrics
  const totalBattery = chartData.reduce((sum, d) => sum + d.battery, 0);
  const totalGenerator = chartData.reduce((sum, d) => sum + d.generator, 0);
  const ratio = totalGenerator > 0 ? (totalBattery / totalGenerator).toFixed(2) : '0.00';
  const batteryPct = Math.round((totalBattery / (totalBattery + totalGenerator)) * 100) || 0;

  return (
    <div className="px-5 py-3.5 border-b border-[#1e2535]">
      {/* Section Header */}
      <div className="text-xs text-[#6b7a99] font-medium tracking-wider uppercase mb-2.5 flex items-center justify-between">
        <span>Runtime Summary</span>
        <div className="flex gap-1.5">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`text-[10px] px-2.5 py-0.75 rounded-md border transition-all ${
                timeRange === days
                  ? 'bg-[#1e3060] text-[#4f9eff] border-[#2d4a80]'
                  : 'bg-[#161b27] text-[#6b7a99] border-[#2a3045] hover:bg-[#1a2235]'
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-[#131a28] border border-[#1e2a3a] rounded-lg p-2.5">
          <div className="text-sm font-medium text-[#3dd68c] mb-0.5">{totalBattery.toFixed(0)} hours</div>
          <div className="text-[9px] text-[#4f6080] leading-tight">Total Battery Runtime</div>
        </div>
        
        <div className="bg-[#131a28] border border-[#1e2a3a] rounded-lg p-2.5">
          <div className="text-sm font-medium text-[#f0b840] mb-0.5">{totalGenerator.toFixed(0)} hours</div>
          <div className="text-[9px] text-[#4f6080] leading-tight">Total Generator Runtime</div>
        </div>
        
        <div className="bg-[#131a28] border border-[#1e2a3a] rounded-lg p-2.5">
          <div className="text-sm font-medium text-[#b06af0] mb-0.5">{ratio}</div>
          <div className="text-[9px] text-[#4f6080] leading-tight">Battery / Generator Ratio</div>
        </div>
        
        <div className="bg-[#131a28] border border-[#1e2a3a] rounded-lg p-2.5">
          <div className="text-sm font-medium text-[#4f9eff] mb-0.5">{batteryPct}%</div>
          <div className="text-[9px] text-[#4f6080] leading-tight">Battery Usage Percentage</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3.5 flex-wrap mb-2">
        <div className="flex items-center gap-1.25 text-[10px] text-[#6b7a99]">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#3dd68c]"></div>
          Battery ON (hours)
        </div>
        <div className="flex items-center gap-1.25 text-[10px] text-[#6b7a99]">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#f0b840]"></div>
          Generator ON (hours)
        </div>
      </div>

      {/* Bar Chart */}
      <div className="relative h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 9, fill: '#3d5070' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              maxTicks={timeRange <= 7 ? 7 : 10}
            />
            <YAxis 
              tick={{ fontSize: 9, fill: '#3d5070' }}
              axisLine={false}
              tickLine={false}
              domain={[0, 24]}
              tickFormatter={(v) => `${v}h`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#131a28',
                border: '1px solid #1e2a3a',
                borderRadius: '6px',
                fontSize: '10px'
              }}
              labelStyle={{ color: '#6b7a99', marginBottom: '4px' }}
            />
            <Bar 
              dataKey="battery" 
              fill="rgba(61,214,140,0.75)" 
              stroke="#3dd68c"
              strokeWidth={1}
              radius={[3, 3, 0, 0]}
            />
            <Bar 
              dataKey="generator" 
              fill="rgba(240,184,64,0.65)" 
              stroke="#f0b840"
              strokeWidth={1}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
