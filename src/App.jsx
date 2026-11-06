import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import HandSensorCard from './components/HandSensorCard';
import TrashStatusCard from './components/TrashStatusCard';
import RealtimeChartCard from './components/RealtimeChartCard';
import ConfigModal from './components/ConfigModal';
import EspCodeModal from './components/EspCodeModal';
import {
  DEFAULT_CONFIG,
  getPinValue,
  checkHardwareConnected
} from './services/blynkService';
import {
  DEFAULT_FIREBASE_CONFIG,
  saveCurrentToFirebase,
  pushHistoryToFirebase,
  fetchHistoryFromFirebase
} from './services/firebaseService';
import {
  playAlertBuzzer,
  requestNotificationPermission,
  showDesktopNotification
} from './services/notificationService';
import { Cpu, Wifi, WifiOff, AlertTriangle, BellRing, X, Database } from 'lucide-react';

export default function App() {
  const [isSimulation, setIsSimulation] = useState(false);

  // Hardware & Config
  const [blynkConfig, setBlynkConfig] = useState(DEFAULT_CONFIG);
  const [firebaseUrl, setFirebaseUrl] = useState(DEFAULT_FIREBASE_CONFIG.databaseURL);
  const [isHardwareOnline, setIsHardwareOnline] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Sensor state
  const [handDistance, setHandDistance] = useState(4);
  const [isFull, setIsFull] = useState(false);
  
  // Ref untuk melacak status sebelumnya (untuk mendeteksi transisi KOSONG -> PENUH)
  const prevIsFullRef = useRef(false);

  // Notification Toast State
  const [notifToast, setNotifToast] = useState(null); // { message, time }
  const [notifPermission, setNotifPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Riwayat data permanen
  const [historyRecords, setHistoryRecords] = useState([]);

  // Modals
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isEspCodeOpen, setIsEspCodeOpen] = useState(false);

  const getFormatHourMinute = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // Muat riwayat awal dari Firebase (atau localStorage sebagai cadangan)
  useEffect(() => {
    async function loadPastHistory() {
      // 1. Coba ambil dari Firebase
      const firebaseLogs = await fetchHistoryFromFirebase(firebaseUrl);
      if (firebaseLogs && firebaseLogs.length > 0) {
        setHistoryRecords(firebaseLogs.map(item => ({
          time: item.time || (item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'),
          status: item.status ?? (item.isFull ? 1 : 0),
          timestamp: item.timestamp || Date.now()
        })));
        return;
      }

      // 2. Jika Firebase belum ada data, ambil dari LocalStorage
      try {
        const saved = localStorage.getItem('blynk_trash_history_react');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHistoryRecords(parsed);
            return;
          }
        }
      } catch (e) {}

      // 3. Fallback default
      const records = [];
      const now = new Date();
      for (let i = 12; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 5 * 60 * 1000);
        const hour = d.getHours().toString().padStart(2, '0');
        const min = d.getMinutes().toString().padStart(2, '0');
        records.push({
          time: `${hour}:${min}`,
          status: (i === 2) ? 1 : 0,
          timestamp: d.getTime()
        });
      }
      setHistoryRecords(records);
    }

    loadPastHistory();
  }, [firebaseUrl]);

  // Request permission notifikasi saat pertama kali
  const handleRequestNotif = async () => {
    const res = await requestNotificationPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      showDesktopNotification('🔔 Notifikasi Aktif', 'Anda akan menerima pemberitahuan otomatis saat tempat sampah PENUH.');
    }
  };

  // =========================================================================
  // FUNGSI UTAMA: TRIGGER NOTIFIKASI DARI KOSONG KE PENUH
  // =========================================================================
  const handleStatusTransition = (newFullStatus, currentHand) => {
    const prevFull = prevIsFullRef.current;

    // DETEKSI TRANSISI: KOSONG -> PENUH
    if (!prevFull && newFullStatus) {
      console.log('🚨 TRANSISI TERDETEKSI: KOSONG -> PENUH!');

      // 1. Bunyikan Alarm Suara Buzzer
      playAlertBuzzer();

      // 2. Notifikasi Pop-up Desktop/Mobile
      showDesktopNotification(
        '🚨 Tempat Sampah Telah PENUH!',
        'Tempat sampah baru saja terisi penuh. Mohon segera dikosongkan!'
      );

      // 3. Toast Alert di Layar
      setNotifToast({
        title: 'TEMPAT SAMPAH PENUH!',
        desc: `Kondisi berubah dari KOSONG ke PENUH pada pukul ${new Date().toLocaleTimeString()}.`,
        time: new Date()
      });

      // 4. Catat permanen ke Firebase Database
      const eventRecord = {
        time: getFormatHourMinute(),
        status: 1,
        isFull: true,
        handDistance: currentHand,
        event: 'KOSONG_KE_PENUH'
      };
      pushHistoryToFirebase(eventRecord, firebaseUrl);
    }

    prevIsFullRef.current = newFullStatus;
  };

  // =========================================================================
  // MODE SIMULASI (2 DETIK)
  // =========================================================================
  useEffect(() => {
    if (!isSimulation) return;

    let tick = 0;
    const intervalId = setInterval(() => {
      tick++;
      const randomHand = Math.floor(Math.random() * (24 - 4 + 1)) + 4;
      // Simulasi berganti status
      const fullStatus = (tick % 4 === 0);

      // Trigger Notifikasi jika berganti dari Kosong ke Penuh
      handleStatusTransition(fullStatus, randomHand);

      setHandDistance(randomHand);
      setIsFull(fullStatus);
      setLastUpdated(new Date());

      const nowTime = getFormatHourMinute();
      setHistoryRecords((prev) => {
        const last = prev[prev.length - 1];
        let next;
        if (!last || last.time !== nowTime) {
          next = [...prev, { time: nowTime, status: fullStatus ? 1 : 0 }];
          if (next.length > 60) next.shift();
        } else {
          next = prev.map((item, idx) =>
            idx === prev.length - 1 ? { ...item, status: fullStatus ? 1 : 0 } : item
          );
        }
        try {
          localStorage.setItem('blynk_trash_history_react', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }, 2500);

    return () => clearInterval(intervalId);
  }, [isSimulation, firebaseUrl]);

  // =========================================================================
  // MODE BLYNK LIVE + FIREBASE SYNC
  // =========================================================================
  const fetchBlynkData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Cek status hardware ESP32
      const online = await checkHardwareConnected(blynkConfig.token, blynkConfig.serverUrl);
      setIsHardwareOnline(online);

      // 2. Ambil V0 (Jarak Tangan)
      const v0Text = await getPinValue(blynkConfig.token, 'V0', blynkConfig.serverUrl);
      const v0Num = parseFloat(v0Text);
      const currentHand = !isNaN(v0Num) ? Math.round(v0Num) : handDistance;
      setHandDistance(currentHand);

      // 3. Ambil V1 (Kondisi: KOSONG atau PENUH)
      const v1Text = (await getPinValue(blynkConfig.token, 'V1', blynkConfig.serverUrl)).toUpperCase();
      const currentFull = (v1Text === '1' || v1Text === 'PENUH');
      setIsFull(currentFull);

      // Cek transisi status untuk membunyikan alarm & notifikasi pop-up
      handleStatusTransition(currentFull, currentHand);

      // Simpan kondisi terkini ke Firebase /current.json
      saveCurrentToFirebase({
        handDistance: currentHand,
        isFull: currentFull ? 1 : 0,
        status: currentFull ? 'PENUH' : 'KOSONG'
      }, firebaseUrl);

      setLastUpdated(new Date());

      const nowTime = getFormatHourMinute();
      setHistoryRecords((prev) => {
        const last = prev[prev.length - 1];
        let next;
        if (!last || last.time !== nowTime) {
          next = [...prev, { time: nowTime, status: currentFull ? 1 : 0 }];
          if (next.length > 60) next.shift();
        } else {
          next = prev.map((item, idx) =>
            idx === prev.length - 1 ? { ...item, status: currentFull ? 1 : 0 } : item
          );
        }
        try {
          localStorage.setItem('blynk_trash_history_react', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    } catch (err) {
      console.warn('Gagal ambil data Blynk Cloud:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isSimulation) return;

    fetchBlynkData();
    const intervalId = setInterval(fetchBlynkData, blynkConfig.refreshInterval || 2000);

    return () => clearInterval(intervalId);
  }, [isSimulation, blynkConfig, firebaseUrl]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white relative">
      {/* Pop-up Banner Notifikasi Tempat Sampah Penuh */}
      {notifToast && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-red-600 border border-red-400 text-white p-4 rounded-2xl shadow-2xl shadow-red-600/40 animate-bounce flex items-start gap-3">
          <div className="p-2 bg-red-700 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm tracking-wide">{notifToast.title}</h4>
            <p className="text-xs text-red-100 mt-0.5">{notifToast.desc}</p>
            <span className="text-[10px] text-red-200 block mt-1">Dicatat otomatis ke Firebase Realtime Database</span>
          </div>
          <button
            onClick={() => setNotifToast(null)}
            className="text-red-200 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navbar */}
      <Header
        isSimulation={isSimulation}
        setIsSimulation={setIsSimulation}
        isHardwareOnline={isHardwareOnline}
        isRefreshing={isRefreshing}
        onManualRefresh={fetchBlynkData}
        onOpenSettings={() => setIsConfigOpen(true)}
        onOpenEspCode={() => setIsEspCodeOpen(true)}
        notifPermission={notifPermission}
        onRequestNotif={handleRequestNotif}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* STATUS HARDWARE & DATABASE */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
            isSimulation
              ? 'bg-slate-900/90 border-slate-800'
              : isHardwareOnline
              ? 'bg-emerald-950/30 border-emerald-500/40 shadow-emerald-500/10'
              : 'bg-rose-950/30 border-rose-500/40 shadow-rose-500/10'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`p-2.5 rounded-xl border ${
                isSimulation
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : isHardwareOnline
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              }`}
            >
              {isSimulation ? (
                <Cpu className="w-5 h-5" />
              ) : isHardwareOnline ? (
                <Wifi className="w-5 h-5" />
              ) : (
                <WifiOff className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Status ESP32:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    isSimulation
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : isHardwareOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {isSimulation
                    ? 'SIMULASI AKTIF'
                    : isHardwareOnline
                    ? 'ONLINE'
                    : 'OFFLINE'}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-200 mt-0.5">
                {isSimulation
                  ? 'Mode simulasi: Notifikasi & penyimpanan Firebase tetap berfungsi saat terisi penuh.'
                  : isHardwareOnline
                  ? 'Terhubung'
                  : 'Tidak Terhubung'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
            <div>
              <span className="block text-[11px] text-slate-500">Database History:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Database className="w-3 h-3" />
                Firebase Realtime DB
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500">Notifikasi Alarm:</span>
              <span className={notifPermission === 'granted' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {notifPermission === 'granted' ? 'Aktif (Suara & Pop-up)' : 'Perlu Izin Klik'}
              </span>
            </div>
          </div>
        </div>

        {/* Top 2 Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top-Left Card: Ultrasonik Tangan (V0) */}
          <HandSensorCard
            distance={handDistance}
            threshold={10}
            isFull={isFull}
          />

          {/* Top-Right Card: Status Tempat Sampah (V1: MASIH MUAT / PENUH) */}
          <TrashStatusCard
            isFull={isFull}
          />
        </div>

        {/* BOTTOM CARD: GRAFIK TIMELINE SINKRON FIREBASE */}
        <div className="w-full">
          <RealtimeChartCard
            historyData={historyRecords}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-900/50 py-4 text-center text-xs text-slate-500">
        <p>
          Smart Trash Bin IoT Dashboard • ESP32 + Blynk Cloud + Firebase Realtime Database
        </p>
      </footer>

      {/* Modals */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        blynkConfig={blynkConfig}
        onSaveBlynkConfig={(newCfg) => setBlynkConfig(newCfg)}
        firebaseUrl={firebaseUrl}
        onSaveFirebaseUrl={(newUrl) => setFirebaseUrl(newUrl)}
      />

      <EspCodeModal
        isOpen={isEspCodeOpen}
        onClose={() => setIsEspCodeOpen(false)}
      />
    </div>
  );
}
