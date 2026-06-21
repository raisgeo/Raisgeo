(function(){
function toggleTheme(){
  const html=document.documentElement;
  html.classList.toggle('dark');
  localStorage.setItem('rg',html.classList.contains('dark')?'dark':'light');
}
window.toggleTheme=toggleTheme;
if(localStorage.getItem('rg')==='dark')document.documentElement.classList.add('dark');

const canvas=document.getElementById('map');
if(!canvas)return;
const ctx=canvas.getContext('2d');
function resize(){canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight}
resize();window.addEventListener('resize',resize);

const BJ={lon:114.75,lat:-3.426};
const lands=[
  [[0,71],[20,72],[40,68],[60,65],[80,55],[100,50],[120,42],[135,38],[140,30],[130,22],[120,18],[110,12],[105,5],[100,2],[103,-4],[108,-6],[110,-2],[115,3],[120,8],[128,18],[135,25],[138,38],[140,42],[145,44],[150,42],[155,38],[160,45],[162,52],[166,56],[168,60],[160,62],[150,58],[140,55],[130,48],[120,38],[110,36],[100,26],[90,26],[80,28],[65,26],[55,20],[45,15],[35,12],[25,15],[15,18],[5,20],[0,22],[-5,35],[-8,44],[-5,55],[0,56],[5,58],[8,60],[4,64],[0,70]],
  [[-8,14],[-14,10],[-15,4],[-10,-2],[-5,-10],[0,-16],[10,-26],[20,-35],[28,-36],[34,-30],[38,-20],[42,-12],[44,-2],[46,5],[48,12],[44,12],[38,16],[30,22],[25,32],[20,38],[14,40],[8,40],[2,36],[-5,24],[-8,14]],
  [[-52,48],[-58,46],[-65,42],[-72,40],[-78,36],[-82,30],[-86,20],[-88,16],[-84,10],[-78,8],[-72,12],[-68,24],[-72,36],[-76,44],[-82,46],[-88,50],[-96,50],[-102,48],[-108,50],[-114,52],[-120,58],[-126,62],[-132,56],[-138,58],[-144,60],[-150,60],[-156,58],[-162,54],[-166,60],[-170,63],[-164,68],[-155,70],[-140,68],[-128,65],[-118,62],[-108,58],[-96,52],[-86,48],[-76,46],[-64,48],[-52,48]],
  [[-34,-4],[-38,-10],[-42,-16],[-44,-24],[-48,-32],[-52,-40],[-56,-44],[-60,-46],[-64,-42],[-68,-38],[-70,-32],[-72,-24],[-72,-16],[-70,-8],[-66,2],[-62,6],[-58,8],[-54,6],[-50,2],[-46,-2],[-42,-4],[-38,-4],[-34,-4]],
  [[114,22],[120,28],[126,34],[130,42],[132,46],[128,50],[122,52],[116,52],[114,48],[116,42],[114,38],[110,34],[112,28],[114,22]],
  [[130,-12],[134,-16],[138,-20],[142,-24],[146,-28],[148,-32],[148,-36],[144,-38],[140,-36],[136,-32],[132,-26],[128,-20],[128,-14],[130,-12]],
];
const sumatra=[[95,6],[98,4],[100,2],[102,0],[104,-2],[105,-4],[105,-6],[104,-5],[102,-4],[100,-2],[98,0],[96,2],[95,4],[95,6]];
const jawa=[[106,-6],[108,-6.5],[110,-7],[112,-7.5],[114,-7.8],[115,-8.2],[114,-8.5],[112,-8.3],[110,-7.8],[108,-7.2],[106,-6.8],[106,-6]];
const kal=[[108,-3.8],[109.5,-3],[111,-2],[112.5,-1.5],[114,-1],[115,-0.5],[116.5,-0.8],[117.5,-1.8],[118,-2.8],[117.5,-3.8],[117,-4.5],[116,-5.2],[115,-5.6],[114,-5.4],[113,-5],[112,-4.5],[110.5,-4],[109,-3.8],[108,-3.8]];

function xy(lon,lat,s,W,H){
  const ox=(s.cx+180)/360*W,oy=(90-s.cy)/180*H;
  return[(((lon+180)/360*W)-ox)*s.scale+W/2,((((90-lat)/180*H))-oy)*s.scale+H/2];
}
function poly(pts,s,W,H,f,st,lw){
  ctx.beginPath();
  const[x0,y0]=xy(pts[0][0],pts[0][1],s,W,H);ctx.moveTo(x0,y0);
  pts.slice(1).forEach(p=>{const[x,y]=xy(p[0],p[1],s,W,H);ctx.lineTo(x,y);});
  ctx.closePath();
  if(f){ctx.fillStyle=f;ctx.fill();}
  if(st){ctx.strokeStyle=st;ctx.lineWidth=lw||0.5;ctx.stroke();}
}
function grid(s,W,H,dk){
  ctx.strokeStyle=dk?'rgba(180,120,30,0.1)':'rgba(80,60,20,0.07)';
  ctx.lineWidth=0.4;ctx.setLineDash([2,8]);
  for(let l=-180;l<=180;l+=15){ctx.beginPath();const[x]=xy(l,90,s,W,H);ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let l=-90;l<=90;l+=15){ctx.beginPath();const[,y]=xy(-180,l,s,W,H);ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  ctx.setLineDash([]);
}
function compass(x,y,r,dk){
  const c=dk?'rgba(200,146,26,0.5)':'rgba(139,94,26,0.4)';
  const cf=dk?'rgba(200,146,26,0.7)':'rgba(139,94,26,0.6)';
  ctx.save();ctx.translate(x,y);
  ctx.strokeStyle=c;ctx.lineWidth=0.5;
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([1,5]);ctx.beginPath();ctx.arc(0,0,r*.65,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=cf;
  ctx.beginPath();ctx.moveTo(0,-r*.85);ctx.lineTo(r*.15,-r*.25);ctx.lineTo(0,-r*.12);ctx.lineTo(-r*.15,-r*.25);ctx.closePath();ctx.fill();
  ctx.globalAlpha=.35;ctx.strokeStyle=c;
  ctx.beginPath();ctx.moveTo(0,r*.85);ctx.lineTo(r*.15,r*.25);ctx.lineTo(0,r*.12);ctx.lineTo(-r*.15,r*.25);ctx.closePath();ctx.stroke();
  ctx.globalAlpha=.7;ctx.fillStyle=cf;
  ctx.font='bold '+(r*.42)+'px serif';ctx.textAlign='center';ctx.fillText('N',0,-r-5);
  ctx.globalAlpha=.3;ctx.font=(r*.3)+'px sans-serif';
  ctx.fillText('S',0,r+9);ctx.fillText('E',r+7,3);ctx.fillText('W',-r-7,3);
  ctx.globalAlpha=1;ctx.fillStyle=cf;
  ctx.beginPath();ctx.arc(0,0,2.5,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

const phases=[
  {cx:20,cy:10,scale:0.85,dur:1400},
  {cx:118,cy:-2,scale:5,dur:1800},
  {cx:114,cy:-2.5,scale:18,dur:1600},
  {cx:BJ.lon,cy:BJ.lat,scale:48,dur:99999},
];
let t0=null;
const ease=t=>t<.5?2*t*t:-1+(4-2*t)*t;
function state(now){
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
  return{cx:BJ.lon,cy:BJ.lat,scale:48,ph:3,pt:1};
}

function draw(now){
  const W=canvas.width,H=canvas.height;
  if(!W||!H){requestAnimationFrame(draw);return;}
  const dk=document.documentElement.classList.contains('dark');
  const s=state(now);

  const g=ctx.createLinearGradient(0,0,0,H);
  if(dk){g.addColorStop(0,'#1C1206');g.addColorStop(1,'#100E08');}
  else{g.addColorStop(0,'#D8ECFF');g.addColorStop(1,'#EEF5FF');}
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle=dk?'rgba(28,14,4,0.5)':'rgba(185,215,245,0.25)';
  ctx.fillRect(0,0,W,H);

  grid(s,W,H,dk);

  const fl=dk?'rgba(58,38,16,0.72)':'rgba(165,195,138,0.62)';
  const sl=dk?'rgba(82,58,26,0.45)':'rgba(108,138,84,0.42)';
  lands.forEach(l=>poly(l,s,W,H,fl,sl,0.5));

  const fi=dk?'rgba(72,50,20,0.88)':'rgba(145,180,112,0.72)';
  const si=dk?'rgba(102,72,28,0.55)':'rgba(88,122,64,0.52)';
  poly(sumatra,s,W,H,fi,si,0.6);
  poly(jawa,s,W,H,fi,si,0.6);

  poly(kal,s,W,H,dk?'rgba(92,64,24,0.96)':'rgba(128,170,98,0.82)',dk?'rgba(142,98,36,0.65)':'rgba(72,112,48,0.62)',0.8);

  const[bx,by]=xy(BJ.lon,BJ.lat,s,W,H);
  const pa=s.ph>=2?Math.min(1,s.pt*2.5):0;
  if(pa>0){
    const pulse=0.5+0.5*Math.sin(now*.003);
    ctx.save();
    ctx.globalAlpha=pa*.15*pulse;
    ctx.strokeStyle=dk?'#C8921A':'#8B5E1A';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(bx,by,14,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(bx,by,22,0,Math.PI*2);ctx.stroke();
    ctx.restore();
    ctx.save();ctx.globalAlpha=pa;
    ctx.fillStyle=dk?'#C8921A':'#8B5E1A';
    ctx.beginPath();ctx.arc(bx,by,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=dk?'#100E08':'#F7F8FC';
    ctx.beginPath();ctx.arc(bx,by,2.5,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  compass(W-46,H-52,24,dk);

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
requestAnimationFrame(draw);
})();