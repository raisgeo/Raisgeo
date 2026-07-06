---
title: "Zona Rawan Konflik Manusia-Orangutan — Taman Nasional Sebangau dan sekitarnya"
date: 2026-07-06T00:00:00+07:00
draft: false
description: "Analisis spasial zona rawan konflik manusia-orangutan mencakup Taman Nasional Sebangau, Kabupaten Pulang Pisau, dan sekitarnya — menggabungkan data sebaran orangutan (GBIF), titik panas kebakaran, dan aksesibilitas manusia, dengan sistem tagging wilayah agar statistik tiap kawasan tetap akurat."
region: "Taman Nasional Sebangau, Kalimantan Tengah"
indeks: ["Buffer Analysis", "Spatial Overlay", "Grid Analysis"]
sumber_data: "GBIF, FIRMS/MODIS, ESA WorldCover, GRIP4, WDPA"
gee_app_url: "https://my-project-2026-490505.projects.earthengine.app/view/sebangau-konflik-orangutan"
icon: "🦧"
tags: ["Orangutan", "Konservasi", "TN Sebangau", "Konflik Satwa-Manusia"]
---

Taman Nasional Sebangau adalah salah satu benteng terakhir Orangutan Kalimantan (*Pongo pygmaeus*) — spesies berstatus **Sangat Terancam Punah** menurut IUCN, dengan populasi di kawasan ini diperkirakan lebih dari 6.000 individu. Yang menarik: 38% wilayah taman nasional ini ternyata masuk **Kabupaten Pulang Pisau** — kabupaten yang sama dengan dua WebGIS sebelumnya di situs ini.

**Perlu ditegaskan sejak awal:** dashboard ini mencakup TN Sebangau **DAN** seluruh Kabupaten Pulang Pisau **DAN** wilayah sekitarnya — bukan cuma taman nasionalnya saja. Supaya cakupan yang lebih luas ini tidak membuat statistik tercampur, **setiap titik orangutan dan setiap grid ditandai (tagging) kategori wilayahnya**: "TN Sebangau saja", "Pulang Pisau saja", "irisan keduanya", atau "luar keduanya (konteks regional)". Jadi kalau bicara "di Pulang Pisau", angkanya benar-benar hanya dari titik yang memang berada di dalam batas administratif Pulang Pisau — tidak tercampur data dari kabupaten tetangga atau dari dalam taman nasional yang kebetulan di luar Pulang Pisau.

Habitat gambut yang luas ini menghadapi tekanan yang terus meningkat: ekspansi permukiman, pembukaan lahan, dan pembangunan jalan di sekitar kawasan. Tekanan ini memicu fragmentasi habitat dan meningkatkan potensi konflik antara manusia dan orangutan — dua isu yang sebenarnya saling berkaitan dengan tema WebGIS sebelumnya (kekeringan dan karhutla), karena kebakaran di sekitar kawasan konservasi turut mendorong orangutan keluar mencari habitat baru, mendekati permukiman.

Membangun dashboard ini sempat terhambat beberapa kendala teknis: pencarian batas kawasan dari database global yang sesekali tidak menemukan hasil, data koordinat titik orangutan yang berantakan setelah sempat dibuka di aplikasi spreadsheet, serta nama kolom pada sumber data yang ternyata sudah berubah dari versi sebelumnya. Semuanya sudah diperbaiki lewat verifikasi bertahap — batas kawasan disimpan sebagai referensi tetap agar tidak perlu dicari ulang, data koordinat dikoreksi manual, dan nama kolom disesuaikan dengan skema terbaru.

## Pendekatan: Overlay & Grid Analysis, Bukan Machine Learning

Dashboard ini terinspirasi dari metodologi analisis spasial standar (buffer analysis, spatial overlay, grid analysis) yang umum dipakai dalam kajian konservasi — berbeda dari WebGIS Kerawanan Karhutla sebelumnya yang memakai Random Forest.

Alasannya sederhana: **Random Forest butuh banyak data untuk belajar pola yang andal.** Data titik panas untuk model karhutla tersedia ribuan titik selama 25 tahun. Data sebaran orangutan jauh lebih terbatas — beberapa puluh hingga ratusan titik observasi. Memaksakan machine learning pada data sesedikit itu berisiko menghasilkan model yang terlihat meyakinkan tapi sebenarnya tidak reliabel (*overfitting*). Untuk kasus seperti ini, pendekatan overlay dan skoring yang transparan justru lebih jujur dan lebih mudah diaudit.

## Tiga Tahap Analisis

1. **Buffer Analysis** — dibuat zona 2 km dari batas Taman Nasional Sebangau. Zona ini merepresentasikan area transisi tempat interaksi manusia-orangutan paling sering terjadi. Setiap titik observasi orangutan diklasifikasikan **Zona Rawan** (≤2 km dari batas) atau **Zona Aman** (>2 km).
2. **Spatial Overlay** — titik panas kebakaran historis (FIRMS) dan jarak ke jalan/akses manusia digabungkan sebagai indikator tekanan antropogenik di setiap lokasi.
3. **Grid Analysis** — wilayah kajian dibagi jadi grid 10×10 km (disesuaikan dari rencana awal 5×5 km karena cakupan wilayah bertambah luas ke seluruh Kab. Pulang Pisau, bukan cuma TN Sebangau). Setiap grid dihitung: kerapatan titik panas, kedekatan ke akses manusia, dan jumlah orangutan yang terekam di dalamnya — lalu digabungkan jadi skor risiko 0–1, diklasifikasi 5 kelas.

Penting dicatat: jumlah orangutan per grid **tidak dimasukkan ke dalam skor risiko** — sengaja dipisahkan sebagai layer independen, supaya bisa dipakai untuk **validasi**: apakah area yang skor risikonya tinggi memang benar-benar berimpit dengan tempat orangutan sering ditemukan? Kalau iya, itu memperkuat kepercayaan pada model; kalau tidak, itu sinyal untuk meninjau ulang asumsi variabelnya.

## Kenapa Data GBIF, Bukan Data Survei Lapangan

Analisis spasial serupa yang jadi rujukan awal ide ini menggunakan data survei lapangan sebagai contoh. Dashboard ini sengaja memakai pendekatan berbeda: data sebaran orangutan dari **GBIF (Global Biodiversity Information Facility)** — basis data keanekaragaman hayati global yang mengumpulkan catatan observasi ilmiah terverifikasi dari peneliti, lembaga konservasi, dan program *citizen science* di seluruh dunia.

Konsekuensinya jujur harus disebutkan: data GBIF juga punya keterbatasan sampling (tergantung di mana peneliti pernah melakukan observasi, bukan sensus penuh seluruh kawasan) — tapi setidaknya ini data observasi nyata yang bisa diverifikasi sumbernya, bukan data ilustratif.

## Hasil: Apa yang Ditemukan

Dari 63 titik observasi GBIF di sekitar wilayah kajian, **48 titik** berada di dalam area studi (TN Sebangau + Pulang Pisau + sekitarnya). Rinciannya per kategori wilayah:

| Kategori | Jumlah Titik |
|---|---|
| TN Sebangau & Pulang Pisau (irisan) | 6 |
| TN Sebangau saja (di luar Pulang Pisau) | 12 |
| Pulang Pisau saja (di luar TN Sebangau) | 4 |
| Luar keduanya (konteks regional) | 26 |

Artinya: **10 titik** (6+4) berada di dalam wilayah administratif Pulang Pisau, dan **18 titik** (12+6) berada di dalam TN Sebangau. Dari 18 titik di TN Sebangau, **seluruhnya (18)** berada dalam Zona Rawan (≤2 km dari batas taman nasional) — indikasi bahwa observasi orangutan yang tercatat GBIF cenderung terjadi di area dekat tepi kawasan, bukan di bagian dalam yang lebih terpencil (kemungkinan besar bias sampling — area tepi lebih mudah diakses peneliti/wisatawan, bukan berarti orangutan memang lebih banyak di situ).

**Korelasi jumlah orangutan vs kerapatan titik panas per grid: -0,05 (p=0,35)** — secara statistik **tidak signifikan** (jauh di atas ambang 0,05). Dengan kata lain, dari data yang tersedia, tidak ditemukan bukti kuat bahwa grid dengan lebih banyak titik panas historis juga punya lebih banyak/lebih sedikit observasi orangutan. Ini kemungkinan besar karena jumlah data GBIF yang tersedia (48 titik) masih terlalu sedikit untuk mendeteksi pola statistik yang solid — bukan berarti tidak ada hubungan sama sekali di lapangan.

## Sistem Tagging Wilayah

Dashboard punya layer khusus **"Kategori Wilayah"** yang menampilkan langsung 4 kategori di atas dalam bentuk peta warna — berguna untuk memahami dari mana asal setiap angka statistik, dan untuk transparansi: pembaca bisa memverifikasi sendiri klaim "di Pulang Pisau" itu benar-benar merujuk ke titik/grid yang secara geografis ada di dalam batas Pulang Pisau, bukan istilah yang dipakai longgar.

## Sumber Data

| Variabel | Sumber | Catatan |
|---|---|---|
| Batas kawasan TN Sebangau | WDPA (World Database on Protected Areas) | Diakses langsung dari katalog Google Earth Engine |
| Batas administratif Pulang Pisau | FAO GAUL 2015 | Sama dengan WebGIS #1 & #2 |
| Sebaran orangutan | GBIF, *Pongo pygmaeus* | Data occurrence ilmiah publik |
| Titik panas kebakaran | FIRMS (MODIS), sejak 2001 | Sama dengan WebGIS Kerawanan Karhutla |
| Tutupan lahan | ESA WorldCover v200 | |
| Jaringan jalan | GRIP4 Global Roads | Proksi aksesibilitas/tekanan manusia |

## Keterbatasan

- Sampling data GBIF tidak merata secara spasial — mengikuti lokasi yang pernah disurvei peneliti, bukan sensus penuh kawasan (bias ke area tepi/mudah diakses terlihat dari 18/18 titik TNS yang semuanya di Zona Rawan)
- Jumlah data (48 titik dalam area kajian) masih terlalu sedikit untuk kesimpulan statistik yang kuat — korelasi orangutan vs titik panas tidak signifikan, kemungkinan besar karena keterbatasan jumlah data, bukan berarti tidak ada hubungan di lapangan
- Skor risiko adalah kombinasi overlay yang transparan, bukan model prediktif tervalidasi seperti WebGIS Kerawanan Karhutla
- Buffer 2 km adalah asumsi umum zona transisi, bukan angka yang divalidasi khusus untuk perilaku orangutan di Sebangau
- Grid dibuat 10×10 km (bukan 5×5 km seperti rencana awal) karena cakupan wilayah yang luas — cocok dibaca sebagai pola tingkat lanskap/kabupaten, bukan lokasi presisi per individu orangutan

## Rencana Pengembangan

Ke depan, dashboard ini bisa diperkaya dengan data resmi Balai TN Sebangau (kalau tersedia dan diizinkan dipublikasikan), dibandingkan dengan data GBIF untuk validasi silang, serta diperluas untuk memasukkan variabel kedalaman gambut sebagai indikator kualitas habitat — melengkapi apa yang sudah dibangun di WebGIS Kerawanan Karhutla.

---

Buka dashboard interaktifnya di bawah untuk menjelajah zona risiko dan sebaran titik orangutan.
