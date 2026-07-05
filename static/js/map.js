/**
 * map.js — Raisgeo Hero Map (v3)
 * Poster jaringan jalan Banjarbaru dari data OpenStreetMap (live, via Overpass API),
 * dirender sebagai SVG vektor — tajam di semua ukuran layar, tidak ada tile raster
 * yang berat/pecah. Fokus langsung ke Banjarbaru, 1 layer, dengan efek zoom halus.
 *
 * 3 titik merah berkedip menyebar (gaya radar/monitoring) menandai beberapa lokasi
 * di area kota — bergerak & ikut zoom bersama peta karena dirender sebagai bagian
 * dari SVG, bukan elemen HTML terpisah.
 *
 * Fallback aman: jika data OSM gagal dimuat (offline, API sedang down, dll),
 * hero tetap tampil rapi sebagai latar grid minimal — tidak pernah "pecah"/broken.
 */

(function () {
  'use strict';

  /* ──────────────────────────────────────────
     CONFIG
  ────────────────────────────────────────── */

  // Koordinat pusat Banjarbaru (kota)
  const CENTER_LAT = -3.4457;
  const CENTER_LNG = 114.8308;

  // Cakupan area (derajat) — menentukan seberapa luas jaringan jalan yang tampil.
  // ~11km (lat) x ~14km (lng), cukup untuk menangkap pola grid kota Banjarbaru.
  const LAT_SPAN = 0.10;
  const LNG_SPAN = 0.13;

  const SOUTH = CENTER_LAT - LAT_SPAN / 2;
  const NORTH = CENTER_LAT + LAT_SPAN / 2;
  const WEST  = CENTER_LNG - LNG_SPAN / 2;
  const EAST  = CENTER_LNG + LNG_SPAN / 2;

  // Ukuran viewBox SVG (unit bebas, proporsional terhadap cakupan area di atas)
  const VB_W = 1300;
  const VB_H = Math.round(VB_W * (LAT_SPAN / LNG_SPAN));

  // Overpass API — 2 mirror publik untuk keandalan (coba mirror 1, fallback ke mirror 2)
  const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];
  const FETCH_TIMEOUT_MS = 7000;

  // Jenis jalan yang diambil, dikelompokkan jadi 3 tingkat ketebalan garis (gaya poster)
  const ROAD_TIERS = {
    major: ['motorway', 'trunk', 'primary'],
    mid:   ['secondary', 'tertiary'],
    minor: ['residential', 'unclassified', 'living_street']
  };
  const ALL_HIGHWAY_TYPES = [].concat(ROAD_TIERS.major, ROAD_TIERS.mid, ROAD_TIERS.minor);

  const CACHE_KEY = 'raisgeoHeroRoadsV3';
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam — pengunjung yang balik lagi tidak perlu fetch ulang
  const ANIM_DELAY = 250;

  // Titik-titik "radar" — 1 di pusat kota, 2 lainnya menyebar ke KIRI-KANAN (horizontal).
  // Offset vertikal (lat) dibuat sangat kecil dengan sengaja: karena hero situs ini sangat
  // lebar (rasio ~4:1) sementara peta ini rasionya ~1.3:1, mode "slice" pada SVG memotong
  // habis bagian atas-bawah viewBox di layar lebar — kalau offset vertikal terlalu besar,
  // titik itu akan jatuh di luar area yang kelihatan dan seolah "hilang". Offset horizontal
  // jauh lebih aman karena lebar viewBox selalu tampil penuh, berapa pun lebar layarnya.
  const MARKERS = [
    { lat: CENTER_LAT,                    lng: CENTER_LNG,                     delay: 0,   color: '#CC0000' },
    { lat: CENTER_LAT + LAT_SPAN * 0.08,  lng: CENTER_LNG + LNG_SPAN * 0.32,   delay: 0.8, color: '#378ADD' },
    { lat: CENTER_LAT - LAT_SPAN * 0.07,  lng: CENTER_LNG - LNG_SPAN * 0.30,   delay: 1.6, color: '#EF9F27' }
  ];

  /* ──────────────────────────────────────────
     PROYEKSI lat/lng → koordinat SVG
     (area kecil & dekat ekuator → proyeksi linear sederhana cukup akurat)
  ────────────────────────────────────────── */

  function projectX(lng) { return ((lng - WEST) / LNG_SPAN) * VB_W; }
  function projectY(lat) { return ((NORTH - lat) / LAT_SPAN) * VB_H; }

  /* ──────────────────────────────────────────
     SETUP CONTAINER
  ────────────────────────────────────────── */

  const container = document.getElementById('heroCanvas');
  if (!container) return;

  // Latar aman selagi/jika data OSM belum/tidak ada — grid tipis di atas hitam pekat
  container.style.backgroundColor = '#050505';
  container.style.backgroundImage =
    'linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), ' +
    'linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)';
  container.style.backgroundSize = '40px 40px, 40px 40px';

  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.display = 'block';
  container.appendChild(svg);

  const zoomGroup = document.createElementNS(NS, 'g');
  zoomGroup.setAttribute('id', 'heroMapZoomGroup');
  svg.appendChild(zoomGroup);

  const groups = {
    major: document.createElementNS(NS, 'g'),
    mid:   document.createElementNS(NS, 'g'),
    minor: document.createElementNS(NS, 'g')
  };
  groups.minor.setAttribute('class', 'hm-road hm-road-minor');
  groups.mid.setAttribute('class', 'hm-road hm-road-mid');
  groups.major.setAttribute('class', 'hm-road hm-road-major');
  // Urutan append: minor dulu (paling bawah), major terakhir (paling atas)
  zoomGroup.appendChild(groups.minor);
  zoomGroup.appendChild(groups.mid);
  zoomGroup.appendChild(groups.major);

  // Grup titik radar — ditaruh paling atas, di dalam zoomGroup juga (ikut pan/zoom peta)
  const markersGroup = document.createElementNS(NS, 'g');
  markersGroup.setAttribute('class', 'hm-markers');
  zoomGroup.appendChild(markersGroup);

  MARKERS.forEach(function (m) {
    const x = projectX(m.lng);
    const y = projectY(m.lat);

    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'hm-marker');
    g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
    g.style.animationDelay = m.delay + 's';
    g.style.setProperty('--marker-color', m.color);

    const ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('class', 'hm-marker-ring');
    ring.setAttribute('cx', 0);
    ring.setAttribute('cy', 0);
    ring.setAttribute('r', 5);
    ring.style.animationDelay = m.delay + 's';

    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('class', 'hm-marker-dot');
    dot.setAttribute('cx', 0);
    dot.setAttribute('cy', 0);
    dot.setAttribute('r', 5);

    g.appendChild(ring);
    g.appendChild(dot);
    markersGroup.appendChild(g);
  });

  /* ──────────────────────────────────────────
     STYLE — disuntik sekali dari JS agar file ini mandiri
  ────────────────────────────────────────── */

  const style = document.createElement('style');
  style.textContent = `
    #heroCanvas { position: relative; overflow: hidden; }
    .hm-road {
      opacity: 0;
      transition: opacity 1.1s ease;
    }
    #heroMapZoomGroup.hm-content-ready .hm-road {
      opacity: 1;
    }
    .hm-road path {
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .hm-road-major path { stroke: rgba(255,255,255,0.88); stroke-width: 2.2; }
    .hm-road-mid path   { stroke: rgba(255,255,255,0.52); stroke-width: 1.3; }
    .hm-road-minor path { stroke: rgba(255,255,255,0.20); stroke-width: 0.7; }
    .hm-road-major { filter: drop-shadow(0 0 3px rgba(255,255,255,0.45)); }
    .hm-road-mid   { filter: drop-shadow(0 0 1.5px rgba(255,255,255,0.2)); }

    #heroMapZoomGroup {
      transform-origin: ${VB_W / 2}px ${VB_H / 2}px;
      animation: heroMapZoom 9s cubic-bezier(0.45, 0, 0.15, 1) forwards;
      animation-play-state: paused;
    }
    #heroMapZoomGroup.hm-play { animation-play-state: running; }
    @keyframes heroMapZoom {
      from { transform: scale(1); }
      to   { transform: scale(1.32); }
    }
    @media (prefers-reduced-motion: reduce) {
      #heroMapZoomGroup { animation: none !important; }
      .hm-marker-ring { animation: none !important; }
    }

    /* Titik radar — 3 titik menyebar, berkedip async (gaya monitoring). Warna
       per titik diatur lewat --marker-color (di-set per elemen dari JS):
       titik pusat kota merah, dua titik lain biru & kuning sebagai aksen. */
    .hm-marker-dot {
      fill: var(--marker-color, #CC0000);
      filter: drop-shadow(0 0 4px var(--marker-color, #CC0000));
    }
    .hm-marker-ring {
      fill: var(--marker-color, #CC0000);
      opacity: 0.55;
      transform-box: fill-box;
      transform-origin: center;
      animation: hmPulseRing 2.4s ease-out infinite;
    }
    @keyframes hmPulseRing {
      0%   { transform: scale(1);   opacity: 0.55; }
      100% { transform: scale(6.5); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  /* ──────────────────────────────────────────
     FETCH — Overpass API dengan timeout + fallback mirror + cache 24 jam
  ────────────────────────────────────────── */

  function fetchWithTimeout(url, options, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, Object.assign({}, options, { signal: controller.signal }))
      .finally(() => clearTimeout(timer));
  }

  function buildQuery() {
    const typesRegex = ALL_HIGHWAY_TYPES.join('|');
    return `[out:json][timeout:25];way["highway"~"^(${typesRegex})$"](${SOUTH},${WEST},${NORTH},${EAST});out geom;`;
  }

  function fetchFromEndpoint(url, query) {
    return fetchWithTimeout(url, {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query)
    }, FETCH_TIMEOUT_MS).then(function (res) {
      if (!res.ok) throw new Error('Overpass response not OK: ' + res.status);
      return res.json();
    });
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.t || (Date.now() - parsed.t) > CACHE_TTL_MS) return null;
      return parsed.elements;
    } catch (e) { return null; } // localStorage tidak tersedia (mis. private browsing) — lanjut fetch biasa
  }

  function writeCache(elements) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), elements: elements }));
    } catch (e) { /* penuh/diblokir — tidak fatal, cukup skip cache */ }
  }

  function getRoadData() {
    // Cek cache dulu (berlaku 24 jam) — pengunjung yang balik lagi tidak perlu nunggu fetch ulang
    const cached = readCache();
    if (cached) return Promise.resolve(cached);

    const query = buildQuery();

    return fetchFromEndpoint(OVERPASS_ENDPOINTS[0], query)
      .catch(function () {
        return fetchFromEndpoint(OVERPASS_ENDPOINTS[1], query);
      })
      .then(function (data) {
        const elements = (data && data.elements) ? data.elements : [];
        writeCache(elements);
        return elements;
      });
  }

  /* ──────────────────────────────────────────
     RENDER — bangun <path> per ruas jalan, dikelompokkan per tingkat
  ────────────────────────────────────────── */

  function tierOf(highwayType) {
    if (ROAD_TIERS.major.indexOf(highwayType) !== -1) return 'major';
    if (ROAD_TIERS.mid.indexOf(highwayType) !== -1) return 'mid';
    return 'minor';
  }

  function renderRoads(elements) {
    let drawn = 0;
    for (let i = 0; i < elements.length; i++) {
      const way = elements[i];
      if (!way.geometry || way.geometry.length < 2) continue;
      const tier = tierOf(way.tags && way.tags.highway);

      let d = '';
      for (let j = 0; j < way.geometry.length; j++) {
        const pt = way.geometry[j];
        const x = projectX(pt.lon).toFixed(1);
        const y = projectY(pt.lat).toFixed(1);
        d += (j === 0 ? 'M' : 'L') + x + ',' + y + ' ';
      }

      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d.trim());
      groups[tier].appendChild(path);
      drawn++;
    }
    return drawn;
  }

  function revealContent() {
    // Trigger fade-in halus (bukan pop tiba-tiba) begitu path sudah selesai dirender
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        zoomGroup.classList.add('hm-content-ready');
      });
    });
  }

  function startZoom() {
    // requestAnimationFrame agar browser sudah selesai layout sebelum animasi CSS dipicu
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        zoomGroup.classList.add('hm-play');
      });
    });
  }

  /* ──────────────────────────────────────────
     INIT — titik radar tampil segera, jalan menyusul setelah data siap
  ────────────────────────────────────────── */

  getRoadData()
    .then(function (elements) {
      const drawn = renderRoads(elements);
      // Kalau ternyata data kosong (mis. bbox salah/area tidak ada jalan ter-tag),
      // biarkan fallback grid saja tampil — tidak perlu treatment khusus lagi.
      if (drawn === 0) return;
      revealContent();
      setTimeout(startZoom, ANIM_DELAY);
    })
    .catch(function (err) {
      // Gagal total (offline / kedua mirror down) — fallback grid tetap tampil, tidak ada error visual
      console.warn('Hero map: gagal memuat data OSM, menampilkan fallback.', err);
    });

})();
