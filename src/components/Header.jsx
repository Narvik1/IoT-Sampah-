import React from 'react';
import { Trash2, Wifi, Settings, RefreshCw, Code2, Play, Bell, BellRing, Database } from 'lucide-react';

export default function Header({
  isSimulation,
  setIsSimulation,
  isHardwareOnline,
  isRefreshing,
  onManualRefresh,
  onOpenSettings,
  onOpenEspCode,
  notifPermission,
  onRequestNotif
}) {
  return (
    <header className="bg-slate-800/90 backdrop-blur-md border-b border-slate-700/80 sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-lime-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Smart Trash Bin IoT Dashboard
                </h1>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  Firebase + Blynk
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Penyimpanan Riwayat Permanen & Notifikasi Otomatis
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Notification Permission Button */}
            <button
              type="button"
              onClick={onRequestNotif}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                notifPermission === 'granted'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
              }`}
              title={
                notifPermission === 'granted'
                  ? 'Notifikasi Browser Aktif (Suara & Pop-up Siap)'
                  : 'Klik untuk mengaktifkan Notifikasi Pop-up Browser saat Penuh'
              }
            >
              {notifPermission === 'granted' ? (
                <>
                  <BellRing className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Notifikasi Aktif</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>Aktifkan Notifikasi</span>
                </>
              )}
            </button>

            {/* Mode Switcher Pill */}
            <div className="bg-slate-900/80 p-1 rounded-xl border border-slate-700/70 flex items-center shadow-inner">
              <button
                type="button"
                onClick={() => setIsSimulation(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  !isSimulation
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Ambil data langsung dari Blynk Cloud & sinkron ke Firebase"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Blynk Live</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSimulation(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSimulation
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Simulasi otomatis untuk menguji perpindahan status & alarm"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulasi</span>
              </button>
            </div>

            {/* Hardware Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isSimulation
                      ? 'bg-amber-400'
                      : isHardwareOnline
                      ? 'bg-emerald-400'
                      : 'bg-rose-500'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isSimulation
                      ? 'bg-amber-500'
                      : isHardwareOnline
                      ? 'bg-emerald-500'
                      : 'bg-rose-500'
                  }`}
                ></span>
              </span>
              <span className="font-medium text-slate-300">
                {isSimulation
                  ? 'Simulasi'
                  : isHardwareOnline
                  ? 'ESP32 Online'
                  : 'ESP32 Standby'}
              </span>
            </div>

            {/* Manual Refresh */}
            <button
              type="button"
              onClick={onManualRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 transition-all disabled:opacity-50"
              title="Refresh Data Sekarang"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* ESP32 Code Guide */}
            <button
              type="button"
              onClick={onOpenEspCode}
              className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 transition-all"
              title="Kode ESP32 + Firebase"
            >
              <Code2 className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 transition-all"
              title="Konfigurasi Firebase & Blynk"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
