---
title: "Peta Kerawanan Kebakaran Hutan & Lahan — Kabupaten Pulang Pisau"
date: 2026-07-06T00:00:00+07:00
draft: false
description: "Model spasial berbasis Random Forest (akurasi 92,8%) untuk memetakan kerawanan karhutla di lanskap gambut Kabupaten Pulang Pisau, dilengkapi indeks kekeringan musiman SDCI untuk pemantauan bulanan."
region: "Kabupaten Pulang Pisau, Kalimantan Tengah"
indeks: ["Fire Susceptibility", "Random Forest", "SDCI"]
sumber_data: "FIRMS/MODIS, ESA WorldCover, SoilGrids, CHIRPS, MOD11A2 LST, SRTM"
gee_app_url: "https://my-project-2026-490505.projects.earthengine.app/view/pulangpisau-kerawanan-karhutla"
icon: "🔥"
tags: ["Karhutla", "Gambut", "Machine Learning", "Remote Sensing"]
---

Awal Juni 2026 saya menghadiri Sosialisasi Pencegahan dan Pengendalian Karhutla Kabupaten Pulang Pisau, di mana BMKG memaparkan proyeksi kemarau 2026 yang datang lebih awal, lebih kering, dan lebih panjang dari biasanya — dengan bayang-bayang El Niño yang mulai menguat. Forum itu menegaskan satu hal: kesiapsiagaan karhutla tidak bisa menunggu api benar-benar muncul. Ia harus dimulai dari tahu **di mana** risiko itu paling tinggi, jauh sebelum musim kemarau puncak tiba.

Dashboard ini adalah upaya menjawab pertanyaan itu secara spasial: bagian mana dari Kabupaten Pulang Pisau yang, berdasarkan pola dua dekade terakhir, paling rawan terbakar?

## Kenapa Bukan Sekadar Peta Titik Panas

Peta titik panas (hotspot) menunjukkan **di mana api pernah terjadi**. Itu penting, tapi terbatas — ia menunjukkan masa lalu, bukan potensi ke depan, dan tidak menjelaskan **kenapa** suatu lokasi rawan sementara lokasi lain di sebelahnya relatif aman padahal tampak serupa di citra.

Untuk itu dibutuhkan pendekatan yang lebih menyeluruh: *fire susceptibility mapping* — memodelkan kerawanan kebakaran sebagai fungsi dari kondisi lanskap di sekitarnya, dilatih dari pola kejadian historis. Pendekatan ini umum dipakai dalam kajian ilmiah kerawanan bencana (kebakaran, longsor, banjir) karena hasilnya bisa diuji akurasinya secara kuantitatif, bukan sekadar tumpang-susun visual.

## Kerangka Berpikir: Segitiga Api

Secara teori, kebakaran membutuhkan tiga unsur sekaligus — **bahan bakar** (vegetasi, gambut kering), **sumber panas/ignisi** (umumnya aktivitas manusia di Kalimantan), dan **kondisi yang mendukung pembakaran** (cuaca kering, kelembapan rendah). Ketiga unsur inilah yang menjadi dasar pemilihan variabel dalam model:

| Unsur Segitiga Api | Variabel yang Dipakai |
|---|---|
| Bahan bakar | Tutupan lahan, cadangan karbon organik tanah (proksi gambut) |
| Sumber ignisi (aktivitas manusia) | Jarak ke jalan, jarak ke permukiman |
| Kondisi mendukung pembakaran | Curah hujan musim kemarau, NDVI musim kemarau (indikator kekeringan vegetasi) |
| Faktor pendukung lain | Elevasi, kemiringan lereng (memengaruhi drainase & aksesibilitas) |

## Metode: Random Forest, Bukan Skor Overlay Manual

Banyak peta kerawanan dibuat dengan cara memberi bobot subjektif ke tiap variabel lalu menjumlahkannya (*weighted overlay*). Dashboard ini memakai pendekatan yang berbeda: **Random Forest**, sebuah algoritma pembelajaran mesin yang mempelajari pola hubungan antara kondisi lanskap dan kejadian kebakaran langsung dari data historis, tanpa perlu menebak bobot masing-masing variabel secara manual.

Prosesnya secara garis besar:

1. **Label**: seluruh riwayat titik panas FIRMS (satelit MODIS) di Kabupaten Pulang Pisau sejak tahun 2001 dijadikan peta biner "pernah terbakar" vs "tidak pernah terbakar terdeteksi"
2. **Sampel**: diambil titik-titik representatif dari kedua kelas tersebut, dipisah menjadi data latih (70%) dan data uji (30%)
3. **Pelatihan**: model Random Forest dilatih memakai data latih dan 9 variabel lanskap di atas
4. **Validasi**: akurasi model diuji memakai data uji yang *tidak* dilihat model saat pelatihan — hasilnya **akurasi 92,8%** dengan **Kappa 0,86** (nilai ini juga ditampilkan langsung di panel "Tentang Data & Metode" pada dashboard, bukan diklaim tanpa bukti)
5. **Prediksi**: model diterapkan ke seluruh wilayah kabupaten, menghasilkan peta probabilitas kerawanan 0–1, lalu diklasifikasi menjadi 5 kelas (Sangat Rendah hingga Sangat Tinggi) berbasis kuantil

Secara teknis, tahap pelatihan & baseline historis di atas dijalankan sekali secara terpisah (bukan setiap kali dashboard dibuka), lalu hasilnya disimpan sebagai data siap-pakai yang dibaca dashboard secara langsung. Ini murni pertimbangan performa — supaya dashboard tetap ringan dan cepat diakses publik — bukan bagian dari validitas ilmiah metodenya.

## Melengkapi Model Struktural dengan Kondisi Berjalan: SDCI

Model Random Forest di atas menjawab pertanyaan "di mana yang secara historis paling rawan" — tapi ia bersifat statis, tidak berubah sepanjang tahun. Padahal tingkat kekeringan aktual bergerak naik-turun mengikuti musim, dan itulah yang menentukan seberapa mendesak kewaspadaan di suatu bulan tertentu.

Untuk itu, dashboard ini melengkapi peta struktural dengan indeks kekeringan dinamis: **SDCI (Scaled Drought Condition Index)**, mengikuti metode Rhee, Im, dan Carbone (2010) yang mengombinasikan tiga sinyal satelit sekaligus:

> **SDCI = 0,25 × TCI + 0,5 × PCI + 0,25 × VCI**

- **TCI (Temperature Condition Index)** — dari suhu permukaan tanah (MODIS LST); makin panas dari kondisi historis bulan yang sama, makin rendah nilainya
- **PCI (Precipitation Condition Index)** — dari curah hujan (CHIRPS); makin kering dari historis, makin rendah nilainya, dan diberi bobot terbesar (50%) karena curah hujan adalah pemicu paling langsung
- **VCI (Vegetation Condition Index)** — dari kehijauan vegetasi (NDVI), prinsipnya sama seperti VCI di dashboard NDVI/VCI Pulang Pisau sebelumnya

Nilai SDCI berkisar 0–1, diklasifikasikan menjadi 6 kategori dari "Tidak Ada Kekeringan" hingga "Sangat Parah (D4)". Karena SDCI dihitung per bulan dan bisa dipilih tahun & bulannya, dashboard ini bisa dipakai sebagai **alat pemantauan musiman**, bukan cuma peta sekali-jadi.

Konteks kenapa fitur ini penting *sekarang*: proyeksi NOAA CPC (per rilis Mei 2026) menunjukkan probabilitas tinggi munculnya El Niño kuat pada Agustus–Oktober 2026, memuncak di akhir tahun — beberapa pihak menjulukinya potensi "Godzilla El Niño", merujuk pada istilah yang pertama kali dipakai klimatolog NASA Bill Patzert tahun 2015 untuk kejadian El Niño terkuat sejak 1950. Ini konsisten dengan pemaparan BMKG di sosialisasi karhutla Pulang Pisau Juni 2026 yang sudah disinggung di awal artikel ini. Dengan layer SDCI, perkembangan kekeringan musim kemarau 2026 di Pulang Pisau bisa dipantau bulan demi bulan begitu datanya tersedia.

Catatan praktis: pilihan Tahun & Bulan di dashboard sengaja dibatasi tidak bisa memilih 1-2 bulan paling akhir dari hari ini diakses — ini bukan pembatasan sembarangan, tapi menyesuaikan jeda pemrosesan data satelit (suhu permukaan & vegetasi biasanya baru "matang" datanya beberapa minggu setelah perekaman).

## Risiko Gabungan: Struktural x Kondisi Berjalan

Peta kerawanan struktural menunjukkan kerentanan jangka panjang suatu lokasi. Peta SDCI menunjukkan seberapa kering kondisi saat ini. Dashboard ini menggabungkan keduanya menjadi satu layer tambahan:

> **Risiko Saat Ini = Probabilitas Kerawanan Struktural × (1 − SDCI)**

Logikanya sederhana: lokasi yang secara struktural rawan *dan* sedang mengalami kekeringan parah bulan ini adalah yang paling perlu diwaspadai *sekarang*; lokasi yang struktural rawan tapi kondisinya sedang basah, risikonya untuk saat ini lebih rendah. Ini adalah heuristik operasional untuk membantu prioritisasi kewaspadaan musiman — **bukan model yang divalidasi secara terpisah** seperti model struktural di atas, jadi sebaiknya dibaca sebagai alat bantu komunikasi risiko, bukan angka probabilitas yang presisi.

Catatan tampilan: layer ini punya legenda sendiri ("Tingkat Risiko Gabungan", 5 kelas) — meski skema warnanya sama dengan Kelas Kerawanan struktural, angkanya sudah dihitung ulang khusus untuk kombinasi ini, jadi jangan disamakan langsung dengan kelas kerawanan struktural murni.

## Kenapa Fokus ke Lanskap Gambut

Pulang Pisau memiliki hamparan gambut yang luas. Gambut yang terdrainase (misalnya oleh kanal atau saluran) kehilangan kelembapan alaminya dan menjadi sangat mudah terbakar — bahkan bisa membara di bawah permukaan tanpa terlihat jelas dari atas (*smoldering fire*), jauh lebih sulit dipadamkan dibanding kebakaran vegetasi biasa. Karena itu, variabel cadangan karbon organik tanah dimasukkan sebagai proksi keberadaan gambut, dan jarak ke sungai/kanal dimasukkan karena berkaitan erat dengan pola drainase gambut di sekitarnya.

## Sumber Data

| Variabel | Sumber | Resolusi |
|---|---|---|
| Riwayat titik panas | FIRMS (MODIS), sejak 2001 | ~1 km |
| Tutupan lahan | ESA WorldCover v200 (2021) | 10 m |
| Karbon organik tanah | ISRIC SoilGrids | 250 m |
| Curah hujan | CHIRPS (klimatologi musim kemarau) | ~5 km |
| Vegetasi/NDVI | MODIS MOD13Q1 (klimatologi musim kemarau + bulanan untuk SDCI) | 250 m |
| Suhu permukaan (untuk SDCI) | MODIS MOD11A2 (8-harian) | 1 km |
| Air permukaan | JRC Global Surface Water | 30 m |
| Jaringan jalan | GRIP4 Global Roads | vektor |
| Elevasi & lereng | SRTM | 30 m |

*Metode SDCI mengacu pada Rhee, J., Im, J., & Carbone, G. J. (2010), "Monitoring agricultural drought for arid and humid regions using multi-sensor remote sensing data", Remote Sensing of Environment.*

Karena data titik panas FIRMS beresolusi asli ~1 km, seluruh analisis bekerja pada skala tersebut — konsisten dengan prinsip yang sama dipakai di dashboard NDVI/VCI: peta ini cocok dibaca sebagai **pola tingkat lanskap/kabupaten**, bukan untuk memastikan kondisi satu bidang lahan spesifik.

## Cara Membaca Peta

Dashboard punya 6 pilihan layer di menu dropdown, masing-masing dengan legenda sendiri yang otomatis menyesuaikan. Bisa dikelompokkan jadi 3 kategori:

**Kerawanan struktural (statis, jawab "di mana"):**
- **Kelas Kerawanan (5 kelas)** — tampilan utama, hijau (Sangat Rendah) hingga merah (Sangat Tinggi). Paling cocok dibaca cepat.
- **Probabilitas Kerawanan (kontinu)** — angka mentah 0–1 di balik 5 kelas tadi, untuk yang butuh detail lebih presisi.

**Data pendukung/diagnostik (bahan mentah, bukan hasil model):**
- **Frekuensi Titik Panas Historis** — berapa kali suatu titik terdeteksi panas sejak 2001. Salah satu bahan pembentuk model struktural, ditampilkan terpisah supaya bisa dibandingkan langsung dengan hasil model.
- **Tutupan Lahan** — jenis lahan (hutan, semak/lahan terbuka, gambut, kebun, permukiman, dst) dari ESA WorldCover. Membantu memahami *kenapa* suatu area diklasifikasikan rawan — area rawan tinggi di Pulang Pisau umumnya berimpit dengan tutupan semak/lahan terbuka bekas gambut.

**Kondisi berjalan (dinamis, jawab "kapan harus waspada", bisa pilih Tahun & Bulan):**
- **SDCI - Kondisi Kekeringan Berjalan** — seberapa kering bulan yang dipilih dibanding riwayat historisnya.
- **Risiko Gabungan (Struktural x Kekeringan Berjalan)** — kombinasi kerawanan struktural dengan kondisi kekeringan bulan yang dipilih; ini yang paling cocok dibaca sebagai "peringatan dini musiman".

Bagi yang membutuhkan data mentahnya untuk analisis lebih lanjut (GIS desktop, penelitian, atau pelaporan), tersedia tombol unduh GeoTIFF untuk layer kerawanan struktural langsung dari dashboard.

## Keterbatasan

- Model bersifat statistik berdasarkan pola historis — bukan prediksi cuaca atau ramalan kejadian pasti
- Resolusi kerja ~1 km mengikuti keterbatasan resolusi native data titik panas
- Tutupan lahan yang dipakai adalah citra tahun 2021 (snapshot), belum mencerminkan perubahan lahan terbaru
- Variabel jarak ke jalan memakai data global (GRIP4) yang mungkin tidak menangkap seluruh jalan akses/kanal lokal skala kecil
- SDCI menggunakan data satelit yang punya jeda rilis (LST ~8 hari, NDVI ~16 hari) — bulan terbaru mungkin belum sepenuhnya tersedia saat diakses
- Layer Risiko Gabungan adalah heuristik operasional (perkalian dua skor), bukan model prediktif yang divalidasi secara independen

## Rencana Pengembangan

Beberapa arah lanjutan yang mungkin: memperluas cakupan ke kabupaten tetangga di Kalimantan Tengah, menambah variabel kedalaman gambut yang lebih presisi bila tersedia data lokal (mis. dari Badan Restorasi Gambut), serta memvalidasi ambang batas Risiko Gabungan terhadap kejadian karhutla aktual musim kemarau 2026 begitu datanya tersedia — terutama relevan mengingat proyeksi El Niño kuat ("Godzilla El Niño") pada paruh kedua 2026.

---

Buka dashboard interaktifnya di bawah untuk menjelajah peta kerawanan dan mengunduh datanya.
