---
title: "Monitoring Vegetasi (NDVI & VCI) — Kabupaten Pulang Pisau"
date: 2026-07-06T00:00:00+07:00
draft: false
description: "Memantau kondisi kehijauan dan indikasi stres vegetasi di lanskap gambut Pulang Pisau menggunakan citra satelit MODIS, lewat indeks NDVI dan VCI."
region: "Kabupaten Pulang Pisau, Kalimantan Tengah"
indeks: ["NDVI", "VCI"]
sumber_data: "MODIS MOD13Q1 (250m, 16-hari)"
gee_app_url: "https://my-project-2026-490505.projects.earthengine.app/view/pulangpisau-ndvi-vci"
icon: "🌿"
tags: ["Vegetasi", "Kekeringan", "Gambut", "Remote Sensing"]
---

Pulang Pisau adalah salah satu kabupaten di Kalimantan Tengah dengan hamparan **lahan gambut** yang luas — ekosistem yang secara alami basah, menyimpan karbon dalam jumlah besar, tetapi juga sangat rentan terhadap kekeringan musiman dan kebakaran. Perubahan kecil pada kondisi kelembapan vegetasi di atasnya bisa jadi sinyal awal risiko yang lebih besar.

Dashboard ini dibuat untuk membantu memantau kondisi itu dari waktu ke waktu, menggunakan data satelit yang diproses lewat Google Earth Engine.

## Kenapa Tidak Cukup Hanya Melihat "Hijau atau Tidak"

Secara visual, lahan yang tampak hijau sering diasumsikan sehat. Padahal, vegetasi yang mulai mengalami tekanan akibat kekurangan air tidak selalu langsung berubah warna — daun bisa tetap tampak hijau untuk sementara waktu meski di bawahnya kondisi kelembapan tanah sudah menurun jauh dari kondisi normalnya. Untuk menangkap perbedaan itu, dibutuhkan pendekatan yang lebih terukur daripada sekadar pengamatan mata.

## NDVI: Mengukur Tingkat Kehijauan

**NDVI (Normalized Difference Vegetation Index)** dihitung dari selisih pantulan cahaya merah dan inframerah dekat yang direkam sensor satelit — vegetasi yang sehat dan rapat memantulkan inframerah dekat jauh lebih kuat dibanding cahaya merah. Nilainya berkisar dari -1 hingga 1; semakin tinggi, semakin hijau dan rapat vegetasinya.

NDVI sangat berguna untuk melihat sebaran dan kerapatan vegetasi, tapi punya keterbatasan: ia menggambarkan kondisi *saat ini* tanpa konteks — sulit menjawab pertanyaan "apakah kehijauan ini normal untuk wilayah dan musim ini, atau justru sudah menurun dari biasanya?"

## VCI: Membandingkan dengan Kondisi Historis

**VCI (Vegetation Condition Index)** menjawab keterbatasan itu. VCI membandingkan nilai NDVI pada periode saat ini terhadap rentang nilai NDVI historis (minimum–maksimum) di lokasi dan bulan yang sama, dari data yang terekam sejak tahun 2000. Hasilnya diskalakan menjadi 0–100:

- **Mendekati 100** → kondisi vegetasi termasuk yang terbaik dalam sejarah data di periode tersebut
- **Mendekati 0** → kondisi vegetasi termasuk yang terburuk (indikasi stres atau kekeringan) dibanding riwayatnya sendiri

Dashboard ini mengklasifikasikan VCI menjadi 5 kelas:

| Rentang VCI | Kelas |
|---|---|
| 0–10 | Stres Ekstrem |
| 10–20 | Stres Berat |
| 20–35 | Stres Sedang |
| 35–50 | Stres Ringan |
| 50–100 | Kondisi Baik |

## Sumber Data: Kenapa MODIS, Bukan Sentinel-2?

Dashboard ini menggunakan citra **MODIS (produk MOD13Q1)** — resolusi spasial 250 meter per piksel, komposit setiap 16 hari, tersedia sejak tahun 2000.

Ini pilihan yang disengaja. Sentinel-2 punya resolusi jauh lebih detail (10 meter), tapi baru tersedia sejak 2015 — terlalu pendek untuk membangun *baseline* historis yang stabil secara statistik, yang justru menjadi inti perhitungan VCI. MODIS memberi rekam jejak lebih dari dua dekade, sehingga perbandingan "normal vs. tidak normal" jadi jauh lebih bisa diandalkan, meski gambarnya lebih kasar.

Konsekuensinya, dashboard ini cocok untuk membaca **pola dan tren skala lanskap/kabupaten** — bukan untuk mengidentifikasi kondisi satu bidang lahan kecil atau satu pohon secara spesifik.

## Catatan Ketersediaan Data

Citra MODIS memiliki jeda pemrosesan sekitar 1–2 bulan sebelum tersedia di Earth Engine. Kalau kamu memilih bulan yang datanya belum rilis, dashboard akan menampilkan keterangan tanpa memaksakan perhitungan — dan periode tersebut akan otomatis bisa ditampilkan begitu datanya sudah tersedia.

## Rencana Pengembangan

Dashboard ini adalah versi pertama. Beberapa kemungkinan pengembangan ke depan: perbandingan multi-tahun berdampingan, grafik tren VCI per waktu untuk titik tertentu, serta WebGIS tematik lain untuk lanskap Kalimantan (tutupan lahan, titik panas kebakaran, dan lahan gambut).

---

Buka dashboard interaktifnya di bawah untuk menjelajah sendiri kondisi vegetasi Pulang Pisau dari bulan ke bulan.
