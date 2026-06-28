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
  return[x,y];
}
function project(lon,lat,s,W,H){
  const[mx,my]=mercator(lon,lat);
  const[cx,cy]=mercator(s.cx,s.cy);
  return[(mx-cx)*s.scale*W+W/2,(my-cy)*s.scale*W+H/2];
}

// ── TILE CACHE ──
const tileCache={};
function getTile(x,y,z){
  const key=`${z}/${x}/${y}`;
  if(tileCache[key])return tileCache[key];
  const img=new Image();
  img.crossOrigin='anonymous';
  // ESRI World Imagery — resolusi tinggi sampai kota
  img.src=`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
  img.onload=()=>{};
  tileCache[key]=img;
  return img;
}

function lon2tile(lon,z){return Math.floor((lon+180)/360*Math.pow(2,z));}
function lat2tile(lat,z){return Math.floor((1-Math.log(Math.tan(lat*Math.PI/180)+1/Math.cos(lat*Math.PI/180))/Math.PI)/2*Math.pow(2,z));}

function drawTiles(s,W,H){
  // Zoom level sesuai skala — max zoom 13 supaya kota terlihat
  let z;
  if(s.scale<3)       z=4;
  else if(s.scale<7)  z=5;
  else if(s.scale<18) z=6;
  else if(s.scale<50) z=8;
  else if(s.scale<120)z=10;
  else if(s.scale<300)z=12;
  else                z=13;

  const n=Math.pow(2,z);
  const cx=lon2tile(s.cx,z);
  const cy=lat2tile(s.cy,z);

  function tile2px(tx,ty){
    const lon=(tx/n)*360-180;
    const latR=Math.atan(Math.sinh(Math.PI*(1-2*ty/n)));
    return project(lon,latR*180/Math.PI,s,W,H);
  }

  const[p0x,p0y]=tile2px(cx,cy);
  const[p1x,p1y]=tile2px(cx+1,cy+1);
  const tw=Math.abs(p1x-p0x)+1;
  const th=Math.abs(p1y-p0y)+1;

  const padX=Math.ceil(W/tw)+3;
  const padY=Math.ceil(H/th)+3;

  for(let tx=cx-padX;tx<=cx+padX;tx++){
    for(let ty=cy-padY;ty<=cy+padY;ty++){
      const ntx=((tx%n)+n)%n;
      const nty=Math.max(0,Math.min(n-1,ty));
      const img=getTile(ntx,nty,z);
      const[px,py]=tile2px(tx,ty);
      if(img.complete&&img.naturalWidth>0){
        ctx.drawImage(img,px,py,tw,th);
      }
    }
  }
}

// ── COMPASS ──
function drawCompass(x,y,r){
  ctx.save();ctx.translate(x,y);
  ctx.strokeStyle='rgba(255,255,255,0.28)';ctx.lineWidth=0.5;
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([1,5]);ctx.beginPath();ctx.arc(0,0,r*.65,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='rgba(255,255,255,0.65)';
  ctx.beginPath();ctx.moveTo(0,-r*.85);ctx.lineTo(r*.15,-r*.25);ctx.lineTo(0,-r*.12);ctx.lineTo(-r*.15,-r*.25);ctx.closePath();ctx.fill();
  ctx.globalAlpha=.22;ctx.strokeStyle='rgba(255,255,255,0.35)';
  ctx.beginPath();ctx.moveTo(0,r*.85);ctx.lineTo(r*.15,r*.25);ctx.lineTo(0,r*.12);ctx.lineTo(-r*.15,r*.25);ctx.closePath();ctx.stroke();
  ctx.globalAlpha=.7;ctx.fillStyle='rgba(255,255,255,0.65)';
  ctx.font='bold '+(r*.44)+'px serif';ctx.textAlign='center';ctx.fillText('N',0,-r-6);
  ctx.globalAlpha=.22;ctx.font=(r*.3)+'px sans-serif';
  ctx.fillText('S',0,r+10);ctx.fillText('E',r+8,3);ctx.fillText('W',-r-8,3);
  ctx.globalAlpha=1;ctx.fillStyle='rgba(255,255,255,0.4)';
  ctx.beginPath();ctx.arc(0,0,2.5,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

// ── PHASES ──
// Scale ~2.8  → zoom 4  (Asia Tenggara)
// Scale ~6.5  → zoom 5  (Indonesia)
// Scale ~18   → zoom 6  (Kalimantan)
// Scale ~60   → zoom 8  (Kalimantan Selatan)
// Scale ~180  → zoom 10 (area Banjarbaru)
// Scale ~380  → zoom 12 (kota Banjarbaru)
// Scale ~650  → zoom 13 (detail kota)
const phases=[
  {cx:118, cy:-2,      scale:2.8,  dur:2000},
  {cx:117, cy:-3,      scale:6.5,  dur:2500},
  {cx:115, cy:-2,      scale:18,   dur:2500},
  {cx:BJ.lon,cy:BJ.lat,scale:60,   dur:2200},
  {cx:BJ.lon,cy:BJ.lat,scale:200,  dur:2000},
  {cx:BJ.lon,cy:BJ.lat,scale:650,  dur:99999}
];

let t0=null;
// Ease in-out cubic
const ease=t=>t<.5?4*t*t*t:(t-1)*(2*t-2)*(2*t-2)+1;

function getState(now){
  if(!t0)t0=now;
  const el=now-t0;
  let acc=0;
  for(let i=0;i<phases.length;i++){
    const p=phases[Math.max(0,i-1)],c=phases[i];
    if(el<acc+c.dur){
      const e=ease(Math.min((el-acc)/c.dur,1));
      return{cx:p.cx+(c.cx-p.cx)*e,cy:p.cy+(c.cy-p.cy)*e,scale:p.scale+(c.scale-p.scale)*e,ph:i,pt:(el-acc)/c.dur};
    }
    acc+=c.dur;
  }
  return{cx:BJ.lon,cy:BJ.lat,scale:650,ph:5,pt:1};
}

// ── DRAW LOOP ──
function draw(now){
  const W=canvas.width,H=canvas.height;
  if(!W||!H){requestAnimationFrame(draw);return;}
  const s=getState(now);

  // Background
  ctx.fillStyle='#0d1f0d';
  ctx.fillRect(0,0,W,H);

  // Citra satelit
  ctx.save();
  drawTiles(s,W,H);
  ctx.restore();

  // Overlay tipis hanya di bawah
  const ov=ctx.createLinearGradient(0,0,0,H);
  ov.addColorStop(0,  'rgba(0,0,0,0.0)');
  ov.addColorStop(0.5,'rgba(0,0,0,0.0)');
  ov.addColorStop(0.75,'rgba(0,0,0,0.25)');
  ov.addColorStop(1,  'rgba(0,0,0,0.60)');
  ctx.fillStyle=ov;
  ctx.fillRect(0,0,W,H);

  // Titik Banjarbaru
  const[bx,by]=project(BJ.lon,BJ.lat,s,W,H);
  const pa=s.ph>=3?Math.min(1,s.pt*2):0;
  if(pa>0){
    const pulse=0.5+0.5*Math.sin(now*.003);
    ctx.save();
    ctx.globalAlpha=pa*.15*pulse;
    ctx.strokeStyle='#FF2222';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(bx,by,16,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(bx,by,28,0,Math.PI*2);ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha=pa;
    ctx.fillStyle='#CC0000';
    ctx.beginPath();ctx.arc(bx,by,6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#FFFFFF';
    ctx.beginPath();ctx.arc(bx,by,2.5,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  drawCompass(W-46,H-50,22);
  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
})();
