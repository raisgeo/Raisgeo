---
title: "GIS Story #1: Roger Tomlinson, The Father of GIS"
date: 2020-07-14T07:00:00+07:00
draft: false
categories: ["Insight"]
image: "{{< figure src="/images/posts/1783250576038-gis-story-1-cover.png" >}}"
description: "Kisah Roger Tomlinson, bapak GIS dunia, dan bagaimana proyek pemetaan hutan di Kenya tahun 1962 melahirkan sistem informasi geografis modern."
---

Roger Tomlinson adalah seorang ahli Geografi yang diakui sebagai bapak komputerisasi SIG atau "The Father of GIS". Dia juga dikenal sebagai orang pertama yang menciptakan frasa "Geographic Information System" lewat publikasi makalahnya yang berjudul "A Geographic Information System for Regional Planning" pada simposium CSIRO tahun 1968 [1]. Tetapi jauh sebelumnya, pada tahun 1962 merupakan awal dari proyek pemetaan yang memanfaatkan analisis GIS dengan pendekatan komputerisasi pertama yang dilakukan oleh The Canada Land Inventory (CLI).

**Ide yang sempat ditolak**

Industri GIS terus mengalami pertumbuhan setiap tahunnya. Laporan P&S Market Research pada bulan Mei 2017 menyebutkan industri ini mengalami pertumbuhan tahunan gabungan sebesar 10,1% [2]. GIS merupakan industri global yang bernilai lebih dari $270 miliar dolar per tahun [3], lebih dari ratusan ribu tenaga profesional GIS bekerja di seluruh dunia [4]. Hal ini tentu tidak lepas dari kontribusi seorang Roger Tomlinson sebagai pencetus ide mengenai komputerisasi GIS, walaupun ia mengakui bahwa ide tersebut tidak sepenuhnya baru, sebab pada tahun 1870 Presiden Royal Geographical Society telah menemukan cara mendigitasi garis dan dapat mengirimkannya melalui telegraf. Tetapi kontribusi Roger adalah gagasan mengenai *overlay* beberapa *layer* peta secara komputerisasi dan menghubungkannya dengan data statistik — itulah konsep yang baru. Pada awalnya konsep ini sempat ditolak oleh beberapa perusahaan komputer karena dianggap tidak *marketable*. Ia mengungkapkan upayanya untuk mengenalkan konsep ini ibarat pekerjaan seorang misionaris — belum ada yang mengerti, dan ia benar-benar merasa kesepian.

> "The early days of GIS were very lonely. No-one knew what it meant. My work has certainly been missionary work of the hardest kind." — Roger Tomlinson

**Proyek Pembangunan Pabrik Kertas di Kenya**

Pada tahun 1959 ia dikirim ke Afrika, tepatnya negara Kenya, dalam program bantuan internasional oleh pemerintah Kanada sebagai perwakilan dari Spartan Air Service, sebuah perusahaan survei udara berbasis Ottawa tempat ia mengawali karir profesionalnya. Di sana ia bekerja sebagai manajer divisi pemetaan komputer untuk melakukan interpretasi foto, sekaligus menjalani studi master di McGill University bidang Geografi.

Dalam program pemerintah Kanada tersebut, perusahaannya diminta melakukan foto udara dan inventarisasi hutan di Kenya untuk menentukan lokasi terbaik pembangunan pabrik kertas. Tetapi rupanya pohon-pohon di sana tidak cocok untuk membuat bubur kertas, sehingga pemerintah perlu menanam bibit pohon baru. Tugas baru mereka adalah menentukan lokasi yang tepat untuk menanam bibit pohon itu — untuk itulah diperlukan sejumlah informasi geografis guna membantu analisis penentuan lokasi. Data yang mereka kumpulkan meliputi:

- Peta jenis tanah — untuk menganalisis tingkat kesuburan tanah yang cocok dengan bibit pohon
- Peta topografi/kemiringan lereng — untuk mengidentifikasi lokasi yang tidak memiliki kecuraman tinggi yang dapat menghambat aktivitas panen
- Peta populasi/permukiman — beberapa suku lokal sering bermigrasi, sehingga dibutuhkan informasi lokasi dengan populasi stabil agar dapat diserap menjadi tenaga kerja perkebunan
- Peta rute migrasi gajah — agar tanaman pohon tidak terinjak kawanan gajah
- Peta identifikasi habitat monyet — monyet dapat mengancam perkebunan karena memakan pohon muda
- Peta curah hujan — curah hujan rendah memicu kekeringan, sedangkan curah hujan terlalu tinggi mendorong populasi serangga dan lumut yang merusak pohon
- Serta peta rute transportasi, sungai, dan jembatan

Kenya merupakan koloni Inggris, sehingga beberapa informasi geografis di atas telah dipetakan oleh ilmuwan Inggris sebelumnya. Tugas mereka selanjutnya adalah melakukan analisis melalui *overlay* beberapa layer peta tersebut secara konvensional. Pekerjaan manual itu sangat melelahkan, ditambah biaya operasional yang lebih mahal daripada biaya penerbangan ke Kenya — inilah yang membuat Roger diminta menemukan cara memotong anggaran. Dari sinilah ide otomatisasi analisis GIS dengan pendekatan komputer berawal. Namun ketika ia menawarkan konsep ini ke berbagai perusahaan komputer, selalu ditolak — hingga sebuah peristiwa kebetulan mengawali kiprahnya dalam dunia GIS modern.

**Pertemuan yang tidak disengaja**

Berawal dari pertemuan tidak sengaja dengan seorang pegawai negeri bernama Lee Pratt, yang kebetulan duduk di sebelahnya dalam sebuah penerbangan pada tahun 1962. Lee Pratt baru saja ditunjuk sebagai kepala inventarisasi tanah Kanada, yang ditugaskan membuat peta wilayah produktif komersial seluas satu juta mil persegi untuk mengelola lahan pertanian, hutan, margasatwa, dan rekreasi. Proyek tersebut diperkirakan membutuhkan 563 teknisi kartografi selama tiga tahun dengan biaya sekitar $8 juta (Kanada) — padahal pemerintah Kanada hanya memiliki 50 hingga 60 teknisi yang memenuhi syarat.

Di situlah Roger mengusulkan konsep otomatisasi komputer dalam GIS sebagai solusi untuk inventarisasi penggunaan lahan dan proses analisis. Mereka memperkirakan bila ide Roger diterapkan, proyek tersebut hanya menghabiskan kurang dari $3 juta dengan pengerjaan beberapa minggu — tidak sampai setahun, apalagi tiga tahun.

Pada tahun yang sama ia diminta bergabung dengan pemerintah untuk mengembangkan GIS terkomputerisasi pertama di dunia, dinamakan The Canada Geographic Information System (CGIS). CLI mengundangnya untuk menetapkan persyaratan fungsional, dan ia mempublikasikan makalahnya pada tahun yang sama berjudul "An Introduction to the Use of Electronic Computers in the Storage, Compilation and Assessment of Natural and Economic Data for the Evaluation of Marginal Lands" [5]. Sampai tahun 1970, atau hampir satu dekade setelah peta pertama terkomputerisasi, hanya ada 40 orang di dunia yang menggunakan teknologi ini — tetapi inilah awal dari industri GIS. Ia tidak pernah lupa memuji keberanian Lee Pratt, pegawai muda yang berani mengambil risiko untuk teknologi yang bahkan belum terbukti waktu itu.

> "Lee Pratt was a young civil servant. He didn't have to put his career on the line with unproven technology. He was the courageous one. My work was purely self-preservation — you do things because you have to." — Roger Tomlinson

**Karir dan penghargaan**

Perjalanan karir Roger sangat lengkap sebagai seorang Geograf selama usia hidup 80 tahun (wafat Februari 2014). Ia pernah menjabat sebagai Presiden Asosiasi Geografi Kanada, Ketua komisi GIS International Geography Union selama 12 tahun, serta mendirikan Tomlinson Associates Ltd. yang menyediakan layanan konsultasi geografis. Ia menjadi konsultan sejumlah organisasi pemerintahan dan internasional seperti Bank Dunia, PBB (UNESCO, FAO, UNIDO, dan UNEP), USGS, dan sejumlah badan pemerintahan AS lainnya serta negara lain seperti Australia, Swedia, Inggris, dan Prancis.

Pengalaman berkarir dan mengelola proyek berbasis teknologi GIS ia bagikan dalam buku **"Thinking About GIS: Geographic Information System Planning for Managers"**, pertama diterbitkan tahun 2003 dan edisi kelima pada 2013. Buku tersebut berisi model perencanaan GIS. Ia selalu mendorong hadirnya tenaga ahli GIS baru untuk mendukung perkembangan teknologi ini, namun prihatin akan terbatasnya guru terlatih yang dapat mengajarkan GIS kepada siswa di sekolah. Ia berharap di masa depan para ahli geografi mengambil peran strategis dalam penentuan kebijakan nasional di berbagai negara.

Roger mendefinisikan GIS secara esensi sebagai perpanjangan dari ilmu geografi — cara praktis menerapkan pengetahuan geografis ke seluruh dunia. Penekanan kata "Geografi" pada istilah GIS menunjukkan bahwa teknologi ini dimulai dan didasarkan pada ilmu geografi, di mana geografi berperan penting dalam pengambilan keputusan manusia.

Penghargaan yang ia terima:

- Medali kehormatan James R. Anderson untuk Geografi Terapan (1995)
- Penerima pertama ESRI Lifetime Achievement Award (1999)
- Penghargaan Robert T. Aangeenbrug dari American Association of Geographers (2005)
- Penghargaan Alexander Graham Bell dari National Geographic untuk penelitian geografis (2010)

Dalam salah satu sesi penganugerahan tersebut, ia pernah berkata:

> "I'm never happier than when I'm surrounded by GIS people." — Roger Tomlinson

Ia sangat menikmati bidang yang digelutinya, dan memandang positif masa depan GIS sebagai teknologi yang tepat di waktu yang tepat.

---

**Referensi**

1. Terdapat perdebatan mengenai klaim ini; tulisan pada artikel ini merujuk pada publikasi versi ArcNews 2012 — [www.esri.com/news/arcnews/fall12articles/the-fiftieth-anniversary-of-gis.html](https://www.esri.com/news/arcnews/fall12articles/the-fiftieth-anniversary-of-gis.html)
2. [gislounge.com/global-gis-industry-continues-grow](https://www.gislounge.com/global-gis-industry-continues-grow/)
3. [gislounge.com/father-of-gis](https://www.gislounge.com/father-of-gis/)
4. [esri.com/news/arcnews/fall12articles/the-fiftieth-anniversary-of-gis.html](https://www.esri.com/news/arcnews/fall12articles/the-fiftieth-anniversary-of-gis.html)
5. [gisandscience.files.wordpress.com — makalah CGIS](https://gisandscience.files.wordpress.com/2012/08/4-computermapping.pdf)

*Pertama kali dipublikasikan di [Medium](https://raisgeo.medium.com/gis-story-1-roger-tomlinson-the-father-of-gis-6637b2b74778) pada 13 Juli 2020.*