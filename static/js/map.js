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
  // NASA GIBS Blue Marble — lebih gelap dan mewah seperti ESA
  img.src=`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/${z}/${y}/${x}.jpg`;
  tileCache[key]=img;
  return img;
}

function lon2tile(lon,zoom){return Math.floor((lon+180)/360*Math.pow(2,zoom))}
function lat2tile(lat,zoom){return Math.floor((1-Math.log(Math.tan(lat*Math.PI/180)+1/Math.cos(lat*Math.PI/180))/Math.PI)/2*Math.pow(2,zoom))}

function drawSatelliteTiles(s,W,H){
  let zoom;
  if(s.scale<2)zoom=2;
  else if(s.scale<6)zoom=3;
  else if(s.scale<18)zoom=5;
  else if(s.scale<55)zoom=7;
  else zoom=8;

  const n=Math.pow(2,zoom);
  const tileSize=256;
  const cx=lon2tile(s.cx,zoom);
  const cy=lat2tile(s.cy,zoom);
  const tilesX=Math.ceil(W/tileSize)+4;
  const tilesY=Math.ceil(H/tileSize)+4;

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
        ctx.drawImage(img,px,py,tpx+1,tpy+1);
      }
    }
  }
}

// ── COMPASS ──
function drawCompass(x,y,r){
  ctx.save();ctx.translate(x,y);
  ctx.strokeStyle='rgba(255,255,255,0.30)';ctx.lineWidth=0.5;
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([1,5]);ctx.beginPath();ctx.arc(0,0,r*.65,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='rgba(255,255,255,0.65)';
  ctx.beginPath();ctx.moveTo(0,-r*.85);ctx.lineTo(r*.15,-r*.25);ctx.lineTo(0,-r*.12);ctx.lineTo(-r*.15,-r*.25);ctx.closePath();ctx.fill();
  ctx.globalAlpha=.25;ctx.strokeStyle='rgba(255,255,255,0.4)';
  ctx.beginPath();ctx.moveTo(0,r*.85);ctx.lineTo(r*.15,r*.25);ctx.lineTo(0,r*.12);ctx.lineTo(-r*.15,r*.25);ctx.closePath();ctx.stroke();
  ctx.globalAlpha=.75;ctx.fillStyle='rgba(255,255,255,0.65)';
  ctx.font='bold '+(r*.44)+'px serif';ctx.textAlign='center';ctx.fillText('N',0,-r-6);
  ctx.globalAlpha=.25;ctx.font=(r*.3)+'px sans-serif';
  ctx.fillText('S',0,r+10);ctx.fillText('E',r+8,3);ctx.fillText('W',-r-8,3);
  ctx.globalAlpha=1;ctx.fillStyle='rgba(255,255,255,0.45)';
  ctx.beginPath();ctx.arc(0,0,2.5,0,Math.PI*2);ctx.fill();
  ctx.restore()
}

// ── PHASES: mulai dari Asia, bukan dunia penuh ──
// Fase 0: Asia Tenggara (sudah terlihat Kalimantan)
// Fase 1: Indonesia
// Fase 2: Kalimantan
// Fase 3: Kalimantan Selatan — Banjarbaru (final)
const phases=[
  {cx:115,cy:0,   scale:1.8,  dur:2000},   // Asia Tenggara
  {cx:118,cy:-3,  scale:4.5,  dur:2800},   // Indonesia
  {cx:115,cy:-2,  scale:14,   dur:2800},   // Kalimantan
  {cx:BJ.lon,cy:BJ.lat,scale:38,dur:99999} // Banjarbaru — final
];

let t0=null;
// Ease in-out cubic — lebih smooth dari quadratic
const ease=t=>t<.5?4*t*t*t:(t-1)*(2*t-2)*(2*t-2)+1;

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
  return{cx:BJ.lon,cy:BJ.lat,scale:38,ph:3,pt:1}
}

// ── DRAW ──
function draw(now){
  const W=canvas.width,H=canvas.height;
  if(!W||!H){requestAnimationFrame(draw);return}
  const s=getState(now);

  // 1. Background biru gelap NASA saat tile belum load
  ctx.fillStyle='#050d1a';
  ctx.fillRect(0,0,W,H);

  // 2. Citra satelit NASA Blue Marble
  ctx.save();
  drawSatelliteTiles(s,W,H);
  ctx.restore();

  // 3. Overlay gelap tipis — biarkan citra tetap terlihat mewah
  const ov=ctx.createLinearGradient(0,0,0,H);
  ov.addColorStop(0,'rgba(0,5,15,0.35)');
  ov.addColorStop(0.45,'rgba(0,5,15,0.20)');
  ov.addColorStop(1,'rgba(0,5,15,0.65)');
  ctx.fillStyle=ov;
  ctx.fillRect(0,0,W,H);

  // 4. Titik Banjarbaru
  const[bx,by]=project(BJ.lon,BJ.lat,s,W,H);
  const pa=s.ph>=2?Math.min(1,s.pt*2):0;
  if(pa>0){
    const pulse=0.5+0.5*Math.sin(now*.003);
    ctx.save();
    ctx.globalAlpha=pa*.15*pulse;
    ctx.strokeStyle='#CC0000';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(bx,by,16,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(bx,by,28,0,Math.PI*2);ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha=pa;
    ctx.fillStyle='#CC0000';
    ctx.beginPath();ctx.arc(bx,by,6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#FFFFFF';
    ctx.beginPath();ctx.arc(bx,by,2.5,0,Math.PI*2);ctx.fill();
    ctx.restore()
  }

  // 5. Compass
  drawCompass(W-46,H-50,22);

  requestAnimationFrame(draw)
}

requestAnimationFrame(draw);
})();
