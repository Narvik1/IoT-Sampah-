import React from 'react';
import { AlertTriangle, CheckCircle, Volume2 } from 'lucide-react';

export default function TrashStatusCard({ isFull = false }) {
  return (
    <div
      className={`rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-500 flex flex-col justify-between relative overflow-hidden ${
        isFull
          ? 'bg-red-600 text-white shadow-red-600/30'
          : 'bg-[#84cc16] text-slate-950 shadow-lime-500/30'
      }`}
    >
      {/* Background ambient pulse effect when full */}
      {isFull && (
        <div className="absolute inset-0 bg-red-700 animate-ping opacity-20 pointer-events-none" />
      )}

      {/* Card Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                isFull
                  ? 'bg-red-800/60 text-red-100 border border-red-400/40'
                  : 'bg-lime-700/30 text-slate-900 border border-lime-700/40'
              }`}
            >
              Kondisi Tempat Sampah
            </span>
            <span
              className={`text-[11px] font-mono font-medium ${
                isFull ? 'text-red-100/90' : 'text-slate-900/80'
              }`}
            >
              Blynk Datastream: V1
            </span>
          </div>

          <div
            className={`p-2 rounded-xl backdrop-blur-sm ${
              isFull
                ? 'bg-red-800/50 text-white'
                : 'bg-lime-400/50 text-slate-950'
            }`}
          >
            {isFull ? (
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* Dynamic Status Text */}
        <div className="mt-4">
          <h2 className="text-xs uppercase font-extrabold tracking-widest opacity-80">
            Status Tempat Sampah
          </h2>
          <div className="text-6xl sm:text-7xl font-black tracking-tight mt-1 transition-transform transform">
            {isFull ? 'PENUH' : 'KOSONG'}
          </div>
        </div>
      </div>

      {/* Sensor & Hardware Indicators */}
      <div className="mt-6 relative z-10">
        <div
          className={`p-3 rounded-xl backdrop-blur-sm mb-4 flex items-center justify-between ${
            isFull
              ? 'bg-red-800/40 border border-red-400/30 text-white'
              : 'bg-lime-600/30 border border-lime-600/40 text-slate-950'
          }`}
        >
          <div>
            <span className="text-xs block opacity-85 font-semibold">
              Nilai Datastream V1:
            </span>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl font-extrabold">
                {isFull ? '1 (PENUH)' : '0 (KOSONG)'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] block opacity-85">
              Kapasitas:
            </span>
            <span className="text-sm font-bold font-mono">
              {isFull ? 'Segera Kosongkan' : 'Ruang Tersedia'}
            </span>
          </div>
        </div>

        {/* Hardware ESP32 LED & Buzzer Indicator Bar */}
        <div
          className={`grid grid-cols-3 gap-2 text-[11px] font-bold p-2.5 rounded-xl ${
            isFull
              ? 'bg-red-950/40 text-red-100'
              : 'bg-lime-800/20 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isFull ? 'bg-red-300 ring-2 ring-red-400 animate-pulse' : 'bg-slate-400/50'
              }`}
            />
            <span>LED Merah: {isFull ? 'ON' : 'OFF'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                !isFull ? 'bg-lime-200 ring-2 ring-lime-300' : 'bg-slate-400/50'
              }`}
            />
            <span>LED Hijau: {!isFull ? 'ON' : 'OFF'}</span>
          </div>

          <div className="flex items-center gap-1.5 justify-end">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Alarm: {isFull ? 'BUNYI' : 'DIAM'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
