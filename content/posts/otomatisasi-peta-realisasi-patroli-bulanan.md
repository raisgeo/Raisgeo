---
title: "Otomatisasi Peta Realisasi Patroli Bulanan"
date: 2026-08-07T07:00:00+07:00
draft: false
categories: ["Notes"]
image: "/images/covers/5ee2a2dc-6748-45ce-98bc-a3524891ab1f.png"
description: "Catatan pengembangan WebGIS untuk menghasilkan peta realisasi patroli bulanan PT BWU secara otomatis, berangkat dari pola permintaan yang berulang dan kewajiban pelaporan dalkarhutla"
---

Setiap pemegang Perizinan Berusaha Pemanfaatan Hutan (PBPH) memiliki kewajiban menjalankan kegiatan pengendalian kebakaran hutan dan lahan (dalkarhutla) sesuai dengan **Permen LHK No. P.32/MenLHK/Setjen/Kum.1/3/2016** tentang Pengendalian Kebakaran Hutan dan Lahan, dimana pemegang izin usaha wajib melakukan upaya pencegahan, salah satunya melalui patroli rutin pencegahan karhutla. Hasil kegiatan patroli ini tidak hanya menjadi arsip internal, tetapi juga menjadi lampiran wajib dalam laporan berkala yang diunggah ke sistem informasi Kementerian LHK, yaitu **Sipongi**. oleh karena itu setiap akhir bulan, seksi lain di kantor rutin meminta peta realisasi patroli kepada saya. 

Karena permintaan pembuatannya berulang setiap bulan, polanya menjadi sangat terbaca. Elemen-elemen dalam peta tidak pernah berubah: batas konsesi, posisi *basecamp*, tata letak kop, legenda, skala, arah utara, dan inset Peta Situasi semuanya statis. Yang berganti hanya informasi periode bulan dan garis rute patrolinya.

Mengerjakan hal yang sama secara manual di GIS desktop setiap bulan terasa tidak efisien. Berangkat dari pola yang konstan tersebut, saya membangun alat otomasi berbasis WebGIS agar proses pengerjaannya menjadi lebih cepat.

## Cara Kerja Alat

Aplikasi ini ditempatkan di situs ini (`raisgeo.com/webgis/peta-patroli/`) agar dapat diakses langsung oleh rekan kerja yang membutuhkan.

Secara alur penggunaan:

1. **Input Rute:** Pengguna dapat mengunggah file rekam jejak GPS (`.gpx` atau `.zip` shapefile) jika tim lapangan membawa alat navigasi. Jika tidak ada file GPS, pengguna cukup memilih nama desa atau nama rute air dari daftar yang tersedia (*Paduran Sebangau*, *Bahaur Tengah*, *Sei Talai*, *STI*, dan lainnya).
2. **Pilih Periode & Format:** Pengguna menentukan bulan dan tahun patroli, lalu memilih format keluaran (PDF atau JPG).
3. **Proses & Unduh:** Sistem menghasilkan file peta siap cetak sesuai standar tata letak perusahaan.

## Kontrol Akses dan Quality Control (QC)

Meskipun alat ini dirancang agar pengguna dapat membuat peta secara mandiri, saya menetapkan sistem keamanan berupa kata sandi yang **otomatis berganti setiap bulan**.

Hal ini sengaja saya lakukan karna saya ingin setiap kali ada tim atau seksi lain yang hendak memproduksi peta patroli, mereka tetap berkonfirmasi terlebih dahulu kepada saya untuk meminta kata sandi bulan berjalan. Dengan begitu:

* Saya tetap mengetahui kapan dan peta mana yang sedang diproduksi.
* Tetap ada fungsi *Quality Control* (QC) dari unit *planning* sebelum peta tersebut dilampirkan resmi ke dalam laporan kegiatan maupun diunggah ke Sipongi.

## Ringkasan Teknis

Situs ini dibangun menggunakan generator situs statis (Hugo) yang di-host di Cloudflare Pages. Pemrosesan geospasial dan penggambaran peta cetak ditangani oleh *backend* terpisah berbasis **FastAPI** yang berjalan di Railway.

Poin teknis sistem:

* **Stateless:** *Backend* tidak menyimpan arsip peta di database. File diproses langsung di memori (*in-memory*) dan dialirkan kembali ke pengguna sebagai file unduhan.
* **Layout Presisi:** Peta digambar menggunakan `Matplotlib` dan `GeoPandas` di Python dengan font *Times New Roman*, menjaga hasil PDF/JPG presisi mengikuti tata letak resmi perusahaan.
* **Routing Jalan & Sungai:** Rute darat dihitung otomatis menggunakan algoritma *Dijkstra shortest path* (`NetworkX`) di atas peta jaringan jalan OpenStreetMap (OSM) via Overpass API. Jalur air dicocokkan dengan data geometri rute air yang tersimpan di server.
* **Smoothing Adaptif:** Garis rute dan jaringan jalan/sungai melewati proses pembersihan (*smoothing*) yang toleransinya fleksibel mengikuti lebar cakupan peta (*scale-aware*).

---

Aplikasi ini dapat diakses langsung pada tautan berikut:

<div style="text-align: center; margin: 30px 0;">
  <a href="/webgis/peta-patroli/" style="font-size: 15px; padding: 12px 24px; background: #CC0000; color: #fff !important; border-radius: 100px; text-decoration: none; font-weight: 600; display: inline-block;">
    Buka WebGIS Peta Patroli
  </a>
</div>

***

*Aplikasi WebGIS Peta Patroli PT BWU dibangun oleh Muhammad Rais menggunakan FastAPI (Railway) dan terintegrasi dengan kustomisasi template Hugo di raisgeo.com.*