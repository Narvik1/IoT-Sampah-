/**
 * Blynk Cloud REST API Service (SGP1 Server Cluster)
 */

export const DEFAULT_CONFIG = {
  token: '5zWSOaBUUsuJz_YnsZsIyN_tD1Mk9koW',
  // Server cluster akun Anda terverifikasi di: sgp1.blynk.cloud
  serverUrl: 'https://sgp1.blynk.cloud',
  handPin: 'V0',       // Ultrasonik Tangan (cm)
  statusPin: 'V1',     // Kondisi Tempat Sampah (0 = KOSONG, 1 = PENUH)
  refreshInterval: 2000, // ms
};

/**
 * Fetch a single pin value from Blynk Cloud with auto-fallback
 */
export async function getPinValue(token, pin, serverUrl = DEFAULT_CONFIG.serverUrl) {
  const tryUrls = [
    serverUrl,
    'https://sgp1.blynk.cloud',
    'https://blynk.cloud'
  ];

  for (const base of tryUrls) {
    try {
      const url = `${base}/external/api/get?token=${encodeURIComponent(token)}&${pin}`;
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        return text.trim();
      }
    } catch (err) {
      // try next
    }
  }
  throw new Error(`Gagal membaca pin ${pin} dari semua server Blynk`);
}

/**
 * Check if the ESP32 hardware is currently online
 */
export async function checkHardwareConnected(token, serverUrl = DEFAULT_CONFIG.serverUrl) {
  const tryUrls = [
    serverUrl,
    'https://sgp1.blynk.cloud',
    'https://blynk.cloud'
  ];

  for (const base of tryUrls) {
    try {
      const url = `${base}/external/api/isHardwareConnected?token=${encodeURIComponent(token)}`;
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        return text.trim().toLowerCase() === 'true';
      }
    } catch (err) {
      // try next
    }
  }
  return false;
}
