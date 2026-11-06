import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { Activity, Clock, ZoomIn, ZoomOut, Calendar } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const isPenuh = payload[0].value === 1;

    return (
      <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs font-sans">
        <div className="text-slate-400 font-mono flex items-center gap-1.5 mb-1.5 pb-1 border-b border-slate-800">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Waktu: {label}</span>
        </div>
        <div className="flex items-center justify-between gap-4 mt-1">
          <span className="text-slate-300">Kondisi:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
              isPenuh
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-lime-500/20 text-lime-400 border border-lime-500/40'
            }`}
          >
            {isPenuh ? '🔴 PENUH (Kapasitas Habis)' : '🟢 MASIH MUAT (Tersedia)'}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function RealtimeChartCard({ historyData = [] }) {
  const [zoomPoints, setZoomPoints] = useState(24);
  const [activePreset, setActivePreset] = useState('24h');

  // Filter data sesuai zoom slider
  const displayedData = historyData.slice(Math.max(0, historyData.length - zoomPoints));
  const latestPoint = displayedData[displayedData.length - 1] || { status: 0 };
  const fullCount = historyData.filter((d) => d.status === 1).length;

  const handlePreset = (preset, points) => {
    setActivePreset(preset);
    setZoomPoints(points);
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/70 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Grafik Riwayat: Kapan Tempat Sampah Penuh
              </h2>
            </div>
          </div>
        </div>

        {/* Rentang Waktu Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Rentang:
          </span>
          <button
            onClick={() => handlePreset('15m', 6)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activePreset === '15m'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            15 Menit
          </button>
          <button
            onClick={() => handlePreset('1h', 10)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activePreset === '1h'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            1 Jam
          </button>
          <button
            onClick={() => handlePreset('6h', 16)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activePreset === '6h'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            6 Jam
          </button>
          <button
            onClick={() => handlePreset('24h', 24)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activePreset === '24h'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            24 Jam (Seharian)
          </button>
        </div>
      </div>

      {/* Timeline Zoom Slider */}
      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-end gap-3 text-xs">
        <span className="text-base font-bold text-slate-400 font-mono">-</span>
        <input
          type="range"
          min="6"
          max="30"
          value={zoomPoints}
          onChange={(e) => {
            setZoomPoints(Number(e.target.value));
            setActivePreset('custom');
          }}
          className="w-48 sm:w-64 accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
        />
        <span className="text-base font-bold text-slate-400 font-mono">+</span>
      </div>

      {/* Main Chart Area (HANYA KONDISI, TANPA METERAN) */}
      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={displayedData}
            margin={{ top: 15, right: 30, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              fontFamily="JetBrains Mono, monospace"
            />
            <YAxis
              stroke="#ffffff"
              fontSize={12}
              domain={[0, 1.1]}
              ticks={[0, 1]}
              tickFormatter={(v) => (v === 1 ? '🔴 PENUH' : '🟢 MASIH MUAT')}
              tickLine={false}
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="bold"
            />
            <Tooltip content={<CustomTooltip />} />

            <Line
              name="Kondisi Tempat Sampah"
              type="stepBefore"
              dataKey="status"
              stroke="#ef4444"
              strokeWidth={3}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (!cx || !cy) return null;
                const isPenuh = payload.status === 1;
                return (
                  <circle
                    key={`${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={isPenuh ? '#ef4444' : '#84cc16'}
                    stroke="#0f172a"
                    strokeWidth={2}
                  />
                );
              }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insight Jam-Jam Penuh */}
      <div className="pt-4 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
          <span className="text-slate-400 block mb-1">Status Terkini:</span>
          <span
            className={`font-mono font-bold text-sm ${
              latestPoint.status === 1 ? 'text-red-400' : 'text-lime-400'
            }`}
          >
            {latestPoint.status === 1 ? '🔴 PENUH' : '🟢 MASIH MUAT'}
          </span>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
          <span className="text-slate-400 block mb-1">Jam Sering Penuh (Pola Harian):</span>
          <span className="text-amber-300 font-mono font-bold text-sm">
            12:00 - 14:00 & 18:00 - 20:00
          </span>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
          <span className="text-slate-400 block mb-1">Frekuensi Penuh Hari Ini:</span>
          <span className="text-white font-mono font-bold text-sm">
            {fullCount} Kali Terisi Penuh
          </span>
        </div>
      </div>
    </div>
  );
}
