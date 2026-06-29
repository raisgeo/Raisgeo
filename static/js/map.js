/**
 * map.js — Raisgeo Hero Map
 * Single-layer ESRI World Imagery, CSS-zoom ke Banjarbaru
 * Ringan, no flash, no layer switching
 */

(function () {
  'use strict';

  /* ──────────────────────────────────────────
     CONFIG
  ────────────────────────────────────────── */

  // Koordinat pusat Banjarbaru (kota, bukan airport)
  const CENTER_LAT  = -3.4457;
  const CENTER_LNG  = 114.8308;

  // Tile source — ESRI World Imagery (gratis, no key, resolusi tinggi hingga zoom 19)
  const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  // Zoom awal dan zoom akhir — hanya 1 layer, tidak ada pergantian
  // z=13 → view kota-kecamatan level (jalan besar terlihat)
  // z=16 → detail blok kota, perumahan, jalan kecil terlihat
  const ZOOM_START  = 13;
  const ZOOM_END    = 16;

  // Durasi animasi (ms)
  const ANIM_DURATION = 7000;   // total durasi zoom
  const ANIM_DELAY    = 300;    // delay sebelum mulai

  /* ──────────────────────────────────────────
     UTILS
  ────────────────────────────────────────── */

  function deg2rad(d) { return d * Math.PI / 180; }

  // Konversi lat/lng ke tile x,y pada zoom z
  function latLngToTile(lat, lng, z) {
    const n   = Math.pow(2, z);
    const x   = Math.floor((lng + 180) / 360 * n);
    const rad = deg2rad(lat);
    const y   = Math.floor((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * n);
    return { x, y };
  }

  // Konversi lat/lng ke piksel dalam tile grid pada zoom z
  // (piksel = posisi absolut dalam dunia tile, 256px per tile)
  function latLngToPixel(lat, lng, z) {
    const tile  = latLngToTile(lat, lng, z);
    const n     = Math.pow(2, z);
    const px    = (lng + 180) / 360 * n * 256;
    const rad   = deg2rad(lat);
    const py    = (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * n * 256;
    return { px, py };
  }

  // Easing — cubic ease in-out
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* ──────────────────────────────────────────
     TILE RENDERER
  ────────────────────────────────────────── */

  const canvas  = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx     = canvas.getContext('2d');

  // Cache gambar tile
  const tileCache = new Map();

  function getTileImg(z, x, y) {
    const key = `${z}/${x}/${y}`;
    if (tileCache.has(key)) return tileCache.get(key);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = TILE_URL.replace('{z}', z).replace('{x}', x).replace('{y}', y);
    tileCache.set(key, img);
    return img;
  }

  /* ──────────────────────────────────────────
     DRAW — render tile grid pada zoom z
     dengan view center di (centerPx, centerPy)
     dan skala (scale) untuk CSS-zoom efek
  ────────────────────────────────────────── */

  function drawMap(z, centerPx, centerPy) {
    const W = canvas.width;
    const H = canvas.height;

    // Offset: pusat canvas = pusat koordinat
    const originX = W / 2 - centerPx % 256;
    const originY = H / 2 - centerPy % 256;

    // Tile di pusat
    const tileX0 = Math.floor(centerPx / 256);
    const tileY0 = Math.floor(centerPy / 256);

    // Berapa banyak tile yang perlu ditarik ke setiap arah
    const tilesX = Math.ceil(W / 256) + 2;
    const tilesY = Math.ceil(H / 256) + 2;

    ctx.clearRect(0, 0, W, H);

    for (let dy = -tilesY; dy <= tilesY; dy++) {
      for (let dx = -tilesX; dx <= tilesX; dx++) {
        const tx = tileX0 + dx;
        const ty = tileY0 + dy;
        const maxTile = Math.pow(2, z);
        if (tx < 0 || ty < 0 || tx >= maxTile || ty >= maxTile) continue;

        const img = getTileImg(z, tx, ty);
        const drawX = originX + dx * 256;
        const drawY = originY + dy * 256;

        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, drawX, drawY, 256, 256);
        } else {
          // Placeholder abu-abu sambil tile load
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(drawX, drawY, 256, 256);
          img.onload = () => { /* animasi loop akan redraw otomatis */ };
        }
      }
    }
  }

  /* ──────────────────────────────────────────
     PRE-LOAD TILES sebelum animasi dimulai
  ────────────────────────────────────────── */

  function preloadTiles(z, centerLat, centerLng, radius) {
    const { x: cx, y: cy } = latLngToTile(centerLat, centerLng, z);
    const promises = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const img = getTileImg(z, cx + dx, cy + dy);
        if (!img.complete) {
          promises.push(new Promise(res => {
            img.onload  = res;
            img.onerror = res; // jika gagal, tetap lanjut
          }));
        }
      }
    }
    return Promise.all(promises);
  }

  /* ──────────────────────────────────────────
     CANVAS RESIZE
  ────────────────────────────────────────── */

  function resizeCanvas() {
    const section = canvas.parentElement;
    canvas.width  = section.offsetWidth;
    canvas.height = section.offsetHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', () => {
    resizeCanvas();
    // Redraw frame saat ini jika sudah ada
    if (currentFrame !== null) drawFrame(currentFrame);
  });

  /* ──────────────────────────────────────────
     ANIMASI ZOOM — pure lerp antara 2 zoom level
     pada 1 tile layer (ESRI z=13 s/d z=16)

     Cara kerja:
     - Render tile pada ZOOM_START
     - Gunakan CSS-like transform lewat ctx.setTransform
       untuk zoom in secara halus ke titik pusat
     - Tidak ada pergantian layer → tidak ada flash
  ────────────────────────────────────────── */

  let currentFrame = 0;
  let animStart    = null;
  let rafId        = null;

  // Piksel pusat Banjarbaru pada ZOOM_START
  const centerPixStart = latLngToPixel(CENTER_LAT, CENTER_LNG, ZOOM_START);

  // Scale akhir: jika zoom naik dari Z ke Z+n,
  // maka scale CSS = 2^n (karena setiap zoom level = 2× lebih dekat)
  const scaleEnd = Math.pow(2, ZOOM_END - ZOOM_START);

  function drawFrame(t) {
    currentFrame = t;
    const W = canvas.width;
    const H = canvas.height;

    const ease  = easeInOutCubic(t);
    const scale = 1 + (scaleEnd - 1) * ease;

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // Transformasi: zoom terhadap titik pusat canvas
    // Efeknya = kamera mendekati CENTER_LAT/CENTER_LNG
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-W / 2, -H / 2);

    drawMap(ZOOM_START, centerPixStart.px, centerPixStart.py);

    ctx.restore();
  }

  function animate(timestamp) {
    if (!animStart) animStart = timestamp;
    const elapsed = timestamp - animStart;
    const t = Math.min(elapsed / ANIM_DURATION, 1);

    drawFrame(t);

    if (t < 1) {
      rafId = requestAnimationFrame(animate);
    } else {
      // Animasi selesai — tetap tampilkan frame akhir, berhenti loop
      drawFrame(1);
    }
  }

  /* ──────────────────────────────────────────
     INIT — preload tile utama lalu mulai animasi
  ────────────────────────────────────────── */

  // Draw frame 0 segera (tampilan awal sebelum preload selesai)
  drawFrame(0);

  // Preload tile di sekitar pusat untuk zoom start dan sedikit zoom end
  Promise.all([
    preloadTiles(ZOOM_START, CENTER_LAT, CENTER_LNG, 3),
    preloadTiles(ZOOM_END,   CENTER_LAT, CENTER_LNG, 2),
  ]).then(() => {
    // Semua tile inti sudah siap — mulai animasi
    setTimeout(() => {
      rafId = requestAnimationFrame(animate);
    }, ANIM_DELAY);
  });

  // Fallback: mulai animasi setelah 1.5s meski preload belum selesai
  setTimeout(() => {
    if (rafId === null) {
      rafId = requestAnimationFrame(animate);
    }
  }, 1500);

})();
