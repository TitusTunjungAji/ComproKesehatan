# 📋 Notulensi Perubahan & Panduan Penjaminan Mutu (QA)
**Proyek DENTAVIZION — Pembaruan Sistem Admin & Perbaikan UX**

Dokumen ini ditujukan bagi tim QA (Quality Assurance) atau penguji untuk memverifikasi seluruh fitur baru, perbaikan bug (*glitch*), dan perubahan alur pengguna (*UX*) yang telah diterapkan.

---

## 1. Fitur Baru: Dashboard Admin Terpisah
Sistem dashboard admin baru telah dibuat terpisah dari aplikasi pengguna utama untuk memantau data pasien dan progres foto klinis.

### A. Halaman Login Admin
*   **File:** [admin/index.html](file:///c:/Semester/Semester%206/Computing%20project/DENTAVIZION/ComproKesehatan/admin/index.html)
*   **Fokus Uji QA:**
    *   **Kredensial Pengujian:** Masuk menggunakan Email `admin@denticare.com` dan Password `admin` (fallback instan untuk mempermudah pengujian).
    *   **Keamanan Peran:** Coba login menggunakan akun non-admin. Sistem harus menampilkan pesan error *"Akses Ditolak"*.
    *   **Proteksi Rute:** Buka halaman dashboard secara langsung tanpa login (ketik URL `admin/dashboard.html` di browser). Sistem harus otomatis melempar (*redirect*) Anda kembali ke `index.html`.

### B. Halaman Manajemen Pengguna (User Management)
*   **File:** [admin/dashboard.html](file:///c:/Semester/Semester%206/Computing%20project/DENTAVIZION/ComproKesehatan/admin/dashboard.html)
*   **Fokus Uji QA:**
    *   **Pemuatan Data:** Tabel harus memuat semua user terdaftar secara real-time dari Firestore koleksi `users`.
    *   **Pencarian (*Search*):** Ketik nama atau email user di kolom pencarian. Tabel harus memfilter baris yang cocok secara instan.
    *   **Paginasi (*Pagination*):** Data akan dibatasi 8 pengguna per halaman. Pastikan tombol navigasi halaman (`<`, `1`, `2`, `>`) berfungsi.
    *   **Total Unggahan:** Kolom *Clinical Photos* harus menampilkan jumlah foto yang diunggah pengguna dengan benar (menggunakan badge hijau jika > 0).

### C. Galeri Foto Klinis Pasien (Detail User)
*   **File:** [admin/user-details.html](file:///c:/Semester/Semester%206/Computing%20project/DENTAVIZION/ComproKesehatan/admin/user-details.html)
*   **Fokus Uji QA:**
    *   **Galeri Foto:** Menampilkan semua foto yang diunggah dari Firebase Storage.
    *   **Badge Waktu Dinamis:** Sistem mendeteksi jam unggahan. Jika sebelum jam 12 siang, muncul badge **☀️ Pagi**, jika setelahnya muncul badge **🌙 Malam**.
    *   **Catatan:** Teks catatan harian pengguna (*notes*) harus muncul di bawah foto secara rapi.
    *   **Filter Waktu:** Penggunaan filter "Last 7 Days", "Last 30 Days", dan "All Time" harus memotong tampilan data foto sesuai tanggal pengunggahan.

---

## 2. Perbaikan Glitch Visual & Animasi (UX Fixes)

### A. Halaman Modul (Petualangan Gigi Sehat)
*   **File:** [pages/modules.html](file:///c:/Semester/Semester%206/Computing%20project/DENTAVIZION/ComproKesehatan/pages/modules.html)
*   **Masalah Sebelumnya:** Kartu petualangan merender ulang (*double render*) sehingga animasi masuk berkedip 2x.
*   **Perbaikan QA:** Redundansi render awal telah dihapus. Modul kini hanya memudar masuk secara mulus **satu kali** setelah status Firebase selesai dimuat.

### B. Halaman Profil
*   **File:** [pages/profile.html](file:///c:/Semester/Semester%206/Computing%20project/DENTAVIZION/ComproKesehatan/pages/profile.html)
*   **Masalah Sebelumnya:** 
    1. Teks menyapa berkedip dari *"Hai, Jagoan!"* ke nama asli user.
    2. Statistik mingguan dan piala berkedip 2x akibat *double rendering*.
*   **Perbaikan QA:**
    *   **Flicker Nama Hilang:** Ditambahkan skrip inline sinkron. Browser akan memproses nama dari `localStorage` saat membaca dokumen, sehingga nama user asli langsung muncul tanpa kedipan *placeholder*.
    *   **Transisi Mulus:** Ditambahkan sistem *debounce timeout* (250ms) dan transisi opacity fade-in. Seluruh komponen profil akan memudar masuk bersama-sama secara rapi setelah data siap, menghilangkan kedipan animasi ganda.

---

## 3. Peningkatan Alur Kamera & Unggah Laporan

### A. Fitur Live Webcam & Shutter Capture
*   **File:** [pages/home.html](file:///c:/Semester/Semester%206/Computing%20project/DENTAVIZION/ComproKesehatan/pages/home.html)
*   **Fokus Uji QA:**
    *   **Penyederhanaan Layout:** Tombol kamera di bagian bawah dihapus untuk efisiensi ruang. Tombol **"Pilih dari Galeri"** menjadi opsi tunggal di bawah.
    *   **Ketuk Kartu untuk Kamera:** Mengetuk kotak unggah atas sekarang **langsung meminta izin kamera** browser (webcam di PC/laptop atau kamera depan di smartphone) dan menampilkan siaran video langsung (*live streaming*).
    *   **Tombol Shutter:** Klik tombol kamera bulat hijau untuk mengambil foto. Gambar yang diambil akan langsung muncul sebagai berkas pratinjau siap kirim.
