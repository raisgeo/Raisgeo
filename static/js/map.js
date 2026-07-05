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

  const CACHE_KEY = 'raisgeoHeroRoadsV1';
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

  // Latar aman selagi/jika data OSM belum/tidak ada — grid tipis, bukan warna polos kosong
  container.style.background =
    '#111111 ' +
    'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), ' +
    'linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)';
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
    .hm-road-major path { stroke: rgba(235,232,228,0.55); stroke-width: 2.4; }
    .hm-road-mid path   { stroke: rgba(210,206,200,0.38); stroke-width: 1.5; }
    .hm-road-minor path { stroke: rgba(180,176,170,0.22); stroke-width: 0.8; }

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
      box-shadow: 0 0 0 2px rgba(255,255,255,0.25);
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
      const drawn = renderRoads(elements);
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
