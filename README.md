# 🗑️ Smart Trash Bin IoT Dashboard (ESP32 + Blynk Cloud)

Dashboard web responsif dan interaktif untuk memantau sistem IoT Tempat Sampah Pintar berbasis ESP32, terintegrasi langsung dengan **Blynk Cloud REST API** serta memiliki **Mode Simulasi Real-Time 2 Detik** (menggunakan React, Tailwind CSS, Recharts, dan Chart.js).

---

## 🚀 Fitur Utama

1. **Top-Left Card: Ultrasonik Tangan (Blynk V0)**:
   - Menampilkan jarak deteksi tangan secara real-time (cm).
   - Indikator kehadiran tangan & status buka/tutup servo otomatis (90° / 0°).
   - Visual gauge bar dengan penanda ambang batas.

2. **Top-Right Card: Dynamic Status Indicator (Blynk V1 & V4)**:
   - **Jika jarak 'Ultrasonik Sampah' $\le$ 5 cm**: Background kartu berubah menjadi **MERAH** (`bg-red-600`) dan menampilkan tulisan tebal **PENUH**.
   - **Jika jarak 'Ultrasonik Sampah' > 5 cm**: Background kartu berubah menjadi **LIME GREEN** (`bg-lime-500`) dan menampilkan tulisan tebal **KOSONG**.
   - Indikator status fisik ESP32: LED Hijau/Merah dan Buzzer Alarm.

3. **Bottom Card: Grafik Real-Time Ultrasonik Sampah**:
   - Memetakan riwayat jarak isi sampah terhadap waktu dengan format sumbu X `HH:mm:ss`.
   - Menggunakan **Recharts** (pada React app) dan **Chart.js** (pada standalone HTML).
   - Dilengkapi garis referensi merah ambang batas 5 cm.
   - Pilihan melihat **Live Stream (2 Detik)** atau **Riwayat Blynk Per Jam (24 Jam)** via endpoint Blynk `/external/api/data/get` (`granularityType=HOURLY`).

4. **Form Pengaturan Ambang Jarak (Blynk V2 & V3)**:
   - Form input interaktif untuk mengatur ambang jarak tangan (V2) dan ambang penuh (V3).
   - Mengirim nilai ke endpoint Blynk Cloud:
     `https://blynk.cloud/external/api/update?token={token}&V2={val}&V3={val}`

5. **Mode Simulasi 2 Detik (Real-Time Demo)**:
   - Diimplementasikan dengan `useEffect` & `setInterval` setiap **2 detik**.
   - Menghasilkan nilai sensor sampah acak antara **2 hingga 15 cm**.
   - Memungkinkan demonstrasi langsung perpindahan status **PENUH** $\leftrightarrow$ **KOSONG** dan pembaruan grafik tanpa harus menyalakan hardware ESP32.

---

## 📂 Struktur File

```
Dashboard/
├── src/
│   ├── components/
│   │   ├── Header.jsx              # Navbar, switch mode simulasi/live, status koneksi
│   │   ├── HandSensorCard.jsx      # Top-Left Card: Ultrasonik Tangan
│   │   ├── TrashStatusCard.jsx     # Top-Right Card: Status PENUH (Merah) / KOSONG (Lime Green)
│   │   ├── RealtimeChartCard.jsx   # Bottom Card: Recharts Line Chart (HH:mm:ss)
│   │   ├── ThresholdFormCard.jsx   # Form input ambang V2 & V3 ke Blynk Cloud
│   │   ├── ConfigModal.jsx         # Modal pengaturan Blynk Auth Token & Server URL
│   │   └── EspCodeModal.jsx        # Modal berisi kode Arduino ESP32 lengkap
│   ├── services/
│   │   └── blynkService.js         # Fetch API wrapper untuk endpoint Blynk Cloud
│   ├── App.jsx                     # Komponen utama & logic useEffect 2 detik
│   ├── index.css                   # Tailwind styles
│   └── main.jsx
├── standalone.html                 # Versi single-file HTML, CSS, JS + Chart.js (Zero-setup!)
├── vercel.json                     # Konfigurasi siap deploy ke Vercel
├── netlify.toml                    # Konfigurasi siap deploy ke Netlify
├── vite.config.js
└── package.json
```

---

## 💻 Cara Menjalankan

### Opsi 1: Menjalankan React + Vite App (Rekomendasi)
```bash
# 1. Jalankan development server
npm run dev

# 2. Atau build untuk produksi
npm run build
npm run preview
```
Buka browser di `http://localhost:3000` (atau port yang tertera).

### Opsi 2: Standalone HTML (Langsung Klik Tanpa Node.js)
Cukup buka file `standalone.html` langsung di browser Anda (Google Chrome, Edge, Firefox, Safari).

---

## ☁️ Cara Deploy ke Vercel / Netlify

### Deploy ke Vercel:
1. Push folder ini ke GitHub / GitLab.
2. Buka [vercel.com](https://vercel.com) $\rightarrow$ **Add New Project** $\rightarrow$ Pilih repository ini.
3. Framework Preset: **Vite** (otomatis terdeteksi).
4. Klik **Deploy**. `vercel.json` sudah disediakan.

### Deploy ke Netlify:
1. Tarik (Drag & Drop) folder `dist` ke [app.netlify.com/drop](https://app.netlify.com/drop).
2. Atau hubungkan GitHub repository, Netlify akan membaca `netlify.toml` secara otomatis.

---

## 🔌 Pemetaan Datastream Blynk Cloud

| Virtual Pin | Tipe | Fungsi | Deskripsi |
| :---: | :---: | :---: | :--- |
| **V0** | Integer / Double | Jarak Tangan (cm) | Sensor Ultrasonik Tangan (Trig 32, Echo 34) |
| **V1** | Integer | Status Penuh | 1 = PENUH, 0 = KOSONG |
| **V2** | Integer | Ambang Jarak Tangan (cm) | Diatur dari form dashboard (Default: 10 cm) |
| **V3** | Integer | Ambang Jarak Penuh (cm) | Diatur dari form dashboard (Default: 5 cm) |
| **V4** | Integer / Double | Jarak Isi Sampah (cm) | Sensor Ultrasonik Isi Sampah (Trig 33, Echo 35) |

---

## 🛠️ Modifikasi Tambahan pada Kode ESP32 Anda

Agar ESP32 Anda dapat menerima pengaturan ambang dari dashboard via Blynk Cloud dan mengirimkan jarak sensor isi ke V4, tambahkan handler berikut ke dalam file Arduino Anda:

```cpp
// 1. Terima nilai Ambang Tangan (V2) dari Dashboard
BLYNK_WRITE(V2) {
  int nilaiV2 = param.asInt();
  if (nilaiV2 > 0) {
    JARAK_TANGAN_CM = nilaiV2;
    Serial.printf("[Blynk] Ambang Jarak Tangan diubah: %d cm\\n", JARAK_TANGAN_CM);
  }
}

// 2. Terima nilai Ambang Penuh (V3) dari Dashboard
BLYNK_WRITE(V3) {
  int nilaiV3 = param.asInt();
  if (nilaiV3 > 0) {
    JARAK_PENUH_CM = nilaiV3;
    Serial.printf("[Blynk] Ambang Jarak Penuh diubah: %d cm\\n", JARAK_PENUH_CM);
  }
}

// 3. Pada loop pengiriman Blynk setiap 2 detik:
if (millis() - waktuKirimBlynk >= 2000) {
  Blynk.virtualWrite(V0, jarakTangan);         // V0: Jarak Tangan
  Blynk.virtualWrite(V1, statusPenuh ? 1 : 0); // V1: Status Penuh
  Blynk.virtualWrite(V4, jarakIsi);            // V4: Jarak Isi Sampah (PENTING untuk grafik)
  waktuKirimBlynk = millis();
}
```
*(Kode lengkap siap copy-paste juga tersedia langsung di dalam tombol modal `</> Kode ESP32` di dashboard).*

