import React from 'react';
import { Hand, Gauge, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

export default function HandSensorCard({
  distance = 12,
  threshold = 10,
  isFull = false
}) {
  const isHandDetected = distance <= threshold;
  // Servo logic from ESP32: if hand detected AND not full -> servo opens (90deg)
  const isServoOpen = isHandDetected && !isFull;

  // Percentage for progress bar (clamped 0 - 50 cm max scale)
  const maxRange = 40;
  const percentage = Math.min(Math.max((distance / maxRange) * 100, 0), 100);

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/70 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Hand className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Ultrasonik Tangan
              </h2>
            </div>
          </div>

          {/* Quick Hand Presence Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
              isHandDetected
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse'
                : 'bg-slate-700/40 text-slate-400 border-slate-600/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isHandDetected ? 'bg-blue-400' : 'bg-slate-500'
              }`}
            />
            {isHandDetected ? 'Tangan Terdeteksi' : 'Tidak Ada Tangan'}
          </span>
        </div>

        {/* Real-time Distance Big Display */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-5xl font-extrabold tracking-tight text-white font-mono">
            {typeof distance === 'number' ? distance.toFixed(1) : distance}
          </span>
          <span className="text-lg font-bold text-slate-400">cm</span>
        </div>

        <p className="text-xs text-slate-400 mt-1">
          Jarak tangan dari sensor ultrasonik penutup sampah
        </p>
      </div>

      {/* Visual Proximity Gauge Bar */}
      <div className="mt-6 space-y-2">
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>0 cm (Sangat Dekat)</span>
          <span className="text-blue-400 font-mono">Ambang: {threshold} cm</span>
          <span>40 cm (Jauh)</span>
        </div>

        <div className="h-3 w-full bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-slate-700/60 relative">
          {/* Threshold marker pin */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
            style={{ left: `${(threshold / maxRange) * 100}%` }}
            title={`Ambang Deteksi: ${threshold} cm`}
          />
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isHandDetected
                ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                : 'bg-gradient-to-r from-slate-600 to-slate-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Actuator Status Footer (Servo & Motor) */}
      <div className="mt-6 pt-4 border-t border-slate-700/60 grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
          <span className="text-slate-400 block mb-1">Status Servo Penutup:</span>
          <span
            className={`font-bold flex items-center gap-1.5 ${
              isServoOpen ? 'text-emerald-400' : 'text-slate-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isServoOpen ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
            />
            {isServoOpen ? 'Terbuka (90°)' : 'Tertutup (0°)'}
          </span>
        </div>

        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
          <span className="text-slate-400 block mb-1">Aksi Otomatis:</span>
          <span className="text-slate-200 font-medium truncate block">
            {isFull
              ? 'Terkunci (Sampah Penuh)'
              : isHandDetected
              ? 'Membuka Tutup 3s'
              : 'Siaga Mendeteksi'}
          </span>
        </div>
      </div>
    </div>
  );
}

