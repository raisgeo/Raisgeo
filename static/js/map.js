/**
 * map.js — Raisgeo Hero Map (v2)
 * Poster jaringan jalan Banjarbaru dari data OpenStreetMap (live, via Overpass API),
 * dirender sebagai SVG vektor — tajam di semua ukuran layar, tidak ada tile raster
 * yang berat/pecah. Fokus langsung ke Banjarbaru, 1 layer, dengan efek zoom halus.
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

  // Bangunan hanya diambil di area lebih kecil & terpusat (inti kota) — biar tetap ringan
  // dan warnanya mengelompok di tengah (mirip poster referensi), tidak merata ke seluruh peta.
  const BLD_LAT_SPAN = LAT_SPAN * 0.55;
  const BLD_LNG_SPAN = LNG_SPAN * 0.55;
  const BLD_SOUTH = CENTER_LAT - BLD_LAT_SPAN / 2;
  const BLD_NORTH = CENTER_LAT + BLD_LAT_SPAN / 2;
  const BLD_WEST  = CENTER_LNG - BLD_LNG_SPAN / 2;
  const BLD_EAST  = CENTER_LNG + BLD_LNG_SPAN / 2;

  // Batas jumlah bangunan yang dirender — jaga performa tetap ringan meski data OSM padat
  const MAX_BUILDINGS = 700;

  // Palet warna bangunan (gaya "15-minute city" map) — dipilih bergilir per bangunan
  const BUILDING_COLORS = ['45,212,191', '242,193,78']; // teal, amber (format "r,g,b")

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

  const CACHE_KEY = 'raisgeoHeroRoadsV2';
  const ANIM_DELAY = 250;

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

  // Latar aman selagi/jika data OSM belum/tidak ada — grid tipis + ambient glow lembut di tengah
  container.style.backgroundColor = '#050505';
  container.style.backgroundImage =
    'radial-gradient(circle at 50% 45%, rgba(45,212,191,0.12), transparent 55%), ' +
    'linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), ' +
    'linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)';
  container.style.backgroundSize = 'auto, 40px 40px, 40px 40px';

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

  const buildingsGroup = document.createElementNS(NS, 'g');
  buildingsGroup.setAttribute('class', 'hm-buildings');
  zoomGroup.appendChild(buildingsGroup); // paling bawah — jalan digambar di atasnya

  const groups = {
    major: document.createElementNS(NS, 'g'),
    mid:   document.createElementNS(NS, 'g'),
    minor: document.createElementNS(NS, 'g')
  };
  groups.minor.setAttribute('class', 'hm-road hm-road-minor');
  groups.mid.setAttribute('class', 'hm-road hm-road-mid');
  groups.major.setAttribute('class', 'hm-road hm-road-major');
  // Urutan append: minor dulu, lalu mid, major terakhir (paling atas, di atas blok bangunan)
  zoomGroup.appendChild(groups.minor);
  zoomGroup.appendChild(groups.mid);
  zoomGroup.appendChild(groups.major);

  // Titik penanda pusat kota — pulse dot merah (elemen HTML, bukan SVG, selalu tepat di tengah container)
  const pulseWrap = document.createElement('div');
  pulseWrap.className = 'hm-pulse-wrap';
  pulseWrap.innerHTML = '<span class="hm-pulse-ring"></span><span class="hm-pulse-dot"></span>';
  container.appendChild(pulseWrap);

  /* ──────────────────────────────────────────
     STYLE — disuntik sekali dari JS agar file ini mandiri
  ────────────────────────────────────────── */

  const style = document.createElement('style');
  style.textContent = `
    #heroCanvas { position: relative; overflow: hidden; }
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

    .hm-buildings path { stroke-width: 0.6; }

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
    }

    .hm-pulse-wrap {
      position: absolute;
      top: 50%; left: 50%;
      width: 0; height: 0;
      z-index: 2;
    }
    .hm-pulse-dot {
      position: absolute;
      top: -4px; left: -4px;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--ac, #CC0000);
      box-shadow: 0 0 0 2px rgba(255,255,255,0.25), 0 0 10px 2px rgba(204,0,0,0.55);
    }
    .hm-pulse-ring {
      position: absolute;
      top: -4px; left: -4px;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--ac, #CC0000);
      opacity: 0.55;
      animation: hmPulseRing 2.4s ease-out infinite;
    }
    @keyframes hmPulseRing {
      0%   { transform: scale(1);   opacity: 0.55; }
      100% { transform: scale(7);   opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  /* ──────────────────────────────────────────
     FETCH — Overpass API dengan timeout + fallback mirror + cache sesi
  ────────────────────────────────────────── */

  function fetchWithTimeout(url, options, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, Object.assign({}, options, { signal: controller.signal }))
      .finally(() => clearTimeout(timer));
  }

  function buildQuery() {
    const typesRegex = ALL_HIGHWAY_TYPES.join('|');
    return '[out:json][timeout:25];' +
      '(' +
        `way["highway"~"^(${typesRegex})$"](${SOUTH},${WEST},${NORTH},${EAST});` +
        `way["building"](${BLD_SOUTH},${BLD_WEST},${BLD_NORTH},${BLD_EAST});` +
      ');out geom;';
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

  function getRoadData() {
    // Cek cache sesi dulu — hindari fetch ulang tiap kali pindah halaman dalam sesi yang sama
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) return Promise.resolve(JSON.parse(cached));
    } catch (e) { /* sessionStorage tidak tersedia — lanjut fetch biasa */ }

    const query = buildQuery();

    return fetchFromEndpoint(OVERPASS_ENDPOINTS[0], query)
      .catch(function () {
        return fetchFromEndpoint(OVERPASS_ENDPOINTS[1], query);
      })
      .then(function (data) {
        const elements = (data && data.elements) ? data.elements : [];
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(elements)); } catch (e) {}
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

  function wayToPathD(way) {
    let d = '';
    for (let j = 0; j < way.geometry.length; j++) {
      const pt = way.geometry[j];
      const x = projectX(pt.lon).toFixed(1);
      const y = projectY(pt.lat).toFixed(1);
      d += (j === 0 ? 'M' : 'L') + x + ',' + y + ' ';
    }
    return d.trim();
  }

  // Sample rata (evenly-spaced), bukan cuma potong dari awal — biar distribusi
  // spasial bangunan yang tersisa tetap menyebar, bukan menumpuk di satu sisi.
  function evenSample(arr, max) {
    if (arr.length <= max) return arr;
    const out = [];
    const step = arr.length / max;
    for (let i = 0; i < max; i++) out.push(arr[Math.floor(i * step)]);
    return out;
  }

  function renderScene(elements) {
    const roadWays = [];
    const buildingWays = [];

    for (let i = 0; i < elements.length; i++) {
      const way = elements[i];
      if (!way.geometry || way.geometry.length < 2) continue;
      if (way.tags && way.tags.building) buildingWays.push(way);
      else if (way.tags && way.tags.highway) roadWays.push(way);
    }

    // ── Bangunan (dibatasi jumlahnya, warna bergilir teal/amber) ──
    const sampledBuildings = evenSample(buildingWays, MAX_BUILDINGS);
    sampledBuildings.forEach(function (way, idx) {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', wayToPathD(way) + ' Z');
      const rgb = BUILDING_COLORS[idx % BUILDING_COLORS.length];
      path.setAttribute('fill', `rgba(${rgb},0.16)`);
      path.setAttribute('stroke', `rgba(${rgb},0.45)`);
      buildingsGroup.appendChild(path);
    });

    // ── Jalan (dikelompokkan per tingkat) ──
    let roadsDrawn = 0;
    roadWays.forEach(function (way) {
      const tier = tierOf(way.tags.highway);
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', wayToPathD(way));
      groups[tier].appendChild(path);
      roadsDrawn++;
    });

    return roadsDrawn;
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
     INIT
  ────────────────────────────────────────── */

  getRoadData()
    .then(function (elements) {
      const drawn = renderScene(elements);
      // Kalau ternyata data kosong (mis. bbox salah/area tidak ada jalan ter-tag),
      // biarkan fallback grid saja tampil — tidak perlu treatment khusus lagi.
      if (drawn === 0) return;
      setTimeout(startZoom, ANIM_DELAY);
    })
    .catch(function (err) {
      // Gagal total (offline / kedua mirror down) — fallback grid tetap tampil, tidak ada error visual
      console.warn('Hero map: gagal memuat data OSM, menampilkan fallback.', err);
    });

})();
