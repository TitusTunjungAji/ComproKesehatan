# QA Notes: Logic Achievement dan Update Harian

Tanggal: 2026-05-24
Status: Connected (sudah terhubung)

## Tujuan
Mendokumentasikan hubungan logic achievement (modul + XP + level) dengan update harian (laporan sikat gigi) yang sebelumnya dianggap belum terhubung.

## Ringkasan Arsitektur Logic
1. Sumber data utama progress: `buildProgressSnapshot(...)` di `js/progression.js`.
2. Achievement modul: dihitung dari `completedModuleIds`.
3. Achievement harian mingguan: dihitung dari merged report (localStorage + Firestore) dan membuka trophy jika 7/7 hari.
4. XP total: `moduleXp + reportXp`.
5. Level: diturunkan dari total XP (`getLevelFromXp`).

## Titik Koneksi yang Sudah Ada
1. Home (submit laporan harian)
- Simpan laporan ke Firestore (`saveReport`) jika user login.
- Simpan laporan ke localStorage scoped-user (`saveLocalReports`).
- Refresh ringkasan streak lewat `buildProgressSnapshot({ user })`.

2. Modules (progres achievement modul)
- Status modul aktif/locked/completed dirender dari snapshot progress (`buildProgressSnapshot()`).
- Setelah modul/quiz selesai, `completeModuleProgress(moduleId)` menandai modul selesai dan sync ke profile.

3. Profile (visualisasi achievement + weekly)
- `renderProfile(...)` memanggil `buildProgressSnapshot({ user, profile })`.
- Trophy modul, streak mingguan, progress XP, dan title level semua memakai data snapshot yang sama.

Kesimpulan: Logic achievement dan update harian sudah terhubung melalui satu sumber kalkulasi yang sama (`buildProgressSnapshot`).

## QA Checklist (Functional)
1. Submit laporan harian baru
- Input tanggal hari ini + waktu + catatan.
- Expected:
  - Laporan tersimpan (Firestore jika login, local selalu).
  - Streak text di Home bertambah sesuai data.
  - Weekly stats di Profile ikut update.

2. Submit laporan untuk tanggal yang berbeda
- Buat laporan beberapa hari dalam minggu berjalan.
- Expected:
  - `completedDays` sesuai jumlah hari unik.
  - Progress mingguan (`x/7`) sesuai.
  - Saat mencapai 7/7, trophy weekly muncul dan report XP aktif.

3. Selesaikan modul
- Selesaikan modul via halaman guide/quiz.
- Expected:
  - Modul berubah jadi completed di Modules.
  - Trophy modul muncul di Profile.
  - XP dan level ter-update.

4. Multi-user isolation
- Login dengan akun A lalu akun B pada device yang sama.
- Expected:
  - Progress/laporan tidak bocor antar akun.
  - Storage key menggunakan scoped key per user.

5. Offline/partial failure
- Simulasikan gagal upload foto atau gagal Firestore.
- Expected:
  - Laporan tetap tersimpan lokal.
  - UI tidak crash.
  - Snapshot masih menghitung data lokal.

## Risiko/Known Gaps
1. Duplikasi laporan pada hari yang sama masih mungkin tersimpan di local sebelum proses merge/dedupe ketika dibaca ulang.
2. Trigger sync profile lebih kuat di flow modul; untuk flow laporan harian saat ini fokus ke refresh snapshot UI.
3. Validasi input tanggal masa depan belum terlihat ketat di submit handler.

## Rekomendasi Lanjutan
1. Tambah guard satu laporan per hari per user (opsional: overwrite atau reject).
2. Tambah sinkronisasi eksplisit ke `achievementProgress` setelah submit laporan agar profile cloud selalu up-to-date.
3. Tambah test script manual/regresi untuk 7-day streak, multi-user switching, dan fallback offline.
