import React, { useState } from 'react';
import { X, Copy, Check, Cpu } from 'lucide-react';

const ESP32_FIREBASE_CODE = `/*
  Tempat Sampah Pintar IoT - ESP32 (Blynk Cloud + Firebase Realtime Database)
  - V0: Jarak Tangan (cm)
  - V1: Status (0 = KOSONG, 1 = PENUH)
  - Firebase /current.json: Data status terkini
  - Firebase /history.json: Riwayat permanen (dicatat otomatis saat PENUH)
  - Telegram Bot Alert saat PENUH
*/

// ================== KODE BLYNK ==================
#define BLYNK_TEMPLATE_ID "TMPL6ehUBedMN"
#define BLYNK_TEMPLATE_NAME "New Template"
#define BLYNK_AUTH_TOKEN "5zWSOaBUUsuJz_YnsZsIyN_tD1Mk9koW"

#define BLYNK_PRINT Serial
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <BlynkSimpleEsp32.h>

// ================== KONFIGURASI WIFI & FIREBASE ==================
const char* WIFI_SSID = "NEW ANGOP GEBANG"; // Ganti dengan WiFi Anda
const char* WIFI_PASS = "KUKUBIMASUSU";     // Ganti dengan Password WiFi Anda

// Ganti dengan URL Realtime Database Firebase Anda (akhiri TANPA tanda slash "/")
const String FIREBASE_HOST = "https://smart-trashbin-iot-default-rtdb.firebaseio.com";

// Konfigurasi Telegram Bot
const String BOT_TOKEN = "9032804663:AAGkHJfARcQtedcjJOXEGnWzWIVIUAnpUHQ";
const String CHAT_ID   = "5816072064";

// ================== PIN HARDWARE ==================
#define TRIG_TANGAN 32
#define ECHO_TANGAN 34   // input-only
#define TRIG_ISI    33
#define ECHO_ISI    35   // input-only
#define LED_HIJAU   26
#define LED_MERAH   27
#define PIN_SERVO   23
#define PIN_BUZZER  22

const int JARAK_TANGAN_CM = 10;
const int JARAK_PENUH_CM  = 5;
const int SERVO_TUTUP     = 0;
const int SERVO_BUKA      = 90;
const unsigned long TAHAN_BUKA_MS = 3000;
const int JUMLAH_KONFIRMASI = 3;
const unsigned long INTERVAL_ALARM_PENUH = 10000;

Servo servo;
bool tutupTerbuka = false;
bool statusPenuh = false;
bool statusPenuhSebelumnya = false; // Untuk mendeteksi transisi Kosong -> Penuh
bool notifTerkirim = false;
int hitungPenuh = 0;
int hitungKosong = 0;
unsigned long waktuTanganTerakhir = 0;
unsigned long waktuCekWifi = 0;
unsigned long waktuAlarmPenuhTerakhir = 0;
unsigned long waktuKirimBlynk = 0;

// === FUNGSI KIRIM DATA KE FIREBASE REST API ===
void kirimKeFirebase(long tangan, bool penuh) {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  // 1. Update status terkini di /current.json
  String urlCurrent = FIREBASE_HOST + "/current.json";
  if (http.begin(client, urlCurrent)) {
    http.addHeader("Content-Type", "application/json");
    String payload = "{\\"handDistance\\":" + String(tangan) + 
                     ",\\"isFull\\":" + (penuh ? "1" : "0") + 
                     ",\\"status\\":\\"" + (penuh ? "PENUH" : "KOSONG") + "\\"}";
    http.PUT(payload);
    http.end();
  }
}

// === FUNGSI SIMPAN RIWAYAT PERMANEN SAAT PENUH ===
void catatRiwayatPenuhFirebase(long tangan) {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  // Push record baru ke /history.json (POST)
  String urlHistory = FIREBASE_HOST + "/history.json";
  if (http.begin(client, urlHistory)) {
    http.addHeader("Content-Type", "application/json");
    String payload = "{\\"status\\":1,\\"handDistance\\":" + String(tangan) + 
                     ",\\"event\\":\\"TEMPAT_SAMPAH_PENUH\\"}";
    http.POST(payload);
    http.end();
    Serial.println("[Firebase] Riwayat lonjakan PENUH berhasil dicatat permanen!");
  }
}

long bacaSekali(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long durasi = pulseIn(echoPin, HIGH, 30000);
  if (durasi == 0) return 999;
  return durasi * 0.0343 / 2;
}

long bacaJarakCM(int trigPin, int echoPin) {
  long a = bacaSekali(trigPin, echoPin); delay(10);
  long b = bacaSekali(trigPin, echoPin); delay(10);
  long c = bacaSekali(trigPin, echoPin);
  if ((a >= b && a <= c) || (a <= b && a >= c)) return a;
  if ((b >= a && b <= c) || (b <= a && b >= c)) return b;
  return c;
}

void sambungWiFi(unsigned long batasMs) {
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Menghubungkan WiFi");
  unsigned long mulai = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - mulai < batasMs) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? "\\nWiFi terhubung" : "\\nWiFi gagal (mode offline)");
}

void kirimTelegram(String pesan) {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  pesan.replace(" ", "%20");
  String url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage?chat_id=" + CHAT_ID + "&text=" + pesan;
  if (http.begin(client, url)) {
    http.GET();
    http.end();
  }
}

void setLampu(bool penuh) {
  digitalWrite(LED_MERAH, penuh ? HIGH : LOW);
  digitalWrite(LED_HIJAU, penuh ? LOW : HIGH);
}

void bunyiAlarm() {
  for (int i = 0; i < 3; i++) {
    for (int freq = 1500; freq <= 3000; freq += 150) {
      tone(PIN_BUZZER, freq); delay(5);
    }
    noTone(PIN_BUZZER); delay(150);
  }
}

void bunyiPenuh() {
  for (int i = 0; i < 3; i++) {
    tone(PIN_BUZZER, 1000); delay(400);
    noTone(PIN_BUZZER); delay(200);
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(TRIG_TANGAN, OUTPUT);
  pinMode(ECHO_TANGAN, INPUT);
  pinMode(TRIG_ISI, OUTPUT);
  pinMode(ECHO_ISI, INPUT);
  pinMode(LED_HIJAU, OUTPUT);
  pinMode(LED_MERAH, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  servo.setPeriodHertz(50);
  servo.attach(PIN_SERVO, 500, 2400);
  servo.write(SERVO_TUTUP);

  setLampu(false);
  sambungWiFi(10000);
  Blynk.config(BLYNK_AUTH_TOKEN);
}

void loop() {
  Blynk.run();

  if (WiFi.status() != WL_CONNECTED && millis() - waktuCekWifi > 30000) {
    waktuCekWifi = millis();
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASS);
  }

  long jarakTangan = bacaJarakCM(TRIG_TANGAN, ECHO_TANGAN);
  delay(30);
  long jarakIsi = bacaJarakCM(TRIG_ISI, ECHO_ISI);

  bool tanganTerdeteksi = (jarakTangan <= JARAK_TANGAN_CM);

  if (jarakIsi <= JARAK_PENUH_CM) {
    hitungPenuh++; hitungKosong = 0;
    if (hitungPenuh >= JUMLAH_KONFIRMASI) statusPenuh = true;
  } else {
    hitungKosong++; hitungPenuh = 0;
    if (hitungKosong >= JUMLAH_KONFIRMASI) statusPenuh = false;
  }

  // === DETEKSI TRANSISI DARI KOSONG KE PENUH ===
  if (!statusPenuhSebelumnya && statusPenuh) {
    Serial.println(">>> TERJADI PERUBAHAN: DARI KOSONG KE PENUH! <<<");
    catatRiwayatPenuhFirebase(jarakTangan); // Simpan permanen ke Firebase
    kirimTelegram("🚨 PERINGATAN: Tempat sampah telah PENUH, mohon segera dikosongkan!");
  }
  statusPenuhSebelumnya = statusPenuh;

  // === KIRIM KE BLYNK & FIREBASE TIAP 2 DETIK ===
  if (millis() - waktuKirimBlynk >= 2000) {
    Blynk.virtualWrite(V0, jarakTangan);         // V0: Jarak Tangan
    Blynk.virtualWrite(V1, statusPenuh ? 1 : 0); // V1: Status (1/0)
    kirimKeFirebase(jarakTangan, statusPenuh);   // Kirim ke Firebase /current.json
    waktuKirimBlynk = millis();
  }

  Serial.printf("Tangan: %ld cm | Isi: %ld cm | %s\\n", jarakTangan, jarakIsi, statusPenuh ? "PENUH" : "BELUM PENUH");
  setLampu(statusPenuh);

  if (statusPenuh) {
    if (!notifTerkirim) {
      notifTerkirim = true;
      waktuAlarmPenuhTerakhir = millis() - INTERVAL_ALARM_PENUH;
    }
    if (millis() - waktuAlarmPenuhTerakhir >= INTERVAL_ALARM_PENUH) {
      bunyiPenuh(); waktuAlarmPenuhTerakhir = millis();
    }
    if (tutupTerbuka) {
      servo.write(SERVO_TUTUP); tutupTerbuka = false;
    }
    if (tanganTerdeteksi) { bunyiAlarm(); }
  } else {
    notifTerkirim = false;
    if (tanganTerdeteksi) {
      waktuTanganTerakhir = millis();
      if (!tutupTerbuka) { servo.write(SERVO_BUKA); tutupTerbuka = true; }
    }
    if (tutupTerbuka && !tanganTerdeteksi && (millis() - waktuTanganTerakhir > TAHAN_BUKA_MS)) {
      servo.write(SERVO_TUTUP); tutupTerbuka = false;
    }
  }

  delay(100);
}`;

export default function EspCodeModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(ESP32_FIREBASE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Kode ESP32 (Blynk + Firebase Realtime DB)</h3>
              <p className="text-xs text-slate-400">
                Mencatat riwayat permanen ke Firebase <code>/history.json</code> otomatis saat berubah dari KOSONG ke PENUH
              </p>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-all border border-slate-600"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Kode</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-slate-900/90 rounded-xl p-4 overflow-auto font-mono text-xs text-slate-300 border border-slate-700/80 flex-1">
          <pre>{ESP32_FIREBASE_CODE}</pre>
        </div>
      </div>
    </div>
  );
}
