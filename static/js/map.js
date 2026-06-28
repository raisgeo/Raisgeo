(function(){
function toggleTheme(){
  const h=document.documentElement;
  h.classList.toggle('dark');
  localStorage.setItem('rg',h.classList.contains('dark')?'dark':'light');
}
window.toggleTheme=toggleTheme;
if(localStorage.getItem('rg')==='dark')document.documentElement.classList.add('dark');

const canvas=document.getElementById('heroCanvas');
if(!canvas)return;
const ctx=canvas.getContext('2d');
function resize(){canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight||440}
resize();window.addEventListener('resize',resize);

const BJ={lon:114.75,lat:-3.426};

// ── MERCATOR ──
function mercator(lon,lat){
  const x=(lon+180)/360;
  const latR=lat*Math.PI/180;
  const y=(1-Math.log(Math.tan(latR/2+Math.PI/4))/Math.PI)/2;
  return[x,y]
}
function project(lon,lat,s,W,H){
  const[mx,my]=mercator(lon,lat);
  const[cx,cy]=mercator(s.cx,s.cy);
  return[(mx-cx)*s.scale*W+W/2,(my-cy)*s.scale*W+H/2]
}

// ── TILE CACHE ──
const tileCache={};
function getTile(x,y,z){
  const key=`${z}/${x}/${y}`;
  if(tileCache[key])return tileCache[key];
  const img=new Image();
  img.crossOrigin='anonymous';
  // ESRI World Imagery — gratis tanpa API key
  img.src=`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
  tileCache[key]=img;
  return img;
}

// ── TILE DRAWING ──
function lon2tile(lon,zoom){return Math.floor((lon+180)/360*Math.pow(2,zoom))}
function lat2tile(lat,zoom){return Math.floor((1-Math.log(Math.tan(lat*Math.PI/180)+1/Math.cos(lat*Math.PI/180))/Math.PI)/2*Math.pow(2,zoom))}

function drawSatelliteTiles(s,W,H){
  // Tentukan zoom level berdasarkan skala animasi
  let zoom;
  if(s.scale<1)zoom=2;
  else if(s.scale<5)zoom=4;
  else if(s.scale<15)zoom=6;
  else if(s.scale<50)zoom=8;
  else zoom=10;

  const n=Math.pow(2,zoom);
  const tileSize=256;

  // Center tile
  const cx=lon2tile(s.cx,zoom);
  const cy=lat2tile(s.cy,zoom);

  // Berapa tile yang perlu digambar
  const tilesX=Math.ceil(W/tileSize)+4;
  const tilesY=Math.ceil(H/tileSize)+4;

  // Posisi piksel center tile di canvas
  function tileToPixel(tx,ty){
    const lon=(tx/n)*360-180;
    const latRad=Math.atan(Math.sinh(Math.PI*(1-2*ty/n)));
    const lat=latRad*180/Math.PI;
    return project(lon,lat,s,W,H);
  }

  const[px0,py0]=tileToPixel(cx,cy);
  const[px1,py1]=tileToPixel(cx+1,cy+1);
  const tpx=Math.abs(px1-px0);
  const tpy=Math.abs(py1-py0);

  const startX=cx-Math.ceil(tilesX/2);
  const startY=cy-Math.ceil(tilesY/2);

  for(let tx=startX;tx<=startX+tilesX;tx++){
    for(let ty=startY;ty<=startY+tilesY;ty++){
      const ntx=((tx%n)+n)%n;
      const nty=Math.max(0,Math.min(n-1,ty));
      const img=getTile(ntx,nty,zoom);
      const[px,py]=tileToPixel(tx,ty);
      if(img.complete&&img.naturalWidth>0){
        ctx.drawImage(img,px,py,tpx,tpy);
      } else {
        img.onload=()=>{};
      }
    }
  }
}

// ── WORLD GEOJSON ──
let worldData=null;

function drawGeoJSON(data,s,W,H,fill,stroke,lw){
  if(!data)return;
  data.features.forEach(f=>{
    const geom=f.geometry;
    if(!geom)return;
    const polys=geom.type==='Polygon'?[geom.coordinates]:geom.type==='MultiPolygon'?geom.coordinates:[];
    polys.forEach(poly=>poly.forEach(ring=>{
      if(ring.length<3)return;
      ctx.beginPath();
      ring.forEach(([lon,lat],i)=>{
        if(lat>85||lat<-85)return;
        const[x,y]=project(lon,lat,s,W,H);
        i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)
      });
      ctx.closePath();
      if(fill){ctx.fillStyle=fill;ctx.fill()}
      if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}
    }))
  })
}

// ── GRID ──
function drawGrid(s,W,H){
  ctx.strokeStyle='rgba(255,255,255,0.04)';
  ctx.lineWidth=0.4;
  ctx.setLineDash([2,8]);
  for(let lon=-180;lon<=180;lon+=15){
    ctx.beginPath();
    const[x]=project(lon,0,s,W,H);
    ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()
  }
  for(let lat=-60;lat<=75;lat+=15){
    ctx.beginPath();
    const[,y]=project(0,lat,s,W,H);
    ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()
  }
  ctx.setLineDash([])
}

// ── COMPASS ──
function drawCompass(x,y,r){
  ctx.save();ctx.translate(x,y);
  ctx.strokeStyle='rgba(255,255,255,0.35)';ctx.lineWidth=0.5;
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([1,5]);ctx.beginPath();ctx.arc(0,0,r*.65,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='rgba(255,255,255,0.7)';
  ctx.beginPath();ctx.moveTo(0,-r*.85);ctx.lineTo(r*.15,-r*.25);ctx.lineTo(0,-r*.12);ctx.lineTo(-r*.15,-r*.25);ctx.closePath();ctx.fill();
  ctx.globalAlpha=.3;ctx.strokeStyle='rgba(255,255,255,0.4)';
  ctx.beginPath();ctx.moveTo(0,r*.85);ctx.lineTo(r*.15,r*.25);ctx.lineTo(0,r*.12);ctx.lineTo(-r*.15,r*.25);ctx.closePath();ctx.stroke();
  ctx.globalAlpha=.8;ctx.fillStyle='rgba(255,255,255,0.7)';
  ctx.font='bold '+(r*.44)+'px serif';ctx.textAlign='center';ctx.fillText('N',0,-r-6);
  ctx.globalAlpha=.3;ctx.font=(r*.3)+'px sans-serif';
  ctx.fillText('S',0,r+10);ctx.fillText('E',r+8,3);ctx.fillText('W',-r-8,3);
  ctx.globalAlpha=1;ctx.fillStyle='rgba(255,255,255,0.5)';
  ctx.beginPath();ctx.arc(0,0,3,0,Math.PI*2);ctx.fill();
  ctx.restore()
}

// ── ANIMASI PHASES ──
const phases=[
  {cx:20,cy:20,scale:0.55,dur:1400},
  {cx:118,cy:-3,scale:3.5,dur:1800},
  {cx:115,cy:-3,scale:12,dur:1600},
  {cx:BJ.lon,cy:BJ.lat,scale:35,dur:99999}
];
let t0=null;
const ease=t=>t<.5?2*t*t:-1+(4-2*t)*t;
function getState(now){
  if(!t0)t0=now;
  const el=now-t0;
  let acc=0;
  for(let i=0;i<phases.length;i++){
    const p=phases[Math.max(0,i-1)],c=phases[i];
    if(el<acc+c.dur){
      const e=ease(Math.min((el-acc)/c.dur,1));
      return{cx:p.cx+(c.cx-p.cx)*e,cy:p.cy+(c.cy-p.cy)*e,scale:p.scale+(c.scale-p.scale)*e,ph:i,pt:(el-acc)/c.dur}
    }
    acc+=c.dur
  }
  return{cx:BJ.lon,cy:BJ.lat,scale:35,ph:3,pt:1}
}

// ── DRAW LOOP ──
function draw(now){
  const W=canvas.width,H=canvas.height;
  if(!W||!H){requestAnimationFrame(draw);return}
  const s=getState(now);

  // 1. Background gelap fallback
  ctx.fillStyle='#0a0a0a';
  ctx.fillRect(0,0,W,H);

  // 2. Citra satelit ESRI
  ctx.save();
  drawSatelliteTiles(s,W,H);
  ctx.restore();

  // 3. Overlay hitam kristal — transparan agar citra tetap terlihat
  const overlay=ctx.createLinearGradient(0,0,0,H);
  overlay.addColorStop(0,'rgba(0,0,0,0.45)');
  overlay.addColorStop(0.5,'rgba(0,0,0,0.30)');
  overlay.addColorStop(1,'rgba(0,0,0,0.70)');
  ctx.fillStyle=overlay;
  ctx.fillRect(0,0,W,H);

  // 4. (layer peta vector dihilangkan — cukup citra satelit + overlay)

  // 7. Titik Banjarbaru dengan pulse
  const[bx,by]=project(BJ.lon,BJ.lat,s,W,H);
  const pa=s.ph>=2?Math.min(1,s.pt*2.5):0;
  if(pa>0){
    const pulse=0.5+0.5*Math.sin(now*.003);
    ctx.save();
    ctx.globalAlpha=pa*.18*pulse;
    ctx.strokeStyle='#CC0000';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(bx,by,14,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(bx,by,26,0,Math.PI*2);ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha=pa;
    ctx.fillStyle='#CC0000';
    ctx.beginPath();ctx.arc(bx,by,6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#FFFFFF';
    ctx.beginPath();ctx.arc(bx,by,2.5,0,Math.PI*2);ctx.fill();
    ctx.restore()
  }

  // 8. Compass
  drawCompass(W-46,H-50,24);

  // 9. Scale bar
  ctx.save();
  ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.moveTo(16,H-14);ctx.lineTo(68,H-14);ctx.stroke();
  ctx.beginPath();ctx.moveTo(16,H-18);ctx.lineTo(16,H-10);ctx.stroke();
  ctx.beginPath();ctx.moveTo(68,H-18);ctx.lineTo(68,H-10);ctx.stroke();
  ctx.font='7px sans-serif';ctx.fillStyle='rgba(255,255,255,0.25)';ctx.textAlign='left';
  ctx.fillText('0',13,H-20);ctx.fillText('5000 km',50,H-20);
  ctx.restore();

  requestAnimationFrame(draw)
}

// ── LOAD GEOJSON & START ──
fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
  .then(r=>r.json())
  .then(topo=>{
    const sc=document.createElement('script');
    sc.src='https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js';
    sc.onload=()=>{
      worldData={type:'FeatureCollection',features:topojson.feature(topo,topo.objects.countries).features}
    };
    document.head.appendChild(sc)
  }).catch(()=>{});

requestAnimationFrame(draw);
})();
