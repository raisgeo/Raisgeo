---
title: "Bot Telegram Auto Input Data ke Google Sheets"
date: 2026-08-01T07:00:00+07:00
draft: false
categories: ["Notes"]
image: "/images/covers/6d80349f-e743-4d93-8923-d0974389de17.png"
description: "Cerita di balik pembuatan bot Telegram yang tersinkron otomatis dengan Google Sheets, dibangun untuk memantau keluar-masuknya peralatan pemadam kebakaran di tengah musim karhutla — lengkap dengan latar belakang dan cara menduplikasinya."
---

Bulan ini, sudah tiga kali kejadian kebakaran hutan dan lahan terjadi di zona buffer perusahaan tempat saya bekerja. El Niño membuat musim kemarau tahun ini terasa lebih panjang dan lebih kering dari biasanya. Zona buffer sendiri adalah area di luar batas konsesi, dengan radius hingga 5 kilometer dari batas terluar — dan setiap perusahaan pemegang konsesi hutan sejatinya memang diwajibkan memastikan arealnya bebas dari kejadian kebakaran, termasuk turut menjaga radius di luar konsesinya sendiri.

Setiap kali karhutla terjadi, maka peralatan pemadam diangkut keluar dari basecamp, dibawa oleh tim Satpamhut ke lokasi kejadian, dipakai, lalu (seharusnya) dikembalikan lagi. Tiga kali kejadian dalam sebulan berarti tiga kali pula alat-alat itu berpindah tangan, berpindah lokasi, dalam kondisi yang serba cepat dan darurat. Dan di situasi seperti itu, ada satu risiko kecil yang mudah luput dari perhatian tapi bisa jadi mahal harganya: alat yang tidak tercatat kembali. Yang tertinggal di suatu tempat. Yang "hilang" bukan karena dicuri, tapi karena tidak ada yang sempat mencatat ke mana perginya.

Aset-aset ini bukan barang murah, dan yang lebih penting, mereka adalah alat yang harus siap sedia kapan saja kebakaran berikutnya terjadi. Maka pertanyaannya sederhana: bagaimana caranya memantau pergerakan alat ini tanpa membebani siapa pun dengan pekerjaan administratif tambahan, terutama di tengah situasi darurat yang serba cepat?

## Yang Saya Bangun


{{< figure src="/images/posts/1785565175251-tele.png" caption="Tampilan Bot Telegram" >}}


Jawaban yang saya buat adalah sebuah bot Telegram yang tersinkron langsung dengan Google Sheets, dibangun sepenuhnya di atas Google Apps Script (GAS) — tanpa server tambahan, tanpa biaya hosting, dan tanpa infrastruktur backend terpisah.

Dari sisi pengguna, interaksinya sengaja dibuat sesederhana mungkin. Siapa pun yang membawa alat keluar — saya, rekan kantor, atau anggota Satpamhut yang sedang bertugas di lapangan — cukup mengetik ke bot dengan bahasa sehari-hari, misalnya "Mardani bawa 2 selang ke Pos A" atau "kacamata sudah kembali dari lapangan". Tidak ada format input kaku yang harus dihafal, tidak ada form yang harus diisi satu per satu.

Tapi di balik kesederhanaan itu, ada beberapa lapisan teknis yang bekerja sama:

**Pertama, lapisan komunikasi.** Bot berjalan dalam mode *polling* terhadap Telegram Bot API — artinya, sistem secara aktif memeriksa pesan baru setiap beberapa detik lewat trigger terjadwal di Apps Script, alih-alih menunggu Telegram mendorong data masuk lewat webhook. Pilihan ini saya ambil karena lebih stabil dijalankan murni di lingkungan Apps Script tanpa perlu endpoint publik tambahan.

**Kedua, lapisan pemahaman bahasa.** Setiap kalimat bebas yang masuk diteruskan ke sebuah model bahasa (LLM) melalui Groq inference API, yang bertugas sebagai *command normalizer* — mengubah kalimat natural menjadi format perintah terstruktur yang bisa diproses sistem. Perannya dibatasi ketat: model ini hanya menerjemahkan maksud kalimat, bukan memutuskan apakah transaksinya valid atau tidak.

**Ketiga, lapisan validasi.** Hasil terjemahan dari model bahasa tidak langsung dieksekusi. Sistem terlebih dahulu memeriksa: apakah nama alat yang dimaksud memang ada di database, apakah stoknya mencukupi untuk dikeluarkan, apakah catatan peminjamannya cocok saat alat dilaporkan kembali. Prinsip ini penting — model bahasa tidak pernah diberi wewenang menulis langsung ke sumber data, ia hanya menghasilkan usulan yang tetap harus lolos pemeriksaan logika bisnis yang sama seperti input manual.

**Keempat, lapisan penyimpanan.** Sebaran lokasi setiap alat — sedang berada di mana, dipegang siapa, sejak kapan — dihitung secara *live* dari agregasi log transaksi, tanpa memerlukan sheet atau tabel tambahan untuk menyimpan status. Setiap transaksi baru cukup ditambahkan sebagai satu baris log, dan sistem menghitung ulang posisi terkini dari riwayat itu setiap kali dibutuhkan. Google Sheets berperan sebagai *single source of truth* — satu-satunya sumber data yang selalu mencerminkan kondisi terkini.

Hasil akhirnya: begitu seseorang selesai mengetik satu kalimat di Telegram, dalam hitungan detik data itu sudah tercatat rapi di spreadsheet, lengkap dengan siapa yang membawa, ke mana, berapa jumlahnya, dan kapan. Siapa pun yang punya akses ke sheet itu bisa langsung tahu: alat apa saja yang tersedia di basecamp sekarang, alat apa yang sedang berada di lapangan, dan siapa yang sedang memegangnya — tanpa perlu bertanya ke siapa pun, tanpa perlu menunggu rekap manual.

## Kenapa Baru Sekarang

Sebenarnya, ide untuk membuat sesuatu seperti ini sudah lama ada di kepala saya — jauh sebelum saya bekerja di perusahaan yang sekarang.

Di tempat kerja saya sebelumnya, saya sering memperhatikan satu pola yang menurut saya tidak efisien. Laporan hasil kegiatan harian dari lapangan dikirim dalam dua bentuk sekaligus: Excel dan chat WhatsApp. Kalau memang sudah ada Excel yang nantinya diolah oleh tim data analis dan disajikan ke pimpinan, seharusnya itu sudah cukup. Tapi pada praktiknya, tim lapangan juga diwajibkan mengirim laporan lewat WA dengan format tertentu yang cukup panjang — dan seringkali dalam satu hari, satu orang bisa mengirim sampai empat laporan berbeda lewat chat.

Saya melihat sendiri betapa repotnya proses itu. Mengetik laporan panjang lewat chat, berkali-kali, untuk hal yang sebenarnya sudah tercatat juga di Excel. Dan yang lebih menyayat, laporan-laporan itu belum tentu semuanya dibaca. Kadang hanya satu dari empat yang benar-benar diperhatikan pimpinan, sisanya menumpuk begitu saja di WA grup, seperti pesan yang mengambang tanpa tujuan jelas. Sementara yang benar-benar direkap dan dipakai untuk pengambilan keputusan tetap saja laporan Excel-nya.

Waktu itu saya berpikir: kenapa tidak digabung saja? Kenapa laporan yang diketik lewat chat tidak bisa langsung masuk ke Excel, sehingga tim lapangan cukup bekerja sekali, bukan dua kali?

Saya sempat memikirkan konsepnya, tapi tidak pernah benar-benar bisa merealisasikannya di sana. Lingkungan kerja saat itu tidak banyak memberi ruang untuk bereksperimen di luar rutinitas — dan rutinitas harian itu sendiri sudah cukup menyita waktu dan energi untuk sekadar berpikir "bagaimana kalau saya coba bikin sesuatu yang lebih baik". Idenya tertinggal, tersimpan, tanpa pernah jadi apa-apa.

Baru di tempat kerja saya yang sekarang, dengan ruang yang lebih terbuka untuk berkreasi, ide lama itu akhirnya bisa saya wujudkan — meski dalam bentuk dan konteks yang berbeda dari yang saya bayangkan dulu. Bukan lagi soal laporan kegiatan harian, tapi soal monitoring aset pemadam kebakaran. Prinsipnya tetap sama: kerja cerdas, bukan kerja dua kali. Data cukup diketik sekali, di mana pun orangnya berada — di rumah, di lapangan, di mana saja — dan langsung tercatat dengan sendirinya.

## Kalau Anda Ingin Membuat yang Serupa

Setelah bot ini berjalan dan terbukti membantu, saya menuliskan seluruh prosesnya menjadi tutorial yang bisa diikuti langkah demi langkah — mulai dari membuat bot di Telegram, menyiapkan struktur Google Sheets, sampai script Google Apps Script yang siap dipakai.

Ada dua versi yang saya siapkan. Versi pertama persis seperti yang saya jelaskan di atas — dirancang khusus untuk kebutuhan monitoring keluar-masuk aset atau peralatan. Versi kedua sifatnya lebih umum: bisa dipakai untuk struktur tabel apa pun, entah itu laporan kegiatan harian, pencatatan pengeluaran, data survei lapangan, atau kebutuhan lain yang serupa dengan yang dulu pernah saya pikirkan tapi tidak sempat saya buat.

Tutorial ini tersedia dalam format PDF dan markdown, lengkap dengan script yang bisa langsung disalin-tempel — tinggal disesuaikan dengan struktur data masing-masing.

Download Tutorial : http://lynk.id/rais.id/r8pw988nywe7