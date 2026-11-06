import React, { useState } from 'react';
import { X, Key, Globe, Clock, Database, Save, Check, ShieldCheck } from 'lucide-react';

export default function ConfigModal({
  isOpen,
  onClose,
  blynkConfig,
  onSaveBlynkConfig,
  firebaseUrl,
  onSaveFirebaseUrl
}) {
  const [token, setToken] = useState(blynkConfig.token || '');
  const [serverUrl, setServerUrl] = useState(blynkConfig.serverUrl || 'https://sgp1.blynk.cloud');
  const [dbUrl, setDbUrl] = useState(firebaseUrl || 'https://smart-trashbin-iot-default-rtdb.firebaseio.com');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveBlynkConfig({
      ...blynkConfig,
      token: token.trim(),
      serverUrl: serverUrl.trim()
    });
    onSaveFirebaseUrl(dbUrl.trim().replace(/\/$/, ''));
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Konfigurasi Database & Server</h3>
            <p className="text-xs text-slate-400">Atur kredensial Firebase Realtime Database & Blynk</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Firebase Database URL */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30">
            <label className="text-xs font-semibold text-emerald-300 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Firebase Realtime Database URL</span>
            </label>
            <input
              type="url"
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
              placeholder="https://<project-id>-default-rtdb.firebaseio.com"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
            <span className="text-[11px] text-slate-400 block">
              Tempat menyimpan riwayat lonjakan 'PENUH' secara permanen agar data tidak hilang.
            </span>
          </div>

          {/* Blynk Auth Token */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Blynk Device Auth Token</span>
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste Blynk Auth Token..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          {/* Server URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Blynk Server Cluster</span>
            </label>
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <div className="flex gap-2 text-[11px] text-slate-400">
              <span>Cluster Anda:</span>
              <button
                type="button"
                onClick={() => setServerUrl('https://sgp1.blynk.cloud')}
                className="text-emerald-400 hover:underline font-mono"
              >
                https://sgp1.blynk.cloud (Direkomendasikan)
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide shadow-md transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Konfigurasi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
