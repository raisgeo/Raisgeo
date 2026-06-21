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

// Koordinat akurat dalam derajat [lon, lat]
// Menggunakan Natural Earth simplified
const world={
  eurasia:[
    [-9,36],[-9,44],[-2,44],[3,47],[8,48],[15,47],[18,55],[24,58],[28,70],[32,70],[38,68],[42,62],[48,68],[55,72],[65,72],[72,68],[78,72],[85,70],[90,72],[98,68],[105,73],[112,73],[120,68],[128,65],[132,68],[138,68],[145,60],[142,52],[136,46],[130,42],[125,38],[122,32],[118,26],[112,22],[106,18],[102,12],[98,6],[95,6],[92,8],[88,22],[82,28],[76,32],[70,36],[64,40],[58,36],[52,36],[46,40],[40,38],[36,36],[32,32],[28,36],[24,38],[18,42],[14,38],[10,38],[6,44],[2,48],[-2,48],[-6,44],[-9,36]
  ],
  africa:[
    [-6,36],[0,36],[6,38],[12,36],[18,32],[24,32],[30,28],[36,22],[42,12],[48,8],[52,-2],[48,-10],[42,-18],[36,-26],[30,-32],[24,-34],[18,-28],[12,-20],[8,-6],[4,6],[0,6],[-4,10],[-8,14],[-12,20],[-14,28],[-12,32],[-6,36]
  ],
  northAmerica:[
    [-168,72],[-140,72],[-120,68],[-100,72],[-80,72],[-68,68],[-56,62],[-56,52],[-62,46],[-68,44],[-72,42],[-76,36],[-80,28],[-84,22],[-88,16],[-84,10],[-78,8],[-72,10],[-68,16],[-72,22],[-76,28],[-80,34],[-76,40],[-70,44],[-64,48],[-58,52],[-52,56],[-56,62],[-64,68],[-72,70],[-80,72],[-96,72],[-112,68],[-120,60],[-132,58],[-140,62],[-148,62],[-156,58],[-162,62],[-168,64],[-168,72]
  ],
  southAmerica:[
    [-68,12],[-62,8],[-52,4],[-48,0],[-44,-4],[-36,-8],[-34,-10],[-38,-16],[-40,-20],[-42,-26],[-46,-30],[-52,-34],[-56,-38],[-60,-42],[-64,-46],[-68,-54],[-72,-50],[-68,-46],[-64,-42],[-60,-38],[-56,-34],[-52,-28],[-48,-22],[-44,-16],[-40,-10],[-38,-6],[-42,0],[-48,2],[-54,4],[-60,8],[-64,10],[-68,12]
  ],
  australia:[
    [114,-22],[120,-18],[126,-14],[132,-12],[138,-12],[144,-16],[148,-20],[152,-24],[152,-28],[148,-32],[144,-36],[140,-38],[136,-36],[130,-32],[124,-26],[118,-22],[114,-22]
  ],
  greenland:[
    [-44,82],[-20,84],[8,82],[16,76],[10,70],[4,64],[-18,62],[-36,66],[-44,70],[-52,68],[-56,74],[-52,80],[-44,82]
  ]
};

// Indonesia detail
const indonesia={
  sumatra:[[95,5.5],[98,4],[100,2],[102,0.5],[104,-1],[106,-3],[106,-5],[105,-5.5],[104,-5],[102,-4],[100,-2.5],[98,-0.5],[96,2],[95,4],[95,5.5]],
  jawa:[[105.8,-5.8],[107,-6.2],[109,-6.8],[111,-7.2],[113,-7.6],[115,-8],[115.5,-8.4],[114,-8.5],[112,-8.2],[110,-7.8],[108,-7.2],[106,-6.6],[105.8,-5.8]],
  kalimantan:[[108,-3.5],[109,-2.5],[110.5,-1.8],[112,-1.2],[113.5,-0.8],[115,-0.5],[116.5,-1],[117.5,-2],[118,-3],[117.5,-4],[117,-5],[116,-5.5],[115,-5.8],[114,-5.5],[113,-5],[111.5,-4.2],[110,-3.8],[109,-3.5],[108,-3.5]],
  sulawesi:[[120,-0.5],[122,0],[124,1],[125,2],[124,2],[122,0],[124,-1],[126,-3],[126,-4],[124,-4],[122,-4],[120,-3],[118,-2],[118,-1],[120,-0.5]],
  papua:[[131,-2],[134,-2],[136,-4],[138,-6],[140,-8],[141,-6],[140,-4],[138,-2],[136,-2],[134,-4],[132,-4],[130,-3],[131,-2]]
};

const BJ={lon:114.75,lat:-3.426};

function project(lon,lat,s,W,H){
  const ox=(s.cx+180)/360*W,oy=(90-s.cy)/180*H;
  const px=(lon+180)/360*W,py=(90-lat)/180*H;
  return[(px-ox)*s.scale+W/2,(py-oy)*s.scale+H/2];
}

function drawShape(pts,s,W,H,fill,stroke,lw){
  if(!pts||pts.length<3)return;
  ctx.beginPath();
  const[x0,y0]=project(pts[0][0],pts[0][1],s,W,H);
  ctx.moveTo(x0,y0);
  for(let i=1;i<pts.length;i++){
    const[x,y]=project(pts[i][0],pts[i][1],s,W,H);
    ctx.lineTo(x,y);
  }
  ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}
}

function drawGrid(s,W,H,dk){
  ctx.strokeStyle=dk?'rgba(200,146,26,0.08)':'rgba(80,60,20,0.06)';
  ctx.lineWidth=0.4;ctx.setLineDash([2,8]);
  for(let lon=-180;lon<=180;lon+=15){
    const[x]=project(lon,0,s,W,H);
    ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
  }
  for(let lat=-90;lat<=90;lat+=15){
    const[,y]=project(0,lat,s,W,H);
    ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
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

const phases=[
  {cx:20,cy:10,scale:0.85,dur:1400},
  {cx:118,cy:-3,scale:4.5,dur:1800},
  {cx:115,cy:-3,scale:16,dur:1600},
  {cx:BJ.lon,cy:BJ.lat,scale:45,dur:99999},
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
  return{cx:BJ.lon,cy:BJ.lat,scale:45,ph:3,pt:1};
}

function draw(now){
  const W=canvas.width,H=canvas.height;
  if(!W||!H){requestAnimationFrame(draw);return;}
  const dk=document.documentElement.classList.contains('dark');
  const s=getState(now);

  // Background
  const g=ctx.createLinearGradient(0,0,0,H);
  if(dk){g.addColorStop(0,'#1C1005');g.addColorStop(1,'#100E08');}
  else{g.addColorStop(0,'#D5EAFF');g.addColorStop(1,'#EBF4FF');}
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle=dk?'rgba(20,10,2,0.4)':'rgba(180,212,242,0.22)';
  ctx.fillRect(0,0,W,H);

  drawGrid(s,W,H,dk);

  // Kontinen
  const lf=dk?'rgba(60,40,14,0.75)':'rgba(168,198,138,0.65)';
  const ls=dk?'rgba(90,62,22,0.4)':'rgba(108,140,82,0.4)';
  Object.values(world).forEach(pts=>drawShape(pts,s,W,H,lf,ls,0.5));

  // Indonesia
  const id_f=dk?'rgba(80,54,18,0.9)':'rgba(148,182,110,0.75)';
  const id_s=dk?'rgba(110,76,28,0.55)':'rgba(88,124,62,0.55)';
  drawShape(indonesia.sumatra,s,W,H,id_f,id_s,0.7);
  drawShape(indonesia.jawa,s,W,H,id_f,id_s,0.7);
  drawShape(indonesia.sulawesi,s,W,H,id_f,id_s,0.7);
  drawShape(indonesia.papua,s,W,H,id_f,id_s,0.7);

  // Kalimantan highlight
  drawShape(indonesia.kalimantan,s,W,H,
    dk?'rgba(100,68,22,0.98)':'rgba(128,172,96,0.85)',
    dk?'rgba(160,108,38,0.7)':'rgba(68,112,46,0.65)',
    0.9
  );

  // Pin Banjarbaru
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

  // Scale bar
  const bc=dk?'rgba(200,146,26,0.38)':'rgba(139,94,26,0.32)';
  ctx.save();ctx.strokeStyle=bc;ctx.lineWidth=0.8;
  ctx.beginPath();ctx.moveTo(16,H-14);ctx.lineTo(68,H-14);ctx.stroke();
  ctx.beginPath();ctx.moveTo(16,H-18);ctx.lineTo(16,H-10);ctx.stroke();
  ctx.beginPath();ctx.moveTo(68,H-18);ctx.lineTo(68,H-10);ctx.stroke();
  ctx.font='7px sans-serif';ctx.fillStyle=bc;ctx.textAlign='left';
  ctx.fillText('0',13,H-20);ctx.fillText('5000 km',50,H-20);
  ctx.restore();

  // Frame
  ctx.strokeStyle=dk?'rgba(160,110,30,0.15)':'rgba(100,72,20,0.1)';
  ctx.lineWidth=0.8;ctx.strokeRect(2,2,W-4,H-4);
  ctx.lineWidth=0.3;ctx.strokeRect(5,5,W-10,H-10);

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
})();