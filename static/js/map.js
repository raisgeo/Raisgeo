(function(){
function toggleTheme(){
  const h=document.documentElement;
  h.classList.toggle('dark');
  localStorage.setItem('rg',h.classList.contains('dark')?'dark':'light');
}
window.toggleTheme=toggleTheme;
if(localStorage.getItem('rg')==='dark')document.documentElement.classList.add('dark');

const canvas=document.getElementById('map');
if(!canvas)return;
const ctx=canvas.getContext('2d');
function resize(){canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight||420}
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

let worldData=null;

function drawGrid(s,W,H,dk){
  ctx.strokeStyle=dk?'rgba(200,146,26,0.07)':'rgba(100,80,50,0.07)';
  ctx.lineWidth=0.4;ctx.setLineDash([2,8]);
  for(let lon=-180;lon<=180;lon+=15){
    ctx.beginPath();
    const[x]=project(lon,0,s,W,H);
    ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
  }
  for(let lat=-60;lat<=75;lat+=15){
    ctx.beginPath();
    const[,y]=project(0,lat,s,W,H);
    ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawCompass(x,y,r,dk){
  const c=dk?'rgba(200,146,26,0.5)':'rgba(139,94,26,0.4)';
  const cf=dk?'rgba(200,146,26,0.75)':'rgba(139,94,26,0.65)';
  ctx.save();ctx.translate(x,y);
  ctx.strokeStyle=c;ctx.lineWidth=0.5;
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([1,5]);ctx.beginPath();ctx.arc(0,0,r*.65,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=cf;
  ctx.beginPath();ctx.moveTo(0,-r*.85);ctx.lineTo(r*.15,-r*.25);ctx.lineTo(0,-r*.12);ctx.lineTo(-r*.15,-r*.25);ctx.closePath();ctx.fill();
  ctx.globalAlpha=.35;ctx.strokeStyle=c;
  ctx.beginPath();ctx.moveTo(0,r*.85);ctx.lineTo(r*.15,r*.25);ctx.lineTo(0,r*.12);ctx.lineTo(-r*.15,r*.25);ctx.closePath();ctx.stroke();
  ctx.globalAlpha=.8;ctx.fillStyle=cf;
  ctx.font='bold '+(r*.44)+'px serif';ctx.textAlign='center';ctx.fillText('N',0,-r-6);
  ctx.globalAlpha=.3;ctx.font=(r*.3)+'px sans-serif';
  ctx.fillText('S',0,r+10);ctx.fillText('E',r+8,3);ctx.fillText('W',-r-8,3);
  ctx.globalAlpha=1;ctx.fillStyle=cf;
  ctx.beginPath();ctx.arc(0,0,3,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawGeoJSON(data,s,W,H,fill,stroke,lw){
  if(!data)return;
  data.features.forEach(f=>{
    const geom=f.geometry;
    if(!geom)return;
    const polys=geom.type==='Polygon'?[geom.coordinates]:geom.type==='MultiPolygon'?geom.coordinates:[];
    polys.forEach(poly=>{
      poly.forEach(ring=>{
        if(ring.length<3)return;
        ctx.beginPath();
        ring.forEach(([lon,lat],i)=>{
          if(lat>85||lat<-85)return;
          const[x,y]=project(lon,lat,s,W,H);
          i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        });
        ctx.closePath();
        if(fill){ctx.fillStyle=fill;ctx.fill();}
        if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}
      });
    });
  });
}

const phases=[
  {cx:20,cy:20,scale:0.55,dur:1400},
  {cx:118,cy:-3,scale:3.5,dur:1800},
  {cx:115,cy:-3,scale:12,dur:1600},
  {cx:BJ.lon,cy:BJ.lat,scale:35,dur:99999},
];
let t0=null;
const ease=t=>t<.5?2*t*t:-1+(4-2*t)*t;
function getState(now){
  if(!t0)t0=now;
  const el=now-t0;let acc=0;
  for(let i=0;i<phases.length;i++){
    const p=phases[Math.max(0,i-1)],c=phases[i];
    if(el<acc+c.dur){
      const e=ease(Math.min((el-acc)/c.dur,1));
      return{cx:p.cx+(c.cx-p.cx)*e,cy:p.cy+(c.cy-p.cy)*e,scale:p.scale+(c.scale-p.scale)*e,ph:i,pt:(el-acc)/c.dur};
    }
    acc+=c.dur;
  }
  return{cx:BJ.lon,cy:BJ.lat,scale:35,ph:3,pt:1};
}

function draw(now){
  const W=canvas.width,H=canvas.height;
  if(!W||!H){requestAnimationFrame(draw);return;}
  const dk=document.documentElement.classList.contains('dark');
  const s=getState(now);

  // Background ocean - sepia/warm neutral
  const g=ctx.createLinearGradient(0,0,0,H);
  if(dk){g.addColorStop(0,'#1A1208');g.addColorStop(1,'#100E08');}
  else{g.addColorStop(0,'#EBF0F5');g.addColorStop(1,'#F2F5F8');}
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle=dk?'rgba(18,10,2,0.3)':'rgba(200,210,220,0.18)';
  ctx.fillRect(0,0,W,H);

  drawGrid(s,W,H,dk);

  if(worldData){
    // Daratan - warna sepia/pasir, tidak mencolok
    const lf=dk?'rgba(72,55,30,0.7)':'rgba(200,190,170,0.6)';
    const ls=dk?'rgba(95,75,42,0.38)':'rgba(165,150,128,0.45)';
    drawGeoJSON(worldData,s,W,H,lf,ls,0.4);
  }

  if(worldData&&s.ph>=1){
    const kalFeatures={
      type:'FeatureCollection',
      features:worldData.features.filter(f=>
        f.properties&&(
          f.properties.name==='Indonesia'||
          f.properties.NAME==='Indonesia'||
          f.properties.ADMIN==='Indonesia'
        )
      )
    };
    if(kalFeatures.features.length>0){
      // Indonesia - sedikit lebih gelap dari kontinen lain
      drawGeoJSON(kalFeatures,s,W,H,
        dk?'rgba(90,68,35,0.88)':'rgba(182,168,142,0.72)',
        dk?'rgba(120,92,48,0.5)':'rgba(145,128,102,0.5)',
        0.6
      );
    }
  }

  const[bx,by]=project(BJ.lon,BJ.lat,s,W,H);
  const pa=s.ph>=2?Math.min(1,s.pt*2.5):0;
  if(pa>0){
    const pulse=0.5+0.5*Math.sin(now*.003);
    ctx.save();
    ctx.globalAlpha=pa*.15*pulse;
    ctx.strokeStyle=dk?'#C8921A':'#8B5E1A';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(bx,by,12,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(bx,by,20,0,Math.PI*2);ctx.stroke();
    ctx.restore();
    ctx.save();ctx.globalAlpha=pa;
    ctx.fillStyle=dk?'#C8921A':'#8B5E1A';
    ctx.beginPath();ctx.arc(bx,by,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=dk?'#100E08':'#F7F8FC';
    ctx.beginPath();ctx.arc(bx,by,2.5,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  drawCompass(W-46,H-50,24,dk);

  const bc=dk?'rgba(200,146,26,0.38)':'rgba(139,94,26,0.32)';
  ctx.save();ctx.strokeStyle=bc;ctx.lineWidth=0.8;
  ctx.beginPath();ctx.moveTo(16,H-14);ctx.lineTo(68,H-14);ctx.stroke();
  ctx.beginPath();ctx.moveTo(16,H-18);ctx.lineTo(16,H-10);ctx.stroke();
  ctx.beginPath();ctx.moveTo(68,H-18);ctx.lineTo(68,H-10);ctx.stroke();
  ctx.font='7px sans-serif';ctx.fillStyle=bc;ctx.textAlign='left';
  ctx.fillText('0',13,H-20);ctx.fillText('5000 km',50,H-20);
  ctx.restore();

  ctx.strokeStyle=dk?'rgba(160,110,30,0.15)':'rgba(100,72,20,0.1)';
  ctx.lineWidth=0.8;ctx.strokeRect(2,2,W-4,H-4);
  ctx.lineWidth=0.3;ctx.strokeRect(5,5,W-10,H-10);

  requestAnimationFrame(draw);
}

fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
  .then(r=>r.json())
  .then(topo=>{
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js';
    script.onload=()=>{
      worldData={
        type:'FeatureCollection',
        features:topojson.feature(topo,topo.objects.countries).features
      };
    };
    document.head.appendChild(script);
  })
  .catch(()=>{console.log('Map data unavailable')});

requestAnimationFrame(draw);
})();