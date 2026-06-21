(function(){

// DARK MODE TOGGLE
function initTheme(){
  const saved = localStorage.getItem('theme');
  if(saved === 'dark') document.body.classList.add('dark-mode');
}

function toggleTheme(){
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

// Inject toggle button ke nav
function injectToggle(){
  const nav = document.querySelector('.nav');
  if(!nav) return;
  const btn = document.createElement('button');
  btn.id = 'theme-toggle';
  btn.setAttribute('aria-label','Toggle dark mode');
  btn.onclick = toggleTheme;
  nav.appendChild(btn);
}

// MAP CANVAS
function initMap(){
  const hero = document.querySelector('.home-info');
  if(!hero) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'hero-map';
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity 1.2s';
  hero.style.position = 'relative';
  hero.insertBefore(canvas, hero.firstChild);

  const ctx = canvas.getContext('2d');
  function resize(){
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight || 400;
  }
  resize();
  window.addEventListener('resize', resize);

  const BJ = {lon:114.75, lat:-3.426};

  const continents=[
    [[0,71],[20,72],[40,68],[60,65],[80,55],[100,50],[120,42],[135,38],[140,30],[130,22],[120,18],[110,12],[105,5],[100,2],[103,-4],[108,-6],[110,-2],[115,3],[120,8],[128,18],[135,25],[138,38],[140,42],[145,44],[150,42],[155,38],[160,45],[162,52],[166,56],[168,60],[160,62],[150,58],[140,55],[130,48],[120,38],[110,36],[100,26],[90,26],[80,28],[65,26],[55,20],[45,15],[35,12],[25,15],[15,18],[5,20],[0,22],[-5,35],[-8,44],[-5,55],[0,56],[5,58],[8,60],[4,64],[0,70]],
    [[-8,14],[-14,10],[-15,4],[-10,-2],[-5,-10],[0,-16],[10,-26],[20,-35],[28,-36],[34,-30],[38,-20],[42,-12],[44,-2],[46,5],[48,12],[44,12],[38,16],[30,22],[25,32],[20,38],[14,40],[8,40],[2,36],[-5,24],[-8,14]],
    [[-52,48],[-58,46],[-65,42],[-72,40],[-78,36],[-82,30],[-86,20],[-88,16],[-84,10],[-78,8],[-72,12],[-68,24],[-72,36],[-76,44],[-82,46],[-88,50],[-96,50],[-102,48],[-108,50],[-114,52],[-120,58],[-126,62],[-132,56],[-138,58],[-144,60],[-150,60],[-156,58],[-162,54],[-166,60],[-170,63],[-164,68],[-155,70],[-140,68],[-128,65],[-118,62],[-108,58],[-96,52],[-86,48],[-76,46],[-64,48],[-52,48]],
    [[-34,-4],[-38,-10],[-42,-16],[-44,-24],[-48,-32],[-52,-40],[-56,-44],[-60,-46],[-64,-42],[-68,-38],[-70,-32],[-72,-24],[-72,-16],[-70,-8],[-66,2],[-62,6],[-58,8],[-54,6],[-50,2],[-46,-2],[-42,-4],[-38,-4],[-34,-4]],
    [[114,22],[120,28],[126,34],[130,42],[132,46],[128,50],[122,52],[116,52],[114,48],[116,42],[114,38],[110,34],[112,28],[114,22]],
    [[130,-12],[134,-16],[138,-20],[142,-24],[146,-28],[148,-32],[148,-36],[144,-38],[140,-36],[136,-32],[132,-26],[128,-20],[128,-14],[130,-12]],
  ];
  const sumatera=[[95,6],[98,4],[100,2],[102,0],[104,-2],[105,-4],[105,-6],[104,-5],[102,-4],[100,-2],[98,0],[96,2],[95,4],[95,6]];
  const jawa=[[106,-6],[108,-6.5],[110,-7],[112,-7.5],[114,-7.8],[115,-8.2],[114,-8.5],[112,-8.3],[110,-7.8],[108,-7.2],[106,-6.8],[106,-6]];
  const kalimantan=[[108,-3.8],[109.5,-3],[111,-2],[112.5,-1.5],[114,-1],[115,-0.5],[116.5,-0.8],[117.5,-1.8],[118,-2.8],[117.5,-3.8],[117,-4.5],[116,-5.2],[115,-5.6],[114,-5.4],[113,-5],[112,-4.5],[110.5,-4],[109,-3.8],[108,-3.8]];

  function toXY(lon,lat,st,W,H){
    const ox=(st.cx+180)/360*W, oy=(90-st.cy)/180*H;
    const px=(lon+180)/360*W, py=(90-lat)/180*H;
    return [(px-ox)*st.scale+W/2,(py-oy)*st.scale+H/2];
  }

  function drawPoly(pts,st,W,H,fill,stroke,lw){
    if(!pts||pts.length<2)return;
    ctx.beginPath();
    const[x0,y0]=toXY(pts[0][0],pts[0][1],st,W,H);
    ctx.moveTo(x0,y0);
    pts.slice(1).forEach(p=>{const[x,y]=toXY(p[0],p[1],st,W,H);ctx.lineTo(x,y);});
    ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill();}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||0.5;ctx.stroke();}
  }

  function drawGrid(st,W,H,dark){
    ctx.strokeStyle=dark?'rgba(180,120,30,0.1)':'rgba(80,60,20,0.08)';
    ctx.lineWidth=0.4;ctx.setLineDash([2,8]);
    for(let lon=-180;lon<=180;lon+=15){
      ctx.beginPath();const[x]=toXY(lon,90,st,W,H);
      ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
    }
    for(let lat=-90;lat<=90;lat+=15){
      ctx.beginPath();const[,y]=toXY(-180,lat,st,W,H);
      ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function drawCompass(x,y,r,dark){
    const ac=dark?'rgba(200,146,26,0.55)':'rgba(139,94,26,0.45)';
    ctx.save();ctx.translate(x,y);
    ctx.strokeStyle=ac;ctx.lineWidth=0.5;
    ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([1,5]);ctx.beginPath();ctx.arc(0,0,r*.65,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=dark?'rgba(200,146,26,0.75)':'rgba(139,94,26,0.65)';
    ctx.beginPath();ctx.moveTo(0,-r*.85);ctx.lineTo(r*.15,-r*.25);ctx.lineTo(0,-r*.1);ctx.lineTo(-r*.15,-r*.25);ctx.closePath();ctx.fill();
    ctx.globalAlpha=.4;ctx.strokeStyle=ac;
    ctx.beginPath();ctx.moveTo(0,r*.85);ctx.lineTo(r*.15,r*.25);ctx.lineTo(0,r*.1);ctx.lineTo(-r*.15,r*.25);ctx.closePath();ctx.stroke();
    ctx.globalAlpha=.75;ctx.fillStyle=dark?'rgba(200,146,26,0.85)':'rgba(139,94,26,0.75)';
    ctx.font='bold '+(r*.42)+'px serif';ctx.textAlign='center';
    ctx.fillText('N',0,-r-5);
    ctx.globalAlpha=.35;ctx.font=(r*.32)+'px sans-serif';
    ctx.fillText('S',0,r+9);ctx.fillText('E',r+7,4);ctx.fillText('W',-r-7,4);
    ctx.globalAlpha=1;ctx.fillStyle=dark?'rgba(200,146,26,0.75)':'rgba(139,94,26,0.65)';
    ctx.beginPath();ctx.arc(0,0,2.5,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  const phases=[
    {cx:20,cy:10,scale:0.9,dur:1500},
    {cx:118,cy:-2,scale:5,dur:2000},
    {cx:114,cy:-2.5,scale:18,dur:1800},
    {cx:BJ.lon,cy:BJ.lat,scale:48,dur:99999},
  ];
  let t0=null;
  function ease(t){return t<.5?2*t*t:-1+(4-2*t)*t}
  function getState(now){
    if(!t0)t0=now;
    const el=now-t0;let acc=0;
    for(let i=0;i<phases.length;i++){
      const prev=phases[Math.max(0,i-1)],cur=phases[i];
      if(el<acc+cur.dur){
        const e=ease(Math.min((el-acc)/cur.dur,1));
        return{cx:prev.cx+(cur.cx-prev.cx)*e,cy:prev.cy+(cur.cy-prev.cy)*e,scale:prev.scale+(cur.scale-prev.scale)*e,phase:i,pt:(el-acc)/cur.dur};
      }
      acc+=cur.dur;
    }
    return{cx:BJ.lon,cy:BJ.lat,scale:48,phase:3,pt:1};
  }

  function render(now){
    const W=canvas.width,H=canvas.height;
    if(!W||!H){requestAnimationFrame(render);return;}
    const dark=document.body.classList.contains('dark-mode');
    const st=getState(now);

    const g=ctx.createLinearGradient(0,0,0,H);
    if(dark){g.addColorStop(0,'#1A1008');g.addColorStop(1,'#100E08');}
    else{g.addColorStop(0,'#DFF0FF');g.addColorStop(1,'#F0F6FF');}
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.fillStyle=dark?'rgba(30,18,6,0.6)':'rgba(190,218,245,0.3)';
    ctx.fillRect(0,0,W,H);

    drawGrid(st,W,H,dark);

    const fl=dark?'rgba(55,38,18,0.7)':'rgba(168,196,140,0.6)';
    const sl=dark?'rgba(80,58,28,0.45)':'rgba(110,140,85,0.4)';
    continents.forEach(c=>drawPoly(c,st,W,H,fl,sl,0.5));

    const fi=dark?'rgba(70,48,20,0.85)':'rgba(148,182,115,0.7)';
    const si=dark?'rgba(100,72,30,0.55)':'rgba(90,125,65,0.5)';
    drawPoly(sumatera,st,W,H,fi,si,0.6);
    drawPoly(jawa,st,W,H,fi,si,0.6);

    const fk=dark?'rgba(90,62,24,0.95)':'rgba(132,172,100,0.8)';
    const sk=dark?'rgba(140,96,36,0.65)':'rgba(75,115,50,0.6)';
    drawPoly(kalimantan,st,W,H,fk,sk,0.8);

    const[bx,by]=toXY(BJ.lon,BJ.lat,st,W,H);
    const pinA=st.phase>=2?Math.min(1,st.pt*2.5):0;
    if(pinA>0){
      const pulse=0.5+0.5*Math.sin(now*0.003);
      ctx.save();ctx.globalAlpha=pinA*0.18*pulse;
      ctx.strokeStyle=dark?'#C8921A':'#8B5E1A';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(bx,by,16,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.arc(bx,by,26,0,Math.PI*2);ctx.stroke();
      ctx.restore();
      ctx.save();ctx.globalAlpha=pinA;
      ctx.fillStyle=dark?'#C8921A':'#8B5E1A';
      ctx.beginPath();ctx.arc(bx,by,5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=dark?'#100E08':'#F7F8FC';
      ctx.beginPath();ctx.arc(bx,by,2.5,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }

    drawCompass(W-50,H-56,26,dark);

    const bc=dark?'rgba(200,146,26,0.4)':'rgba(139,94,26,0.35)';
    ctx.save();ctx.strokeStyle=bc;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(18,H-16);ctx.lineTo(74,H-16);ctx.stroke();
    ctx.beginPath();ctx.moveTo(18,H-20);ctx.lineTo(18,H-12);ctx.stroke();
    ctx.beginPath();ctx.moveTo(74,H-20);ctx.lineTo(74,H-12);ctx.stroke();
    ctx.font='7px sans-serif';ctx.fillStyle=bc;ctx.textAlign='left';
    ctx.fillText('0',15,H-22);ctx.fillText('5000 km',55,H-22);
    ctx.restore();

    ctx.strokeStyle=dark?'rgba(160,110,30,0.18)':'rgba(100,72,20,0.12)';
    ctx.lineWidth=1;ctx.strokeRect(2,2,W-4,H-4);
    ctx.lineWidth=0.4;ctx.strokeRect(6,6,W-12,H-12);

    canvas.style.opacity='1';
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

// INIT
document.addEventListener('DOMContentLoaded',function(){
  initTheme();
  injectToggle();
  initMap();
});

})();