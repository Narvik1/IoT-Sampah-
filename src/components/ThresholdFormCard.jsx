import React, { useState } from 'react';
import { Sliders, Send, CheckCircle2, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { updatePinValues } from '../services/blynkService';

export default function ThresholdFormCard({
  handThreshold,
  setHandThreshold,
  trashThreshold,
  setTrashThreshold,
  blynkConfig,
  isSimulation
}) {
  const [inputHand, setInputHand] = useState(handThreshold);
  const [inputTrash, setInputTrash] = useState(trashThreshold);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Synchronize local input state if props change from outside
  React.useEffect(() => {
    setInputHand(handThreshold);
  }, [handThreshold]);

  React.useEffect(() => {
    setInputTrash(trashThreshold);
  }, [trashThreshold]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    const handVal = parseInt(inputHand, 10);
    const trashVal = parseInt(inputTrash, 10);

    if (isNaN(handVal) || isNaN(trashVal)) {
      setStatusMessage({ type: 'error', text: 'Masukkan nilai angka yang valid!' });
      setIsLoading(false);
      return;
    }

    try {
      if (!isSimulation) {
        // Send values to Blynk Cloud API Datastream V2 and V3
        // Endpoint: https://blynk.cloud/external/api/update?token=...&V2=...&V3=...
        await updatePinValues(
          blynkConfig.token,
          {
            [blynkConfig.handThreshPin || 'V2']: handVal,
            [blynkConfig.trashThreshPin || 'V3']: trashVal
          },
          blynkConfig.serverUrl
        );
      }

      // Update state in app
      setHandThreshold(handVal);
      setTrashThreshold(trashVal);

      setStatusMessage({
        type: 'success',
        text: isSimulation
          ? `Ambang batas diperbarui di mode simulasi: Tangan = ${handVal} cm, Penuh = ${trashVal} cm`
          : `Tersimpan ke Blynk Cloud! V2=${handVal} & V3=${trashVal} berhasil di-update.`
      });

      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Gagal mengirim ke Blynk Cloud: ${err.message || 'Periksa Auth Token atau koneksi internet.'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyPreset = (h, t) => {
    setInputHand(h);
    setInputTrash(t);
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/70 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Pengaturan Ambang Jarak (Blynk V2 & V3)
            </h3>
            <p className="text-xs text-slate-400">
              Kirim parameter batas ke ESP32 via Blynk REST API (<code className="text-purple-300">/external/api/update</code>)
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[11px] text-slate-400 font-medium">Preset:</span>
          <button
            type="button"
            onClick={() => applyPreset(10, 5)}
            className="px-2 py-1 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition-colors"
          >
            Standar (10/5)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(15, 7)}
            className="px-2 py-1 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition-colors"
          >
            Sedang (15/7)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(20, 10)}
            className="px-2 py-1 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition-colors"
          >
            Besar (20/10)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hand Detection Threshold (V2) */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="handThresh" className="text-xs font-semibold text-slate-200">
                Ambang Deteksi Tangan (cm)
              </label>
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Datastream V2
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="handThresh"
                type="number"
                min="3"
                max="50"
                value={inputHand}
                onChange={(e) => setInputHand(e.target.value)}
                className="w-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="range"
                min="3"
                max="40"
                value={inputHand}
                onChange={(e) => setInputHand(e.target.value)}
                className="flex-1 accent-blue-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
              />
              <span className="text-xs text-slate-400 font-mono w-10 text-right">{inputHand} cm</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Servo membuka otomatis jika jarak tangan ≤ nilai ini (Default: 10 cm).
            </p>
          </div>

          {/* Trash Full Threshold (V3) */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="trashThresh" className="text-xs font-semibold text-slate-200">
                Ambang Jarak Penuh (cm)
              </label>
              <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                Datastream V3
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="trashThresh"
                type="number"
                min="2"
                max="30"
                value={inputTrash}
                onChange={(e) => setInputTrash(e.target.value)}
                className="w-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-center font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <input
                type="range"
                min="2"
                max="25"
                value={inputTrash}
                onChange={(e) => setInputTrash(e.target.value)}
                className="flex-1 accent-red-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
              />
              <span className="text-xs text-slate-400 font-mono w-10 text-right">{inputTrash} cm</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Tempat sampah dinyatakan PENUH jika jarak sensor isi ≤ nilai ini (Default: 5 cm).
            </p>
          </div>
        </div>

        {/* Submit and Feedback */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {statusMessage ? (
            <div
              className={`flex items-center gap-2 text-xs p-2.5 rounded-xl border flex-1 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span className="truncate">{statusMessage.text}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Perubahan nilai akan langsung mempengaruhi logika dashboard & ESP32.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs tracking-wide shadow-md hover:shadow-purple-500/20 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Mengirim ke Blynk...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Update Datastream V2 & V3</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

