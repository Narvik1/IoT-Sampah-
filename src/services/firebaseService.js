/**
 * Firebase Realtime Database Service
 * Menggunakan Firebase REST API sehingga super ringan, cepat, dan kompatibel 
 * di semua platform (Browser, Node.js, Vercel, Netlify, maupun ESP32)
 */

export const DEFAULT_FIREBASE_CONFIG = {
  // Ganti dengan URL Realtime Database Firebase Anda
  // Contoh: https://smart-trashbin-default-rtdb.asia-southeast1.firebasedatabase.app
  databaseURL: 'https://smart-trashbin-iot-default-rtdb.firebaseio.com',
};

/**
 * Simpan kondisi status terkini ke Firebase (/current.json)
 */
export async function saveCurrentToFirebase(data, dbUrl = DEFAULT_FIREBASE_CONFIG.databaseURL) {
  if (!dbUrl) return null;
  const cleanUrl = dbUrl.replace(/\/$/, '');
  try {
    const res = await fetch(`${cleanUrl}/current.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        updatedAt: Date.now()
      })
    });
    return res.ok;
  } catch (err) {
    console.warn('Gagal menyimpan ke Firebase /current.json:', err);
    return false;
  }
}

/**
 * Catat riwayat baru ke Firebase (/history.json)
 * Dipanggil otomatis saat tempat sampah berganti status menjadi PENUH
 */
export async function pushHistoryToFirebase(eventData, dbUrl = DEFAULT_FIREBASE_CONFIG.databaseURL) {
  if (!dbUrl) return null;
  const cleanUrl = dbUrl.replace(/\/$/, '');
  try {
    const res = await fetch(`${cleanUrl}/history.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...eventData,
        timestamp: Date.now()
      })
    });
    return res.ok;
  } catch (err) {
    console.warn('Gagal push riwayat ke Firebase /history.json:', err);
    return false;
  }
}

/**
 * Ambil seluruh riwayat tersimpan dari Firebase (/history.json)
 * Untuk memuat grafik sehingga data sebelumnya TIDAK HILANG
 */
export async function fetchHistoryFromFirebase(dbUrl = DEFAULT_FIREBASE_CONFIG.databaseURL) {
  if (!dbUrl) return [];
  const cleanUrl = dbUrl.replace(/\/$/, '');
  try {
    const res = await fetch(`${cleanUrl}/history.json?orderBy="$key"&limitToLast=40`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data) return [];

    // Konversi object Firebase { "-Nxyz...": { time, status, ... } } menjadi Array terurut
    const records = Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));

    return records.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  } catch (err) {
    console.warn('Gagal mengambil riwayat dari Firebase:', err);
    return [];
  }
}

/**
 * Ambil data terkini dari Firebase (/current.json)
 */
export async function fetchCurrentFromFirebase(dbUrl = DEFAULT_FIREBASE_CONFIG.databaseURL) {
  if (!dbUrl) return null;
  const cleanUrl = dbUrl.replace(/\/$/, '');
  try {
    const res = await fetch(`${cleanUrl}/current.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

