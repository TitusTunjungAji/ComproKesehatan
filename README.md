## Dentavizion (ComproKesehatan)

[![Live Demo](https://img.shields.io/badge/Live_Demo-dentavizion.site-2BAA8E?style=for-the-badge)](https://dentavizion.site/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-2B6CB0?style=for-the-badge)](https://dentavizion.site/)

**Dentavizion** adalah platform aplikasi berbasis **Progressive Web App (PWA)** yang dirancang untuk edukasi, pemantauan kebiasaan sikat gigi harian, serta evaluasi kesehatan gigi masyarakat dan pasien secara interaktif. Platform ini memadukan modul pembelajaran visual, simulasi interaktif, kuis evaluasi, hingga dashboard pengawasan medis bagi admin.

---

## Fitur Utama

### 1. Modul Edukasi Kesehatan Gigi
Panduan visual dan langkah demi langkah untuk pemahaman perawatan gigi dan mulut:
- **Panduan Menyikat Gigi**: Teknik menyikat gigi yang tepat untuk kebersihan maksimal.
- **Panduan Scaling (Pembersihan Karang Gigi)**: Edukasi pentingnya scaling berkala.
- **Panduan Penambalan Gigi (Tambal)**: Prosedur dan perawatan pasca-penambalan.
- **Panduan Pencabutan Gigi (Cabut)**: Langkah penanganan dan pemulihan pasca-pencabutan.

### 2. Simulasi & Praktik Interaktif (AR Practice)
Latihan menyikat gigi secara real-time yang interaktif menggunakan simulasi kamera dan panduan visual untuk membantu peserta membangun kebiasaan menyikat gigi yang benar.

### 3. Kuis Evaluasi & Sistem Reward
- Kuis interaktif pada setiap modul edukasi untuk menguji pemahaman peserta.
- Sistem pencatatan **Streak Hari Aktif**, medali, dan pelacakan progres belajar secara otomatis.

### 4. Pelaporan Harian & Galeri Foto Gigi
- Peserta dapat mengunggah foto perkembangan kondisi gigi secara berkala.
- Catatan riwayat aktivitas harian yang tersimpan aman di cloud database.

### 5. Portal Admin (Medical Dashboard)
- Dashboard khusus bagi tenaga medis atau administrator untuk memantau aktivitas peserta.
- Fitur pencarian dan filter data peserta (Streak, Progres Modul, dan Jumlah Foto).
- Tampilan detail galeri foto gigi peserta untuk analisa dan pemantauan jarak jauh.
- Sistem **Role-Based Access Control (RBAC)** dan pemulihan kata sandi admin.

### 6. Progressive Web App (PWA) & Offline Support
- Didukung oleh *Service Worker* dan `manifest.json` sehingga dapat di-install langsung ke layar utama smartphone (Android/iOS) maupun desktop layaknya aplikasi native.
- Tampilan responsif dengan dukungan **Mode Terang (Light Mode)** dan **Mode Gelap (Dark Mode)**.

---

## Teknologi yang Digunakan

* **Frontend Architecture**: Semantic HTML5, Vanilla CSS3 (Custom Design System & Variables), Vanilla JavaScript (ES6+ Modules).
* **Backend & Cloud Services**: [Google Firebase](https://firebase.google.com/) (Firebase Authentication & Cloud Firestore Database).
* **PWA & Storage**: Native Service Worker API, Cache Storage, LocalStorage Session Management.
* **UI/UX Aesthetics**: Glassmorphism elements, custom SVG iconography, smooth micro-animations.

---

## Struktur Direktori Proyek

```text
ComproKesehatan/
├── admin/               # Portal Admin (Dashboard, Manajemen Peserta, & Login Admin)
├── assets/              # Aset Statis (Gambar panduan, ikon, & logo)
├── css/                 # Styling sistem (variables.css, base.css, & page-specific styles)
├── docs/                # Dokumentasi tambahan proyek
├── js/                  # Logika aplikasi (Firebase config, PWA registration, & progression logic)
├── pages/               # Halaman utama aplikasi (Home, Login, Register, Modul, Kuis, & Profil)
├── index.html           # Landing Page utama aplikasi
├── manifest.json        # Konfigurasi PWA (Web App Manifest)
├── sw.js                # Service Worker untuk caching & PWA offline support
├── cors.json            # Konfigurasi CORS Storage/Firebase
└── .gitignore           # Daftar pengabaian file untuk Git
```

---

## Live Deployment (Aplikasi Online)

Aplikasi telah resmi di-deploy dan dapat diakses langsung oleh publik atau di-install sebagai PWA di smartphone/laptop Anda melalui tautan berikut:

**[https://dentavizion.site/](https://dentavizion.site/)**

---

## Cara Menjalankan secara Lokal

Karena aplikasi ini menggunakan **ES6 Modules** dan integrasi **Firebase**, aplikasi harus dijalankan melalui web server lokal (tidak bisa dibuka langsung via `file://`).

1. **Gunakan Live Server (VS Code Extension)**:
   - Buka folder proyek di Visual Studio Code.
   - Klik kanan pada file `index.html` dan pilih **"Open with Live Server"**.
2. **Atau menggunakan Node.js HTTP Server**:
   ```bash
   npx http-server . -p 8000
   ```
3. Buka browser dan akses `http://localhost:8000`.

---