/* ===================== 翠脆的心・星盤與卡牌 ===================== */
/* ---------- 可以自己改的資料 ---------- */
// 行星：[名稱, 符號, 英文檔名]
const P=[["太陽","☉","sun"],["月亮","☽","moon"],["水星","☿","mercury"],["金星","♀","venus"],["火星","♂","mars"],["木星","♃","jupiter"],["土星","♄","saturn"],["天王星","♅","uranus"],["海王星","♆","neptune"],["冥王星","♇","pluto"]];
// 星座：[名稱, 符號, 英文檔名]
const S=[["牡羊座","♈","aries"],["金牛座","♉","taurus"],["雙子座","♊","gemini"],["巨蟹座","♋","cancer"],["獅子座","♌","leo"],["處女座","♍","virgo"],["天秤座","♎","libra"],["天蠍座","♏","scorpio"],["射手座","♐","sagittarius"],["摩羯座","♑","capricorn"],["水瓶座","♒","aquarius"],["雙魚座","♓","pisces"]];
// 相位：[名稱, 角度, 容許度, 線條顏色, 虛線, 性質關鍵字, 卡片底色]（相位卡圖檔還沒做，先用程式畫）
const ASP=[
 ["合相",0,8,"#b8892b","","融合・強化","#ead9a8"],
 ["六分相",60,4,"#3f7fb4","5 4","機會・合作","#bcd5ea"],
 ["三分相",120,7,"#3f7fb4","","順暢・天賦","#a9cbe4"],
 ["對分相",180,8,"#d2553f","","拉扯・對立・衝突","#e5a796"],
 ["四分相",90,7,"#d2553f","","衝突・行動壓力","#f0beb2"]];
const TW="Asia/Taipei";
__CITIES__

/* ---------- 古典占星表（七顆古典行星：0太陽 1月亮 2水星 3金星 4火星 5木星 6土星） ---------- */
const DOM=[4,3,2,1,0,2,3,4,5,6,6,5];            // 廟主：每個星座的守護星
const EXA=[0,1,-1,5,-1,2,6,-1,-1,4,-1,3];       // 旺主：-1 代表沒有
const TRI=[[0,5,6],[3,1,4],[6,2,5],[3,4,1]];     // 三分性（多羅修斯）：火、土、風、水 → [日間, 夜間, 協同]
const TERMS=[ // 埃及界：[行星, 結束度數]
 [[5,6],[3,12],[2,20],[4,25],[6,30]],[[3,8],[2,14],[5,22],[6,27],[4,30]],[[2,6],[5,12],[3,17],[4,24],[6,30]],
 [[4,7],[3,13],[2,19],[5,26],[6,30]],[[5,6],[3,11],[6,18],[2,24],[4,30]],[[2,7],[3,17],[5,21],[4,28],[6,30]],
 [[6,6],[2,14],[5,21],[3,28],[4,30]],[[4,7],[3,11],[2,19],[5,24],[6,30]],[[5,12],[3,17],[2,21],[6,26],[4,30]],
 [[2,7],[5,14],[3,22],[6,26],[4,30]],[[2,7],[3,13],[5,20],[4,25],[6,30]],[[3,12],[5,16],[2,19],[4,28],[6,30]]];
const FACE=[4,0,3,2,1,6,5];                      // 十度（迦勒底序）：從牡羊座第一個十度的火星開始
const ORB7=[15,12,7,7,7.5,9,9];                  // 利里光體容許度，接納時取兩星一半相加
const PTOL=[0,60,90,120,180];

/* ---------- 以下是程式 ---------- */
const $=id=>document.getElementById(id), V="︎";
const sy=g=>`<span class="sy">${[...g].map(c=>c=="♇"?`<i class="plu" role="img" aria-label="冥王星"></i>`:c+V).join("")}</span>`;
const CN="一二三四五六七八九十".split("").concat(["十一","十二"]);
const msg=(t,ok)=>{$("msg").textContent=t;$("msg").className="msg"+(ok?" ok":"")};
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const SPK=(c="currentColor")=>`<svg viewBox="-2 -2 104 67" aria-hidden="true"><path d="M50 0C58 31 97 28 100 31.5C97 35 58 32 50 63C42 32 3 35 0 31.5C3 28 42 31 50 0Z" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/></svg>`;
let swe=null, ST=null, PAR="n";

/* 地點 */
Object.keys(C).forEach(k=>{const o=document.createElement("option");o.value=k;$("cities").appendChild(o)});
function advSum(){const la=+$("lat").value,lo=+$("lon").value;$("advs").textContent=`（${la>=0?"北緯":"南緯"} ${Math.abs(la)}°・${lo>=0?"東經":"西經"} ${Math.abs(lo)}°・${$("tz").value}）`}
function fill(la,lo,z){$("lat").value=la;$("lon").value=lo;if(z)$("tz").value=z;advSum()}
const tzOf=(la,lo)=>{try{return tzlookup(+la,+lo)}catch(e){return ""}};
let seq=0;
async function setPlace(){
  const raw=$("place").value.trim(); if(!raw)return;
  const k=raw.replace(/臺/g,"台").replace(/[市縣]$/,""), c=C[raw]||C[k], me=++seq;
  if(c){fill(c[0],c[1],c[2]||TW);msg("已帶入「"+raw+"」的經緯度與時區。",1);redo();return}
  msg("查詢「"+raw+"」中…",1);
  try{
    const r=await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=zh-TW&q="+encodeURIComponent(raw));
    const j=await r.json(); if(me!=seq)return;
    if(!j.length){msg("找不到「"+raw+"」。請換個寫法，或在「進階設定」直接填經緯度。");$("adv").open=true;return}
    const la=(+j[0].lat).toFixed(2), lo=(+j[0].lon).toFixed(2), z=tzOf(la,lo);
    fill(la,lo,z); msg("找到：「"+j[0].display_name.slice(0,40)+"」"+(z?"，時區 "+z+"。":"。請在「進階設定」確認時區。"),1);
    if(!z)$("adv").open=true; redo();
  }catch(e){if(me!=seq)return;msg("目前無法查詢「"+raw+"」。請選清單裡的城市，或在「進階設定」直接填經緯度與時區。");$("adv").open=true}
}
$("place").addEventListener("change",setPlace);
if($("srch"))$("srch").onclick=setPlace;
["lat","lon"].forEach(id=>$(id).addEventListener("change",()=>{const z=tzOf($("lat").value,$("lon").value);if(z)$("tz").value=z;advSum()}));
$("tz").addEventListener("change",advSum);advSum();
$("nm").addEventListener("input",()=>{$("who").textContent=$("nm").value.trim()});

/* 時間 */
function tzOff(ts,z){const p=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:z,hourCycle:"h23",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric"}).formatToParts(new Date(ts)).map(x=>[x.type,+x.value]));return Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-Math.floor(ts/1000)*1000}
function toUTC(y,m,d,h,mi,z){const t0=Date.UTC(y,m-1,d,h,mi);let u=t0-tzOff(t0,z);u=t0-tzOff(u,z);return new Date(u)}
const fmt=l=>{l=((l%360)+360)%360;const s=Math.floor(l/30),d=l-s*30;let D=Math.floor(d),M=Math.round((d-D)*60);if(M==60){M=0;D++}return {s,d:D,t:D+"°"+String(M).padStart(2,"0")+"′"}};
const houseOf=(l,cu)=>{for(let i=1;i<=12;i++){const a=cu[i],b=cu[i%12+1];if(((l-a+720)%360)<((b-a+720)%360))return i}return 1};
const sep=(a,b)=>{const x=Math.abs(((a-b)%360+540)%360-180);return x};

function compute(){
  try{
    const [y,m,d]=$("date").value.split("-").map(Number),[hh,mi]=$("time").value.split(":").map(Number);
    const lat=+$("lat").value,lon=+$("lon").value,z=$("tz").value.trim();
    if(!y||isNaN(hh))throw "請填好出生日期與時間。";
    if(y<1800||y>2400)throw "目前只能計算 1800–2400 年。";
    let u;try{u=toUTC(y,m,d,hh,mi,z)}catch(e){$("adv").open=true;throw "時區「"+z+"」無法辨識，請從清單選一個（例如 Asia/Taipei）。"}
    const jd=swe.julday(u.getUTCFullYear(),u.getUTCMonth()+1,u.getUTCDate(),u.getUTCHours()+u.getUTCMinutes()/60);
    const F=swe.SEFLG_SWIEPH|swe.SEFLG_SPEED;
    const pl=P.map((p,i)=>{const r=swe.calc_ut(jd,i,F);return {i,lon:r[0],sp:r[3],rx:r[3]<0}});
    const h=swe.houses(jd,lat,lon,$("hs").value),cu=Array.from(h.cusps);
    pl.forEach(p=>p.h=houseOf(p.lon,cu));
    const as=[];
    for(let a=0;a<pl.length;a++)for(let b=a+1;b<pl.length;b++){
      const x=((pl[a].lon-pl[b].lon+540)%360)-180,s2=Math.abs(x),ds=Math.sign(x)*(pl[a].sp-pl[b].sp);
      ASP.forEach((A,k)=>{const o=s2-A[1];if(Math.abs(o)<=A[2])as.push({a,b,k,o:Math.abs(o),ap:o*ds<0})});
    }
    ST={pl,cu,as,asc:h.ascmc[0],mc:h.ascmc[1],sel:ST?ST.sel:0,
      info:`${y}/${m}/${d} ${String(hh).padStart(2,"0")}:${String(mi).padStart(2,"0")}・${$("place").value}（世界時 ${u.toISOString().slice(0,16).replace("T"," ")}）`};
    msg(ST.info,1);render();
  }catch(e){msg(typeof e=="string"?e:"計算失敗："+(e.message||e))}
}
function render(){draw();table();grid();classical();cards();aspects();sizeMV();if(typeof DC!=="undefined"&&DC)DC.top();if(typeof mbarR=="function")mbarR()}
/* 直式畫面：切換區高度＝星盤與先天尊貴表較高者 */
const VMQ=matchMedia("(max-width:1023px)");
function sizeMV(){const mv=$("mview");if(!mv||!mv.offsetParent||!mv.clientWidth)return;if(!VMQ.matches){mv.style.height="";return}
  const W=mv.clientWidth,svg=$("wheel").querySelector("svg");let hw=W;
  if(svg){const vb=svg.getAttribute("viewBox").split(" ").map(Number),w=Math.min(W-4,600);hw=w*vb[3]/vb[2]+12}
  const pc=$("parC"),prev=pc.getAttribute("style")||"";pc.style.setProperty("display","block","important");pc.style.setProperty("visibility","hidden");
  const top=pc.getBoundingClientRect().top,bot=pc.querySelector(".tscroll").getBoundingClientRect().bottom;const hd=bot-top+16;
  pc.setAttribute("style",prev);mv.style.height=Math.ceil(Math.max(hw,hd))+"px"}
addEventListener("resize",()=>{if(ST)sizeMV()});
/* 引導：指標點按動畫＋文字，點任一顆行星後消失 */
const HANDP="M9 11.24V7.5a2.5 2.5 0 015 0v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z";
function hintSVG(x,y){const dx=300-x,dy=300-y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,rot=Math.atan2(-uy,-ux)*180/Math.PI+90,
  hx=x+ux*15,hy=y+uy*15,dd=62+Math.abs(ux)*78+Math.abs(uy)*20,bx=x+ux*dd,by=y+uy*dd;
  return `<g class="hint2" aria-hidden="true"><circle class="rip" cx="${x}" cy="${y}" r="21"/><circle class="rip r2" cx="${x}" cy="${y}" r="21"/>`+
  `<g transform="translate(${hx} ${hy}) rotate(${rot})"><g class="hd"><path d="${HANDP}" transform="scale(1.9) translate(-11.5 -3)" fill="#fff" stroke="#2b2b2b" stroke-width=".9" stroke-linejoin="round"/></g></g>`+
  `<g class="bub" transform="translate(${bx} ${by})"><rect x="-76" y="-18" width="152" height="36" rx="18"/><text y="1" text-anchor="middle" dominant-baseline="central">點行星，看卡牌</text></g></g>`}
const HINTI=1;let HINT=true;
let PICKED=0;function pick(i){ST.sel=i;ST.aq=null;HINT=false;render();if(!PICKED++&&typeof GSEEN!="undefined"){delete GSEEN.deskC;setTimeout(gestChk,400)}}

/* 相位符號（自己畫，不依賴字型） */
const AGS=['<circle cx="7" cy="13" r="4.5"/><path d="M10.2 9.8L16 4"/>','<path d="M10 3V17M3.9 6.5L16.1 13.5M16.1 6.5L3.9 13.5"/>','<path d="M10 3.5L17 16H3Z"/>','<circle cx="5.5" cy="14.5" r="3.2"/><circle cx="14.5" cy="5.5" r="3.2"/><path d="M7.8 12.2L12.2 7.8"/>','<rect x="4" y="4" width="12" height="12"/>'];
const AG=(k,c,w)=>`<g fill="none" stroke="${c||ASP[k][3]}" stroke-width="${w||2}" stroke-linecap="round" stroke-linejoin="round">${AGS[k]}</g>`;
const AI=(k,c,w)=>`<svg class="ai" viewBox="0 0 20 20" role="img" aria-label="${ASP[k][0]}">${AG(k,c,w)}</svg>`;
/* 符號按鈕：依字形實際墨跡置中、加粗 */
const GC=document.createElement("canvas").getContext("2d");
const gsvg=g=>{GC.font='100px AstroSym,"Apple Symbols","Segoe UI Symbol",sans-serif';const m=GC.measureText(g),w=m.actualBoundingBoxRight+m.actualBoundingBoxLeft,h=m.actualBoundingBoxAscent+m.actualBoundingBoxDescent,k=Math.min(50/w,50/h,.75);
  const x=50-(m.actualBoundingBoxRight-m.actualBoundingBoxLeft)/2*k,y=50+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2*k;
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${(100*k).toFixed(1)}" class="gs" fill="#000" stroke="#000" stroke-width="4.2" stroke-linejoin="round">${g}</text></svg>`};
const om=o=>{const m=Math.round(o*60);return Math.floor(m/60)+"°"+String(m%60).padStart(2,"0")+"′"};

/* 星盤 */
const MQ=matchMedia("(max-width:760px)");MQ.addEventListener&&MQ.addEventListener("change",()=>{if(typeof ST!=="undefined"&&ST)draw()});
function draw(){
  const {pl,cu,asc,mc,sel}=ST,cx=300,cy=300;
  const A=l=>(180+l-cu[1])*Math.PI/180,pt=(l,r)=>[cx+r*Math.cos(A(l)),cy-r*Math.sin(A(l))];
  const cmp=MQ.matches;let s=`<svg viewBox="${cmp?"-6 -6 612 612":"-78 -30 756 674"}" role="img" aria-label="星盤">`;
  s+=`<circle cx="300" cy="300" r="290" fill="#fff7ca" stroke="#5e5e5e" stroke-width="1.4"/><circle cx="300" cy="300" r="244" fill="#fff" stroke="#5e5e5e" stroke-width="1"/><circle cx="300" cy="300" r="128" fill="#fff" stroke="#8a8a8a" stroke-width="1"/>`;
  s+=`<g stroke="#5e5e5e" stroke-width="1">`;
  for(let i=0;i<12;i++){const a=pt(i*30,244),b=pt(i*30,290);s+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`}
  for(let i=0;i<360;i+=5){const a=pt(i,244),b=pt(i,i%10?238:234);s+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke-width=".6"/>`}
  s+=`</g><g>`;
  for(let i=1;i<=12;i++){const a=pt(cu[i],128),b=pt(cu[i],244),ax=i%3==1;s+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${ax?"#2b2b2b":"#a7a7a7"}" stroke-width="${ax?2.2:.9}"/>`}
  s+=`</g>`;
  const on=q=>q.a==sel||q.b==sel,AS=ST.as.slice().sort((x,y)=>on(x)-on(y));
  AS.forEach(q=>{const K=ASP[q.k],a=pt(pl[q.a].lon,128),b=pt(pl[q.b].lon,128);s+=`<line class="al${on(q)?" on":""}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${K[3]}"${K[4]?` stroke-dasharray="${K[4]}"`:""}/>`});
  pl.forEach(p=>{const d=pt(p.lon,128);s+=`<circle cx="${d[0]}" cy="${d[1]}" r="${p.i==sel?4:2.6}" fill="#2b2b2b"/>`});
  AS.filter(on).forEach(q=>{const a=pt(pl[q.a].lon,128),b=pt(pl[q.b].lon,128),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;s+=`<g transform="translate(${mx-10} ${my-10})"><title>${P[q.a][0]} ${ASP[q.k][0]} ${P[q.b][0]}</title><circle cx="10" cy="10" r="10" fill="#fff"/><g transform="translate(2.5 2.5) scale(.75)">${AG(q.k)}</g></g>`});
  s+=`<g text-anchor="middle" dominant-baseline="central">`;
  for(let i=0;i<12;i++){const q=pt(i*30+15,267);s+=`<text class="zg" x="${q[0]}" y="${q[1]}" font-size="26" fill="#2b2b2b">${S[i][1]+V}</text>`}
  for(let i=1;i<=12;i++){const a=cu[i],b=cu[i%12+1],m=a+(((b-a)+360)%360)/2,q=pt(m,140);s+=`<text x="${q[0]}" y="${q[1]}" font-size="12" fill="#6f6f6f" class="num">${i}</text>`}
  // 四軸與度數
  const axl=(l,name,deg,kind)=>{const q=pt(l,kind=="h"?300:302);let t="";
    if(cmp){const r=pt(l,236),left=r[0]<300,up=r[1]<300,fs=15;
      if(kind=="h")return `<text class="ax" x="${r[0]+(left?4:-4)}" y="${r[1]-9}" font-size="${fs}" text-anchor="${left?"start":"end"}" fill="#2b2b2b">${left?name+" "+deg:deg+" "+name}</text>`;
      return `<text class="ax" x="${r[0]+7}" y="${r[1]+(up?6:-19)}" font-size="${up?fs:13}" text-anchor="start" fill="${up?"#2b2b2b":"#6f6f6f"}">${up?name:deg}</text><text class="ax" x="${r[0]+7}" y="${r[1]+(up?19:-6)}" font-size="${up?13:fs}" text-anchor="start" fill="${up?"#6f6f6f":"#2b2b2b"}">${up?deg:name}</text>`}
    if(kind=="h"&&cmp){const left=q[0]<300,x=q[0]+(left?-24:24);t=`<text class="ax" x="${x}" y="${q[1]-11}" font-size="17" text-anchor="middle" fill="#2b2b2b">${name}</text><text class="ax" x="${x}" y="${q[1]+11}" font-size="15" text-anchor="middle" fill="#6f6f6f">${deg}</text>`}
    else if(kind=="h"){const left=q[0]<300;t=`<text class="ax" x="${q[0]+(left?-4:4)}" y="${q[1]}" font-size="18" text-anchor="${left?"end":"start"}" fill="#2b2b2b">${left?name+" "+deg:deg+" "+name}</text>`}
    else{const up=q[1]<300;t=`<text class="ax" x="${q[0]}" y="${q[1]+(up?-18:28)}" fill="#2b2b2b" font-size="17">${name}</text><text class="ax" x="${q[0]}" y="${q[1]+(up?0:8)}" font-size="15" fill="#6f6f6f">${deg}</text>`}
    return t};
  const dg=l=>fmt(l).d+"°";
  let HP=null;const o=pl.map(p=>({p,d:p.lon})).sort((a,b)=>a.d-b.d);
  for(let k=0;k<4;k++)for(let j=1;j<o.length;j++)if(o[j].d-o[j-1].d<10){const m=(o[j].d+o[j-1].d)/2;o[j-1].d=m-5;o[j].d=m+5}
  const ol=pl.map(p=>({i:p.i,d:p.lon})).sort((a,b)=>a.d-b.d),LD={};
  for(let k=0;k<8;k++)for(let j=0;j<ol.length;j++){const A=ol[j],B=ol[(j+1)%ol.length],gap=((B.d-A.d)+360)%360;if(gap<14&&ol.length>1){const m=A.d+gap/2;A.d=m-7;B.d=m+7}}
  ol.forEach(x=>LD[x.i]=x.d);
  o.forEach(({p,d})=>{const t1=pt(p.lon,244),t2=pt(p.lon,232),g=pt(d,204),f=fmt(p.lon),q=pt(LD[p.i],166);
        if(HINT&&p.i==HINTI)HP=g;
        s+=`<g class="pl${p.i==sel?" sel":""}" data-i="${p.i}" tabindex="0" role="button" aria-label="${P[p.i][0]}">${true?`<circle class="hit" cx="${g[0]}" cy="${g[1]}" r="20"/><image href="wheel-${P[p.i][2]}${p.i==sel?"-on":""}.webp" x="${g[0]-20}" y="${g[1]-20}" width="40" height="40"/>`:`<circle cx="${g[0]}" cy="${g[1]}" r="18"/><text class="pg" x="${g[0]}" y="${g[1]+1}" font-size="21">${P[p.i][1]+V}</text>`}</g>`;
    s+=`<text class="num" x="${q[0]}" y="${q[1]}" font-size="10.5" fill="#555">${f.t}${p.rx?"℞":""}</text>`});
  s+=`<g class="${cmp?"axc":""}">`+axl(asc,"ASC",dg(asc),"h")+axl(asc+180,"DSC",dg(asc+180),"h")+axl(mc,"MC",dg(mc),"v")+axl(mc+180,"IC",dg(mc+180),"v")+"</g>";
  if(HINT&&HP)s+=hintSVG(HP[0],HP[1]);
  $("wheel").innerHTML=s+"</g></svg>";
  $("wheel").querySelectorAll(".pl").forEach(g=>{const go=()=>pick(+g.dataset.i);g.onclick=go;g.onkeydown=e=>{if(e.key=="Enter"||e.key==" "){e.preventDefault();go()}}});
}

/* 常用參數 */
function table(){
  const {pl,asc,mc,sel}=ST;
  let t=`<tr><th>行星</th><th>星座</th><th>度數</th><th>宮位</th></tr>`;
  pl.forEach(p=>{const f=fmt(p.lon);t+=`<tr class="row${p.i==sel?" sel":""}" data-i="${p.i}"><td>${sy(P[p.i][1])} ${P[p.i][0]}${p.rx?" ℞":""}</td><td>${sy(S[f.s][1])} ${S[f.s][0]}</td><td class="dg">${f.t}</td><td>${p.h}宮</td></tr>`});
  [["上升 ASC",asc],["天頂 MC",mc]].forEach(([n,l])=>{const f=fmt(l);t+=`<tr><td>${n}</td><td>${sy(S[f.s][1])} ${S[f.s][0]}</td><td class="dg">${f.t}</td><td>—</td></tr>`});
  $("tb").innerHTML=t;$("tb").querySelectorAll(".row").forEach(r=>r.onclick=()=>pick(+r.dataset.i));
}
function grid(){
  const {as,sel}=ST,M={};as.forEach(q=>M[q.a+"-"+q.b]=q);
  let h=`<p class="ag-t">相位表</p><table class="ag">`;
  for(let r=0;r<P.length;r++){h+="<tr>";for(let c=0;c<P.length;c++){
    if(c<r){const q=M[c+"-"+r];h+=`<td class="${c==sel||r==sel?"on":""}"${q?` title="${P[c][0]} ${ASP[q.k][0]} ${P[r][0]}（${om(q.o)}）"`:""}>${q?AI(q.k):""}</td>`}
    else if(c==r)h+=`<td class="d${r==sel?" sel":""}" data-i="${r}" title="${P[r][0]}">${sy(P[r][1])}</td>`;
    else h+=`<td class="x"></td>`}h+="</tr>"}
  h+=`</table><div class="lg">`+ASP.map((A,k)=>`<span>${AI(k)} ${A[0]} ${A[1]}°（±${A[2]}°）</span>`).join("")+"</div>";
  $("grid").innerHTML=h;$("grid").querySelectorAll("td.d").forEach(d=>d.onclick=()=>pick(+d.dataset.i));
}

/* 古典參數 */
function digOf(lon){const s=Math.floor(lon/30),d=lon-s*30;const t=TERMS[s].find(x=>d<x[1])[0];
  return {s,dom:DOM[s],exa:EXA[s],tri:TRI[s%4],term:t,face:FACE[(s*3+Math.floor(d/10))%7],det:DOM[(s+6)%12],fall:EXA[(s+6)%12]}}
function receptions(pl){const out=[];
  for(let b=0;b<7;b++){const sb=Math.floor(pl[b].lon/30);
    for(let a=0;a<7;a++){if(a==b)continue;const ty=[];if(DOM[sb]==a)ty.push("廟");if(EXA[sb]==a)ty.push("旺");if(!ty.length)continue;
      const x=sep(pl[a].lon,pl[b].lon),lim=(ORB7[a]+ORB7[b])/2,ang=PTOL.find(g=>Math.abs(x-g)<=lim);
      if(ang!==undefined)out.push({a,b,ty,ang})}}
  out.forEach(r=>r.mu=out.some(q=>q.a==r.b&&q.b==r.a));return out}
function besieged(pl){const out=[];
  for(let x=0;x<7;x++){const L=pl[x].lon;let bef=null,aft=null;
    for(let y=0;y<7;y++){if(y==x)continue;
      // 光線只算落在「同一個星座」內的：前方最近一道、後方最近一道
      const s0=Math.floor(L/30)*30;
      [0,60,90,120,180,240,270,300].forEach(g=>{const p=(pl[y].lon+g)%360;if(p<s0||p>=s0+30)return;const f=p-L,b=L-p;
        if(f>1e-9&&(!aft||f<aft.d))aft={y,d:f};if(b>1e-9&&(!bef||b<bef.d))bef={y,d:b}})}
    if(bef&&aft&&bef.y!=aft.y)out.push({x,a:bef.y,b:aft.y,da:bef.d,db:aft.d})}
  return out}
function classical(){
  const {pl,sel}=ST;
  const c=(v,me)=>v<0?`<td class="na">—</td>`:`<td class="${v==me?"me":""}">${sy(P[v][1])}</td>`;
  let t=`<tr><th>星</th><th>座標</th><th>廟</th><th>旺</th><th colspan="3">三分性</th><th>界</th><th>十</th><th>陷</th><th>弱</th></tr>`;
  for(let i=0;i<7;i++){const D=digOf(pl[i].lon),f=fmt(pl[i].lon);
    t+=`<tr class="row${i==sel?" sel":""}" data-i="${i}"><td>${sy(P[i][1])}</td><td class="pc">${sy(S[D.s][1])}<span class="num">${f.t}</span></td>${c(D.dom,i)}${c(D.exa,i)}${D.tri.map(v=>c(v,i)).join("")}${c(D.term,i)}${c(D.face,i)}${c(D.det,i)}${c(D.fall,i)}</tr>`}
  $("dig").innerHTML=t;$("dig").querySelectorAll(".row").forEach(r=>r.onclick=()=>pick(+r.dataset.i));
  const R=receptions(pl);
  $("rec").innerHTML=R.length?R.map(r=>`<li>${sy(P[r.a][1])}<span class="rk">接納</span>${sy(P[r.b][1])}<span class="rt">・${r.ty.join("、")} <span class="num">${r.ang}°</span></span>${r.mu?'<span class="mu">互容</span>':""}</li>`).join(""):`<li class="none">沒有符合條件的接納。</li>`;
  const B=besieged(pl);
  $("bes").innerHTML=`<tr><th>被圍攻者</th><th>圍攻者1</th><th>圍攻者2</th></tr>`+(B.length?B.map(r=>`<tr title="前方 ${r.da.toFixed(1)}°・後方 ${r.db.toFixed(1)}°"><td>${sy(P[r.x][1])}</td><td>${sy(P[r.a][1])}</td><td>${sy(P[r.b][1])}</td></tr>`).join(""):`<tr><td colspan="3" class="none">沒有</td></tr>`);
}
document.body.dataset.par="n";document.body.dataset.mt="w";
document.querySelectorAll(".tog button").forEach(b=>b.onclick=()=>{const p=b.dataset.p;document.body.dataset.mt=p;
  if(p!="w"){PAR=p;document.body.dataset.par=p;$("parN").hidden=PAR!="n";$("parC").hidden=PAR!="c"}
  document.querySelectorAll(".tog button").forEach(x=>x.setAttribute("aria-selected",x===b));
  const mv=$("mview");if(mv)mv.scrollTop=0});
/* 直式畫面：在星盤／參數區左右滑動切換 */
(()=>{const mv=$("mview"),ORD=["w","n","c"];let x0=0,y0=0,t0=0,on=false;
  mv.addEventListener("touchstart",e=>{if(!VMQ.matches||e.touches.length!=1)return;on=true;x0=e.touches[0].clientX;y0=e.touches[0].clientY;t0=Date.now()},{passive:true});
  mv.addEventListener("touchend",e=>{if(!on)return;on=false;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;
    if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.4||Date.now()-t0>800)return;
    const i=ORD.indexOf(document.body.dataset.mt||"w"),j=i+(dx<0?1:-1);if(j<0||j>=ORD.length)return;
    document.querySelector(`.tog button[data-p="${ORD[j]}"]`).click();
    mv.classList.remove("sw-l","sw-r");void mv.offsetWidth;mv.classList.add(dx<0?"sw-l":"sw-r")},{passive:true});
  mv.addEventListener("animationend",()=>mv.classList.remove("sw-l","sw-r"));
})();
/* 手機卡牌頁：占星卡牌收納列 */
$("libBtn").onclick=()=>{const o=!document.body.classList.contains("lib-open");document.body.classList.toggle("lib-open",o);$("libBtn").setAttribute("aria-expanded",o);if(o){document.body.classList.remove("note-open");$("noteBtn").setAttribute("aria-expanded",false)}};
$("noteBtn").onclick=()=>{const o=!document.body.classList.contains("note-open");document.body.classList.toggle("note-open",o);$("noteBtn").setAttribute("aria-expanded",o);if(o){document.body.classList.remove("lib-open");$("libBtn").setAttribute("aria-expanded",false)}};

/* 卡牌 */
const CARD=id=>{const t=id[0],n=+id.slice(1);
  if(t=="P")return {src:`card-${P[n][2]}.webp`,alt:P[n][0]+"卡牌"};
  if(t=="S")return {src:`card-${S[n][2]}.webp`,alt:S[n][0]+"卡牌"};
  if(t=="H")return {src:`card-house-${String(n+1).padStart(2,"0")}.webp`,alt:"第"+CN[n]+"宮卡牌"};
  if(t=="A")return {src:`card-${["conjunction","sextile","trine","opposition","square"][n]}.webp`,alt:ASP[n][0]+"卡牌"};
  return null};
const LOADED=new Set();
function cwOk(img){const go=()=>requestAnimationFrame(()=>requestAnimationFrame(go2)),go2=()=>{LOADED.add(img.getAttribute("src"));const w=img.parentElement;if(w)w.classList.remove("wait");const b=img.closest(".bcard.popw");if(b){b.classList.remove("popw");void b.offsetWidth;b.classList.add("pop")}};(img.decode?img.decode():Promise.resolve()).catch(()=>{}).then(go)}
/* 預先載入所有卡牌圖，之後跳出時圖和陰影會同時出現 */
function preloadWheel(){P.forEach(x=>["","-on"].forEach(s=>{const im=new Image();im.src=`wheel-${x[2]}${s}.webp`}))}
let PRE_ON=false;
function preloadCards(){if(PRE_ON)return;PRE_ON=true;const ids=[...P.map((_,i)=>"P"+i),...S.map((_,i)=>"S"+i),...Array.from({length:12},(_,i)=>"H"+i),...Array.from({length:5},(_,i)=>"A"+i)];ids.forEach(id=>{const c=CARD(id);if(!c||LOADED.has(c.src))return;const im=new Image();PREIMG.push(im);im.decoding="async";im.onload=()=>{(im.decode?im.decode():Promise.resolve()).catch(()=>{}).then(()=>LOADED.add(c.src))};im.src=c.src})}
var PREIMG=[];
function cardHTML(id){const c=CARD(id);
  if(c){const ok=LOADED.has(c.src);return `<div class="cw${id[0]=="A"?" aspc":""}${ok?"":" wait"}"><img src="${c.src}" alt="${c.alt}" draggable="false" decoding="${ok?"sync":"async"}" onload="cwOk(this)" onerror="cwOk(this)"></div>`}
  const n=+id.slice(1),A=ASP[n];
  return `<div class="cw"><div class="acard" style="--ac:${A[6]}" role="img" aria-label="${A[0]}卡牌"><span class="atag">相位</span><div class="atop"><svg viewBox="0 0 20 20">${AG(n,"#fff")}</svg></div><div class="alab"><svg viewBox="0 0 20 20">${AG(n,"#2b2b2b")}</svg><b>${A[0]}</b><span class="num">${A[1]}°</span><i></i><span>${A[5]}</span></div></div></div>`}
const ADDSVG='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 5v10M5 10h10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
const colC=(h,id)=>`<div><h3>${h}</h3><div class="cbox">${cardHTML(id)}<button type="button" class="cadd" data-add="${id}" data-tip="加入卡牌頁" aria-label="加入卡牌頁">${ADDSVG}</button></div></div>`;
function addOne(id,btn){if(!R.length||R[R.length-1].length>=5)R.push([]);R[R.length-1].push(id);saveR();if(btn){btn.classList.add("done");btn.setAttribute("data-tip","已加入卡牌頁 ✓");setTimeout(()=>{btn.classList.remove("done");btn.setAttribute("data-tip","加入卡牌頁")},1600)}}
document.addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b){e.stopPropagation();addOne(b.dataset.add,b)}},true);
function cards(){
  const {pl,sel}=ST,p=pl[sel],f=fmt(p.lon);
  $("sum").innerHTML=`${SPK("#2b2b2b")}${P[sel][0]}・${S[f.s][0]}・第${p.h}宮`;
  $("cards").innerHTML=colC("行星","P"+sel)+colC("星座","S"+f.s)+colC("宮位","H"+(p.h-1));
  $("send").hidden=false;$("send").textContent="把這三張加入卡牌頁";
}
function aspL(){const {as,sel}=ST;return as.filter(q=>q.a==sel||q.b==sel).sort((x,y)=>x.o-y.o)}
function aspects(){
  const {pl,sel}=ST,L=aspL();
  $("abar").innerHTML=L.map((q,j)=>{const o=q.a==sel?q.b:q.a,A=ASP[q.k];
    return `<button type="button" class="abtn" data-j="${j}" style="--c:${A[3]}" aria-expanded="false" aria-label="${A[0]} ${P[o][0]}" data-tip="${A[0]}・${P[o][0]}｜點選觀察${P[sel][0]}與另一顆行星的故事">${AI(q.k)}<img src="chip-${P[o][2]}.webp" alt="" draggable="false"></button>`}).join("");
  $("asp").innerHTML=L.length?`<div class="apanel" id="apanel"></div>`:"";
  $("abar").querySelectorAll(".abtn").forEach(b=>b.onclick=()=>{const j=+b.dataset.j;ST.aq=ST.aq===j?null:j;openA(true)});
  openA(false);
}
function openA(anim){const box=$("apanel");if(!box)return;const {pl,sel}=ST,L=aspL();
  $("abar").querySelectorAll(".abtn").forEach(b=>{const on=+b.dataset.j===ST.aq;b.classList.toggle("on",on);b.setAttribute("aria-expanded",on)});
  if(ST.aq==null||!L[ST.aq]){box.innerHTML="";box.classList.remove("open");return}
  const q=L[ST.aq],o=q.a==sel?q.b:q.a,A=ASP[q.k],f=fmt(pl[o].lon),col=(h,id)=>`<div><h3>${h}</h3>${cardHTML(id)}</div>`;
  box.innerHTML=`<div class="apin${anim?" pop":""}"><button type="button" class="aset" id="sendA" data-tip="將這組相位加入卡牌頁面" aria-label="將這組相位加入卡牌頁面"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3" width="7" height="8" rx="1.4"/><rect x="13.5" y="3" width="7" height="8" rx="1.4"/><rect x="8.5" y="13" width="7" height="8" rx="1.4"/></svg><span class="aset-p">${ADDSVG}</span><span class="aset-t">整組加入卡牌頁</span></button>
    <div class="arow">${colC("相位","A"+q.k)}</div>
    <div class="trio trio2">${colC("行星","P"+o)}${colC("星座","S"+f.s)}${colC("宮位","H"+(pl[o].h-1))}</div></div>`;
  box.classList.add("open");if(typeof DC!=="undefined"&&DC){DC.fit();if(anim)setTimeout(()=>DC.reveal(box),40)}
  $("sendA").onclick=()=>{const p=pl[sel],m=fmt(p.lon),b=$("sendA");R.push(["P"+sel,"S"+m.s,"H"+(p.h-1)],["A"+q.k],["P"+o,"S"+f.s,"H"+(pl[o].h-1)]);saveR();const bt=b.querySelector(".aset-t");b.classList.add("done");b.setAttribute("data-tip","已加入卡牌頁 ✓");if(bt)bt.textContent="已加入卡牌頁 ✓";setTimeout(()=>{b.classList.remove("done");b.setAttribute("data-tip","將這組相位加入卡牌頁面");if(bt)bt.textContent="整組加入卡牌頁"},1600)};
}

/* ---------- 卡牌頁：一排一排自由排列 ---------- */
const KEY="cuicui-card-rows-v4";
let R=[],POP=null;
R=[["P0","S2","H0"]];/* 預設：太陽＋雙子座＋第一宮 */
try{const d=JSON.parse(localStorage.getItem(KEY)||"null");if(Array.isArray(d))R=d.filter(Array.isArray)}catch(e){}
const saveR=()=>{R=R.filter(r=>r.length);try{localStorage.setItem(KEY,JSON.stringify(R))}catch(e){}};
const ARW={l:'<svg viewBox="0 0 12 12"><path d="M8.5 1.5L2.5 6l6 4.5z" fill="currentColor"/></svg>',d:'<svg viewBox="0 0 12 12"><path d="M1.5 3.5L6 9.5l4.5-6z" fill="currentColor"/></svg>',u:'<svg viewBox="0 0 12 12"><path d="M1.5 8.5L6 2.5l4.5 6z" fill="currentColor"/></svg>',r:'<svg viewBox="0 0 12 12"><path d="M3.5 1.5L9.5 6l-6 4.5z" fill="currentColor"/></svg>'};
const CI=n=>`<img src="chip-${n}.webp" alt="" draggable="false">`;
function lib(){
  const col=(h,items)=>`<div class="lcol"><h3>${h}</h3><span class="lsp">${SPK("#2b2b2b")}</span><div class="chips">${items}</div></div>`;
  const chip=(id,inner,label,cls="")=>`<button type="button" class="chip ${cls}" data-id="${id}" aria-label="加入${label}">${inner}</button>`;
  $("lib").innerHTML=col("行星",P.map((x,i)=>chip("P"+i,CI(x[2]),x[0],"ci")).join(""))+col("星座",S.map((x,i)=>chip("S"+i,CI(x[2]),x[0],"ci")).join(""))+
    col("宮位",CN.map((x,i)=>chip("H"+i,CI("house-"+String(i+1).padStart(2,"0")),"第"+x+"宮","ci")).join(""))+col("相位",ASP.map((x,i)=>chip("A"+i,CI(["conjunction","sextile","trine","opposition","square"][i]),x[0],"ci")).join(""));
  $("lib").onclick=e=>{const c=e.target.closest(".chip");if(!c)return;if(!$("coach").hidden)return;if(!R.length||R[R.length-1].length>=5)R.push([]);R[R.length-1].push(c.dataset.id);POP=[R.length-1,R[R.length-1].length-1];saveR();renderB();
    const rows=$("board").querySelectorAll(".brow"),last=rows[rows.length-1];if(last){const k=last.lastElementChild;if(k&&k.scrollIntoView)k.scrollIntoView({block:"nearest",behavior:"smooth"})}};
}
function renderB(){
  try{return renderB0()}finally{POP=null;if(typeof DB!=="undefined"&&DB)requestAnimationFrame(()=>DB.home())}
}
function renderB0(){
  if(!R.length){$("board").innerHTML=`<p class="bempty"><span class="dk">點左側的符號，把卡牌加進來。</span><span class="tbo">點上方的符號，把卡牌加進來。</span><span class="mbo">點開下方「占星卡牌」，選擇符號加入卡牌。</span></p>`;return}
  $("board").innerHTML=R.map((row,ri)=>`<div class="brow" data-r="${ri}">`+row.map((id,i)=>`<div class="bcard${POP&&POP[0]==ri&&POP[1]==i?" popw":""}" draggable="true" data-i="${i}"><div style="position:relative;width:100%">${cardHTML(id)}<button type="button" class="bx" data-a="x" aria-label="移除">✕</button></div><div class="bbar"><button type="button" data-a="l" aria-label="往左移"${i?"":" disabled"}>${ARW.l}</button><button type="button" data-a="d" aria-label="移到下一排">${ARW.d}</button>${ri?`<button type="button" data-a="u" aria-label="移到上一排">${ARW.u}</button>`:""}<button type="button" data-a="r" aria-label="往右移"${i<row.length-1?"":" disabled"}>${ARW.r}</button></div></div>`).join("")+`</div>`).join("");
  $("board").querySelectorAll(".bcard.popw").forEach(b=>{const im=b.querySelector(".cw>img");if(!im){b.classList.remove("popw");b.classList.add("pop");return}im.parentElement.classList.add("wait");if(im.complete&&im.naturalWidth)cwOk(im)})
}
let DR=null;
(()=>{const box=$("board"),rOf=el=>{const s=el.closest(".brow");return s?+s.dataset.r:-1};
  box.addEventListener("click",e=>{const b=e.target.closest("button[data-a]");if(!b)return;const ri=rOf(b),i=+b.closest(".bcard").dataset.i,row=R[ri],a=b.dataset.a;
    if(a=="x")row.splice(i,1);
    else if(a=="l"&&i>0)[row[i-1],row[i]]=[row[i],row[i-1]];
    else if(a=="r"&&i<row.length-1)[row[i+1],row[i]]=[row[i],row[i+1]];
    else if(a=="d"){const id=row.splice(i,1)[0];if(!R[ri+1])R.push([]);R[ri+1].push(id)}
    else if(a=="u"&&ri>0){const id=row.splice(i,1)[0];R[ri-1].push(id)}
    saveR();renderB()});
  box.addEventListener("dragstart",e=>{const c=e.target.closest&&e.target.closest(".bcard");if(!c)return;DR={r:rOf(c),i:+c.dataset.i};c.classList.add("drag");try{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain","card")}catch(_){}});
  box.addEventListener("dragend",()=>{DR=null;box.querySelectorAll(".drag,.over").forEach(x=>x.classList.remove("drag","over"))});
  box.addEventListener("dragover",e=>{if(!DR)return;const rw=e.target.closest(".brow");if(!rw)return;e.preventDefault();box.querySelectorAll(".over").forEach(x=>x.classList.remove("over"));(e.target.closest(".bcard")||rw).classList.add("over")});
  box.addEventListener("drop",e=>{if(!DR)return;const rw=e.target.closest(".brow");if(!rw)return;e.preventDefault();const ri=+rw.dataset.r,c=e.target.closest(".bcard");
    const id=R[DR.r].splice(DR.i,1)[0];let to=c?+c.dataset.i:R[ri].length;R[ri].splice(Math.min(to,R[ri].length),0,id);DR=null;saveR();renderB()});
})();
$("clearB").onclick=()=>{R=[];saveR();renderB()};
$("send").onclick=()=>{if(!ST)return;const p=ST.pl[ST.sel],f=fmt(p.lon);R.push(["P"+ST.sel,"S"+f.s,"H"+(p.h-1)]);saveR();$("send").textContent="已加入卡牌頁 ✓"};

(()=>{const g=$("guide"),d=$("gdots");if(!g||!d)return;g.addEventListener("scroll",()=>{const ps=g.querySelectorAll(".gpage");let k=0,b=1e9;ps.forEach((p,i)=>{const x=Math.abs(p.getBoundingClientRect().left+p.offsetWidth/2-innerWidth/2);if(x<b){b=x;k=i}});d.querySelectorAll("i").forEach((e,i)=>e.classList.toggle("on",i==k))},{passive:true})})();
/* ---------- 導覽 ---------- */
let POSTS=[],BLOG=null,BCAT="";const ADM_EMAIL="cuicui.tw@gmail.com";
const NAV=[["chart","星盤查詢",true],["cards","占星卡牌",true],["blog","翠誌",true],["booking","預約占星",true],["about","關於本站",true]];
const VIEW={chart:"vChart",cards:"vCards",blog:"vBlog",post:"vPost",booking:"vBook",about:"vAbout",privacy:"vPriv",terms:"vTerms",admin:"vAdmin"},HASH={cards:"#cards",blog:"#blog",booking:"#booking",about:"#about",privacy:"#privacy",terms:"#terms",admin:"#admin"};
$("nav").innerHTML=NAV.filter(n=>n[2]).map(n=>`<button type="button" data-v="${n[0]}">${n[1]}</button>`).join("");
/* 翠誌暫時只有站長看得到：沒有站長登入紀錄的裝置，導覽不顯示，網址也不能進入 */
const blogOK=()=>true; /* 翠誌公開：所有人都能看（不用登入） */
$("nav").insertAdjacentHTML("beforeend",`<div class="nav-foot">${document.querySelector(".foot-in").innerHTML.replace(/id="fyr"/,"")}</div>`);
function menu(o){$("nav").classList.toggle("open",o);$("menuBtn").setAttribute("aria-expanded",o)}
$("menuBtn").onclick=e=>{e.stopPropagation();menu(!$("nav").classList.contains("open"))};
document.addEventListener("click",e=>{if(!e.target.closest(".top"))menu(false)});
/* ---------- 動態：進場由下往上淡入 ---------- */
const RM=matchMedia("(prefers-reduced-motion:reduce)").matches;
const RVSEL='.brand,#nav,.ig,#f .fld,#f .adv,#f .frow2>*,.wheel-wrap,.tog,.par>*,.note,.sumrow,.trio>div,#asp>*,#asp li,.infobar,.lcol,.guide,.gdots,.board-foot,.bk-top,.bk h3,.plan,.cta,.faq details,.ab .tog,.abp>*';
const IO=("IntersectionObserver" in window&&!RM)?new IntersectionObserver(es=>{let k=0;es.forEach(e=>{if(e.isIntersecting){const el=e.target;el.style.setProperty("--d",Math.min(k++,6)*60+"ms");el.classList.add("in");IO.unobserve(el)}})},{rootMargin:"0px 0px -5% 0px"}):null;
function arm(root,extra,mark){if(!IO)return;root.querySelectorAll(RVSEL+(extra?","+extra:"")).forEach(el=>{if(el.closest(".rv:not(.in)")&&el.closest(".rv")!==el)return;el.classList.add("rv");if(mark)return;if(!el.classList.contains("in")||extra)IO.observe(el)})}
function replay(root){if(!IO)return;arm(root,".brow .bcard",true);const els=[...root.querySelectorAll(".rv")];els.forEach(el=>{IO.unobserve(el);el.classList.add("rv0");el.classList.remove("in")});void root.offsetHeight;requestAnimationFrame(()=>{els.forEach(el=>el.classList.remove("rv0"));requestAnimationFrame(()=>{els.forEach(el=>IO.observe(el));arm(root,".brow .bcard")})})}
if(IO){new MutationObserver(ms=>{ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType!==1)return;const host=n.parentElement;if(host&&!n.closest("#board"))arm(host)}))}).observe(document.body,{childList:true,subtree:true})}
/* ---------- 點卡牌放大（所有裝置） ---------- */
(()=>{const MQ=matchMedia("(max-width:760px)");const z=document.createElement("div");z.className="zoom";z.id="zoom";z.hidden=true;
  z.innerHTML='<div class="zoom-c"></div><button type="button" class="zoom-x" aria-label="關閉">✕</button>';document.body.appendChild(z);
  const box=z.querySelector(".zoom-c");
  function close(){z.classList.remove("on");setTimeout(()=>{z.hidden=true;box.innerHTML=""},180);document.body.classList.remove("zoom-on")}
  z.addEventListener("click",close);
  document.addEventListener("keydown",e=>{if(e.key=="Escape"&&!z.hidden)close()});
  document.addEventListener("click",e=>{if(!z.hidden)return;const c=e.target.closest("#vChart .cw,#vCards .cw");if(!c||e.target.closest("button"))return;
    e.preventDefault();const k=c.cloneNode(true);k.classList.remove("wait");k.removeAttribute("style");box.innerHTML="";box.appendChild(k);
    z.hidden=false;document.body.classList.add("zoom-on");requestAnimationFrame(()=>z.classList.add("on"))});
})();
/* ---------- 使用方式視窗 ---------- */
const HOWK="cuicui-howto-seen";
function howOpen(o){const h=$("how");if(!h)return;h.hidden=!o;document.body.classList.toggle("how-on",o);
  if(o){h.querySelector(".how-box").scrollTop=0;h.querySelector(".how-x").focus({preventScroll:true})}
  else{try{sessionStorage.setItem(HOWK,"1")}catch(e){}}}
document.addEventListener("click",e=>{if(e.target.closest("[data-how]")){coEnd(true);howOpen(true)}else if(e.target.closest("[data-close]"))howOpen(false)});
document.addEventListener("keydown",e=>{if(e.key=="Escape"){if(!$("how").hidden)howOpen(false);else if(!$("coach").hidden)coEnd()}});
$("howGo").onclick=()=>{howOpen(false);if(document.body.dataset.view!="cards")view("cards");setTimeout(()=>coStart(CARDS_T),250)};
/* ---------- 使用方式：在畫面上一步一步介紹 ---------- */
let COI=-1,COS=null,COBAK=null;
const GSTXT=()=>MSQ.matches?"用兩隻手指放大縮小，一指左右滑動可以移動卡牌。":"在卡牌區滾動滑鼠滾輪放大縮小，按住左鍵拖曳可以移動。";
const CARDS_T={name:"使用方式",off:1,total:7,demo:true,steps:[
 {t:()=>MSQ.matches?document.querySelector("#mbar .mb-wide"):$("lib"),h:"選擇符號",x:()=>MSQ.matches?"點這裡打開卡牌清單，選符號就會加入卡牌。":"點符號，卡牌就會加進右邊。"},
 {t:()=>$("deskB"),h:"放大縮小・移動",x:GSTXT,g:true},
 {t:()=>document.querySelector("#board .brow"),h:"排列卡牌",x:()=>"一排放「行星＋星座＋宮位」。可以拖曳換位置，按 ✕ 移除。"},
 {t:()=>MSQ.matches?document.querySelector("#mbar .mb-note"):document.querySelector(".ltog"),h:"占星筆記",anim:()=>{if(!MSQ.matches)coAnimLt()},x:()=>MSQ.matches?"按「筆記」打開占星筆記，可以一邊看卡牌、一邊寫下練習，依分類存好。":"切換到「占星筆記」，可以一邊看卡牌、一邊寫下練習，依分類存好。"},
 {t:()=>document.querySelector("#board .brow"),h:"照著關鍵字造句",x:()=>"觀察卡牌關鍵字，運用聯想力來串成一句話，寫進筆記裡：",ex:"1. 我的人生追求（<b>太陽</b>）是做自己（<b>第一宮</b>），並透過靈敏、好奇與溝通天賦（<b>雙子座</b>）展現出來。<br>2. 當我（<b>第一宮</b>）感到沒自信時（<b>太陽</b>），我會表現的心不在焉（<b>雙子座</b>）。<br>3. 我（<b>第一宮</b>）透過分享自己的故事（<b>雙子座</b>），引領他人（<b>太陽</b>）。"},
 {t:()=>$("deskB"),h:"自我覺察",x:()=>"問問自己：這句話曾在我的生活中哪裡出現過？",last:"開始排卡牌"}],
 back:()=>howOpen(true),fin:()=>{try{sessionStorage.setItem(HOWK,"1")}catch(e){}}};
const CHART_T={name:"網站導覽",off:1,total:9,steps:[
 {t:()=>MSQ.matches?document.querySelector("#mbar .mb-open"):document.querySelector("#f .frow"),h:"輸入出生資料",x:()=>MSQ.matches?"點「查詢星盤」輸入出生日期、時間、地點，就能排出星盤。":"輸入出生日期、時間、地點，星盤會自動更新。"},
 {t:()=>$("saveC"),h:"存星盤",x:()=>"排好的星盤按「☆ 存星盤」就能保存。要先用 Google 帳號登入，才能存到你的帳號，換手機或電腦也看得到。",on:()=>{if(MSQ.matches)msOpen()},wait:1},
 {t:()=>MSQ.matches?$("mbNow"):$("now"),h:"現在天象",x:()=>"看此刻天空的星盤。"},
 {t:()=>$("wheel"),h:"點行星",x:()=>"點星盤上的行星，就會出現它的卡牌。"},
 {t:()=>document.querySelector("#vChart .tog"),h:"參數",x:()=>MSQ.matches?"切換星盤、常用參數、古典參數。":"切換常用參數與古典參數。"},
 {t:()=>$("cards"),h:"三張卡牌",x:()=>"行星＋星座＋宮位，串成一句話。試著照關鍵字造句，或按右上「＋」，把卡牌帶到卡牌頁練習。"},
 {t:()=>$("abar"),h:"相位",x:()=>"點相位符號，看這顆行星和另一顆行星的互動。",skip:()=>!$("abar").children.length},
 {t:()=>$("deskC"),h:"放大縮小・移動",x:GSTXT,g:true,last:"開始查詢星盤"}],
 back:()=>introOpen(),pre:()=>{if(document.body.dataset.view!="chart")view("chart");if(document.body.classList.contains("mv-fold"))$("mvFold").click()}};
function coStart(T){if(!T)T=CARDS_T;COS=T;if(T===CARDS_T&&typeof ltSet=="function"){ltSet("lib");npClose()}if(T.pre)T.pre();if(T.demo){COBAK=R;R=[["P0","S2","H0"]];renderB()}
  document.body.classList.add("co-on");document.querySelectorAll(".desk .gest.on").forEach(g=>g.classList.remove("on"));$("coach").hidden=false;const g=document.querySelector(".gest");$("coG").innerHTML=g?g.innerHTML:"";coGo(0,1)}
function coEnd(){if($("coach").hidden)return;coAnimStop();$("coach").hidden=true;document.body.classList.remove("co-on","co-kw");COI=-1;
  if(COBAK){R=COBAK;COBAK=null;renderB()}if(COS&&COS.fin)COS.fin();scrollTo(0,0)}
function coGo(i,dir){coAnimStop();const bb=document.querySelector("#board .brow");if(bb)bb.style.transform="";if(typeof msClose=="function")msClose();const L=COS.steps;while(L[i]&&L[i].skip&&L[i].skip())i+=dir||1;if(i<0){coEnd();COS.back();return}if(i>=L.length){coEnd();return}
  COI=i;const S=L[i];document.body.classList.toggle("co-kw",!!(S.ex&&MSQ.matches));$("coN").textContent=COS.name+" "+String(i+1+COS.off).padStart(2,"0")+" / "+String(COS.total).padStart(2,"0");$("coH").textContent=S.h;$("coT").textContent=S.x();
  $("coEx").hidden=!S.ex;$("coEx").innerHTML=S.ex||"";$("coG").hidden=!S.g;$("coPrev").textContent="上一步";$("coNext").textContent=S.last||"下一步";
  const el=S.t();if(el&&el.scrollIntoView){const r=el.getBoundingClientRect();if(r.top<(parseFloat(getComputedStyle(document.body).getPropertyValue("--topH"))||70)+20||r.bottom>innerHeight-80)el.scrollIntoView({block:"center"})}
  if(S.on)S.on();setTimeout(coPos,S.wait&&MSQ.matches?380:60)}
let CAI=0,CAT=0;
function coAnimStop(){clearInterval(CAI);clearTimeout(CAT);CAI=0;const c=$("coCur");if(c)c.hidden=true;const v=document.body.dataset.lt||"lib";document.querySelectorAll(".ltog button").forEach(b=>b.classList.toggle("on",b.dataset.lt==v))}
function coAnimLt(){const bs=document.querySelectorAll(".ltog button");if(bs.length<2||!bs[0].offsetParent)return;let c=$("coCur");
  if(!c){$("coach").insertAdjacentHTML("beforeend",'<div class="co-cur" id="coCur" hidden aria-hidden="true"><i></i><svg viewBox="0 0 24 24"><path d="M5 2.5v17l4.3-4.1 2.9 6.6 3-1.3-2.9-6.5h6z" fill="#fff" stroke="#2b2b2b" stroke-width="1.6" stroke-linejoin="round"/></svg></div>');c=$("coCur")}
  const a=bs[0].getBoundingClientRect(),b=bs[1].getBoundingClientRect();
  c.style.setProperty("--x0",Math.round(a.left+a.width*.55)+"px");c.style.setProperty("--y0",Math.round(a.top+a.height*.55)+"px");
  c.style.setProperty("--x1",Math.round(b.left+b.width*.5)+"px");c.style.setProperty("--y1",Math.round(b.top+b.height*.5)+"px");
  if(CAI)return;c.hidden=false;c.style.animation="none";void c.offsetWidth;c.style.animation="";
  const cyc=()=>{bs[0].classList.add("on");bs[1].classList.remove("on");clearTimeout(CAT);CAT=setTimeout(()=>{bs[1].classList.add("on");bs[0].classList.remove("on")},1100)};cyc();CAI=setInterval(cyc,2600)}
function coRect(el){let L,T,Rr,B;const r0=el.getBoundingClientRect();[L,T,Rr,B]=[r0.left,r0.top,r0.right,r0.bottom];
  if(el.classList.contains("brow")){const cs=el.querySelectorAll(".bcard");if(cs.length){L=T=1e9;Rr=B=-1e9;cs.forEach(c=>{const q=c.getBoundingClientRect();L=Math.min(L,q.left);T=Math.min(T,q.top);Rr=Math.max(Rr,q.right+9);B=Math.max(B,q.bottom+9)})}}
  const dk=el.closest(".desk");if(dk&&dk!==el){const d=dk.getBoundingClientRect();L=Math.max(L,d.left+4);Rr=Math.min(Rr,d.right-4);T=Math.max(T,d.top+4);B=Math.min(B,d.bottom-4)}
  L=Math.max(L,12);Rr=Math.min(Rr,innerWidth-12);return {left:L,top:T,right:Rr,bottom:B,width:Math.max(0,Rr-L),height:Math.max(0,B-T)}}
function coPos(){if(COI<0)return;if(COS.steps[COI].anim)COS.steps[COI].anim();const el=COS.steps[COI].t(),H=$("coHole"),T=$("coTip");if(!el){H.style.cssText="left:50%;top:50%;width:0;height:0";}else{
  const r=coRect(el),p=8,hl=Math.max(4,r.left-p),ht=r.top-p,hr=Math.min(innerWidth-4,r.right+p);H.style.cssText=`left:${hl}px;top:${ht}px;width:${hr-hl}px;height:${r.height+p*2}px`;
  if(COS.steps[COI].ex&&!MSQ.matches&&innerWidth-316>r.right+12){T.style.width="300px";T.style.left=(innerWidth-316)+"px";T.style.bottom="auto";T.style.top=Math.max(80,Math.min(r.top,innerHeight-T.offsetHeight-16))+"px";T.classList.remove("in");void T.offsetWidth;T.classList.add("in");return}
  if(COS.steps[COI].ex&&MSQ.matches){const b=el.closest(".brow")||el;b.style.transform="";const r0=b.getBoundingClientRect();const cw=Math.max(b.scrollWidth,r0.width);const z=Math.min(1,(innerWidth-12)/cw);const dx=(innerWidth-cw*z)/2-r0.left;b.style.transformOrigin="0 0";b.style.transform=`translateX(${dx}px) scale(${z})`;
    T.style.width=(innerWidth-16)+"px";T.style.left="8px";T.style.top="auto";T.style.bottom=((($("mbar")&&!$("mbar").hidden)?$("mbar").offsetHeight:0)+8)+"px";T.style.maxHeight="46vh";T.style.overflowY="auto";T.classList.add("dock");T.classList.remove("in");void T.offsetWidth;T.classList.add("in");return}
  T.classList.remove("dock");T.style.maxHeight="";T.style.overflowY="";
  const tw=Math.min(340,innerWidth-24);T.style.width=tw+"px";const th=T.offsetHeight;let left=Math.min(Math.max(12,r.left+r.width/2-tw/2),innerWidth-tw-12),top;
  if(r.right+tw+24<innerWidth&&!MSQ.matches){left=r.right+18;top=Math.min(Math.max(80,r.top),innerHeight-th-12)}
  else if(r.bottom+th+20<innerHeight)top=r.bottom+16;else if(r.top-th-20>60)top=r.top-th-16;else top=Math.max(70,innerHeight-th-90);
  T.style.left=left+"px";T.style.top=top+"px";T.classList.remove("in");void T.offsetWidth;T.classList.add("in")}}
$("coNext").onclick=()=>{if(COS.steps[COI].last)coEnd();else coGo(COI+1,1)};
$("coPrev").onclick=()=>coGo(COI-1,-1);
$("coSkip").onclick=()=>coEnd();
addEventListener("resize",()=>{if(COI>=0)coPos()});addEventListener("scroll",()=>{if(COI>=0)coPos()},{passive:true});
function howFirst(){let s=null;try{s=sessionStorage.getItem(HOWK)}catch(e){s="1"}if(!s)setTimeout(()=>{if(document.body.dataset.view=="cards")howOpen(true)},450)}
function view(v){
  if(!VIEW[v])v="chart";if(v=="blog"&&!blogOK())v="chart";document.body.dataset.view=v;
  Object.entries(VIEW).forEach(([k,id])=>$(id).hidden=k!=v);
  document.querySelectorAll("#nav button").forEach(b=>{const on=b.dataset.v==v;b.classList.toggle("on",on);b.setAttribute("aria-current",on?"page":"false")});
  menu(false);if(v!="cards"&&typeof npClose=="function")npClose();if(v=="cards"){preloadCards();renderB();howFirst()}if(v=="admin")setTimeout(adminOpen,0);if(v=="blog")setTimeout(blogOpen,0);if(typeof msClose=="function"){msClose();mbarR()}
  requestAnimationFrame(()=>{if(v=="chart"&&ST)sizeMV();if(v=="chart"&&DC)DC.home();if(v=="cards"&&DB)DB.home()});
  try{history.replaceState(null,"",HASH[v]||location.pathname+location.search)}catch(e){}
  window.scrollTo(0,0);
  if(IO){const el=$(VIEW[v]);el.querySelectorAll(".pane").forEach(p=>p.scrollTop=0);replay(el)}
}
document.querySelectorAll("#nav button").forEach(b=>b.onclick=()=>view(b.dataset.v));
/* ---------- 關於翠脆：分頁切換、左右滑 ---------- */
(()=>{const T=[...document.querySelectorAll(".atog button")],P=[...document.querySelectorAll(".abp")];if(!T.length)return;
  function go(t,dir){T.forEach(b=>{const on=b.dataset.t==t;b.classList.toggle("on",on);b.setAttribute("aria-selected",on)});
    P.forEach(p=>{const on=p.dataset.t==t;p.hidden=!on;if(on){p.classList.remove("sw-l","sw-r");if(dir){void p.offsetWidth;p.classList.add(dir)}p.querySelectorAll(".rv").forEach(e=>e.classList.add("in"))}});
    const top=$("vAbout").getBoundingClientRect().top+scrollY-(parseFloat(getComputedStyle(document.body).getPropertyValue("--topH"))||70);if(scrollY>top)scrollTo({top,behavior:"smooth"})}
  T.forEach(b=>b.onclick=()=>{const i=T.indexOf(b),k=T.findIndex(x=>x.classList.contains("on"));if(i!=k)go(b.dataset.t,i>k?"sw-l":"sw-r")});
  let x0=0,y0=0,t0=0;const bd=$("abBody");
  bd.addEventListener("touchstart",e=>{const t=e.touches[0];x0=t.clientX;y0=t.clientY;t0=Date.now()},{passive:true});
  bd.addEventListener("touchend",e=>{const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.5||Date.now()-t0>800)return;
    const k=T.findIndex(x=>x.classList.contains("on")),n=k+(dx<0?1:-1);if(n<0||n>=T.length)return;go(T[n].dataset.t,dx<0?"sw-l":"sw-r")},{passive:true});
  document.querySelectorAll("button[data-go]").forEach(b=>b.onclick=()=>view(b.dataset.go));
})();
$("fyr").textContent=new Date().getFullYear();
/* 回到最上方：捲到接近底部時出現 */
function visPanes(){return [...document.querySelectorAll(".view:not([hidden]) .pane")].filter(p=>p.scrollHeight>p.clientHeight+8&&getComputedStyle(p).overflowY!="visible")}
function chkTop(){const de=document.documentElement;let show=scrollY>200&&innerHeight+scrollY>=de.scrollHeight-120;
  visPanes().forEach(p=>{if(p.scrollTop>200&&p.scrollTop+p.clientHeight>=p.scrollHeight-120)show=true});$("toTop").classList.toggle("show",show)}
addEventListener("scroll",chkTop,{passive:true});document.querySelectorAll(".pane").forEach(p=>p.addEventListener("scroll",chkTop,{passive:true}));
$("toTop").onclick=()=>{scrollTo({top:0,behavior:"smooth"});visPanes().forEach(p=>p.scrollTo({top:0,behavior:"smooth"}))};

document.querySelector(".brand").onclick=e=>{e.preventDefault();view("chart")};
if(IO){arm(document.querySelector(".top"))}setTimeout(preloadCards,10000);preloadWheel();lib();document.fonts&&document.fonts.load('100px AstroSym',"☉☽☿♀♂♃♄♅♆♇♈♉♊♋♌♍♎♏♐♑♒♓").then(lib,()=>{});view(({"#cards":"cards","#blog":"blog","#booking":"booking","#about":"about","#privacy":"privacy","#terms":"terms","#admin":"admin"})[location.hash]||"chart");

/* ---------- 記住上一次查詢：按「現在天象」後再按「排盤」會回到上一次的資料 ---------- */
const LQK="cuicui-last-query",QF=["nm","date","time","place","lat","lon","tz","hs","gen"];let NOWM=false;
const snapQ=()=>Object.fromEntries(QF.map(k=>[k,$(k).value]));
function saveQ(){try{localStorage.setItem(LQK,JSON.stringify(snapQ()))}catch(e){}}
function loadQ(){try{return JSON.parse(localStorage.getItem(LQK)||"null")}catch(e){return null}}
function applyQ(q){QF.forEach(k=>{if(q[k]!=null)$(k).value=q[k]});$("hsg").querySelectorAll("button").forEach(x=>{const on=x.dataset.v==$("hs").value;x.classList.toggle("on",on);x.setAttribute("aria-checked",on)});advSum()}
["nm","date","time","place","lat","lon","tz"].forEach(id=>$(id).addEventListener("input",()=>{NOWM=false}));
/* ---------- 輸入區收合 ---------- */
const FOLDK="cuicui-form-fold";
function fsumTxt(){const nm=$("nm").value.trim(),[y,m,d]=($("date").value||"").split("-");return (nm?nm+"｜":"")+(NOWM?"現在天象｜":"")+(y?`${+y}/${+m}/${+d} `:"")+$("time").value+"｜"+$("place").value+"｜"+($("hs").value=="P"?"Placidus":"Whole Sign")}
function fold(on,save=true){$("f").classList.toggle("folded",on);$("fsum").hidden=!on;if(on)$("fsum").textContent=fsumTxt();
  $("fold").innerHTML=on?'展開修改 <span aria-hidden="true">﹀</span>':'收合 <span aria-hidden="true">︿</span>';$("fold").setAttribute("aria-expanded",!on);
  if(save)try{localStorage.setItem(FOLDK,on?"1":"")}catch(e){}if(ST)setTimeout(sizeMV,60)}
$("fold").onclick=()=>fold(!$("f").classList.contains("folded"));
$("fsum").onclick=()=>fold(false);
/* ---------- 卡牌區放大縮小：電腦用滾輪（觸控板捏合也可）、手機用兩指；以中間為準 ---------- */
function fitScroll(root,center){if(!root)return;root.querySelectorAll(".trio,.arow").forEach(s=>{const keep=s.scrollWidth>s.clientWidth+2?s.scrollLeft/(s.scrollWidth-s.clientWidth||1):.5;
  s.classList.remove("ovf");if(s.scrollWidth>s.clientWidth+2){s.classList.add("ovf");if(center)s.scrollLeft=(s.scrollWidth-s.clientWidth)*(center==="keep"?keep:.5)}})}
function zoomArea(areas,key,target,prop){let z=1;try{z=+localStorage.getItem(key)||1}catch(e){}
  let tm=0;const set=v=>{z=Math.min(1.8,Math.max(.4,v));target.style.setProperty(prop,z.toFixed(3));fitScroll(target,true);clearTimeout(tm);tm=setTimeout(()=>{try{localStorage.setItem(key,z.toFixed(2))}catch(e){};if(ST)sizeMV()},250)};
  target.style.setProperty(prop,z.toFixed(3));
  const TOUCH="ontouchstart" in window;
  areas.forEach(el=>{if(!el)return;
    el.addEventListener("wheel",e=>{if(e.target.closest(".abar"))return;e.preventDefault();set(z*Math.exp(-e.deltaY*(e.ctrlKey?.012:.0018)))},{passive:false});
    let d0=0,z0=1;const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
    el.addEventListener("touchstart",e=>{if(e.touches.length==2){d0=dist(e.touches);z0=z}},{passive:true});
    el.addEventListener("touchmove",e=>{if(e.touches.length==2&&d0){e.preventDefault();set(z0*dist(e.touches)/d0)}},{passive:false});
    el.addEventListener("touchend",e=>{if(e.touches.length<2)d0=0},{passive:true});
    let g0=1;el.addEventListener("gesturestart",e=>{e.preventDefault();g0=z});
    el.addEventListener("gesturechange",e=>{e.preventDefault();if(!TOUCH)set(g0*e.scale)});})}
/* ---------- 桌面式卡牌區：整區一起放大縮小、拖曳移動 ---------- */
var MQM=matchMedia("(max-width:760px)");
function desk(id,key,skip){const D=$(id);if(!D)return null;const I=D.querySelector(".desk-in");let z=1,x=0,y=0,st=0,userZ=false;try{if(!MQM.matches){z=+localStorage.getItem(key)||1;userZ=!!localStorage.getItem(key)}}catch(e){}
  const W=()=>D.clientWidth,H=()=>D.clientHeight,ap=()=>{I.style.transform=`translate(${x}px,${y}px) scale(${z})`;I.style.setProperty("--dz",z)};
  const fit=()=>{if(!MQM.matches){D.style.height="";return}D.style.height=Math.round(Math.max(240,I.offsetHeight*z+16))+"px"};
  const clamp=()=>{const cw=CW()*z,ch=I.offsetHeight*z,w=W(),h=H();x=Math.min(Math.max(x,Math.min(0,w-cw)-w*.4),Math.max(0,w-cw)+w*.4);if(MQM.matches){y=0;return}y=Math.min(Math.max(y,Math.min(0,h-ch)-h*.3),h*.4)};
  const save=()=>{userZ=true;fit();clearTimeout(st);st=setTimeout(()=>{try{localStorage.setItem(key,z.toFixed(2))}catch(e){}},300)};
  const zoomAt=(nz,cx,cy)=>{nz=Math.min(2.4,Math.max(.4,nz));x=cx-(cx-x)*nz/z;y=cy-(cy-y)*nz/z;z=nz;clamp();ap();save()};
  const CW=()=>Math.max(I.offsetWidth,I.scrollWidth);
  const home=(auto)=>{if(!W())return;if(auto!==false&&MQM.matches&&!userZ){const f=Math.min(1,(W()-28)/CW());if(f<1)z=f}fit();x=(W()-CW()*z)/2;y=0;clamp();ap()};
  const anim=f=>{I.classList.add("anim");f();setTimeout(()=>I.classList.remove("anim"),380)};
  D.addEventListener("wheel",e=>{if(e.target.closest(".abar,.dreset"))return;e.preventDefault();zoomAt(z*Math.exp(-e.deltaY*(e.ctrlKey?.012:.0018)),W()/2,H()/2)},{passive:false});
  let drag=null;
  D.addEventListener("pointerdown",e=>{if(e.pointerType!="mouse"||e.button!==0||e.target.closest(skip))return;drag={sx:e.clientX,sy:e.clientY,x0:x,y0:y,mv:false};D.setPointerCapture(e.pointerId)});
  D.addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;if(!drag.mv&&Math.hypot(dx,dy)>4){drag.mv=true;D.classList.add("dragging")}if(drag.mv){x=drag.x0+dx;y=drag.y0+dy;clamp();ap()}});
  const up=e=>{if(!drag)return;if(drag.mv){D.addEventListener("click",ev=>{ev.stopPropagation();ev.preventDefault()},{capture:true,once:true});setTimeout(()=>D.classList.remove("dragging"),0)}drag=null};
  D.addEventListener("pointerup",up);D.addEventListener("pointercancel",up);
  let s1=null;
  D.addEventListener("touchstart",e=>{if(e.touches.length==1&&!e.target.closest(skip)){const t=e.touches[0];s1={sx:t.clientX,sy:t.clientY,x0:x,y0:y,mode:0}}else s1=null},{passive:true});
  D.addEventListener("touchmove",e=>{if(!s1||e.touches.length!=1)return;const t=e.touches[0],dx=t.clientX-s1.sx,dy=t.clientY-s1.sy;
    if(!s1.mode){if(Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)*1.2)s1.mode=1;else if(Math.abs(dy)>8)s1.mode=2}
    if(s1.mode==1){e.preventDefault();x=s1.x0+dx;clamp();ap()}},{passive:false});
  D.addEventListener("touchend",e=>{if(s1&&s1.mode==1)D.addEventListener("click",ev=>{ev.stopPropagation();ev.preventDefault()},{capture:true,once:true});s1=null},{passive:true});
  let t0=null;const mid=t=>[(t[0].clientX+t[1].clientX)/2,(t[0].clientY+t[1].clientY)/2],dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  D.addEventListener("touchstart",e=>{if(e.touches.length==2){s1=null;const r=D.getBoundingClientRect(),m=mid(e.touches);t0={d:dist(e.touches),m:[m[0]-r.left,m[1]-r.top],z,x,y}}},{passive:true});
  D.addEventListener("touchmove",e=>{if(e.touches.length!=2||!t0)return;e.preventDefault();const r=D.getBoundingClientRect(),m=mid(e.touches),mx=m[0]-r.left,my=m[1]-r.top;
    const nz=Math.min(2.4,Math.max(.4,t0.z*dist(e.touches)/t0.d)),cx=W()/2,cy=H()/2;z=nz;x=cx-(cx-t0.x)*nz/t0.z+(mx-t0.m[0]);y=cy-(cy-t0.y)*nz/t0.z+(my-t0.m[1]);clamp();ap();save()},{passive:false});
  D.addEventListener("touchend",e=>{if(e.touches.length<2){if(t0)D.addEventListener("click",ev=>{ev.stopPropagation();ev.preventDefault()},{capture:true,once:true});t0=null;setTimeout(()=>{D.onclick=null},350)}},{passive:true});
  let g0=1;D.addEventListener("gesturestart",e=>{e.preventDefault();g0=z});D.addEventListener("gesturechange",e=>{e.preventDefault();if(!("ontouchstart" in window))zoomAt(g0*e.scale,W()/2,H()/2)});
  D.querySelector(".dreset").addEventListener("click",e=>{e.stopPropagation();userZ=false;try{localStorage.removeItem(key)}catch(_){}anim(()=>{z=1;home()})});
  let lw=0;const ro=new ResizeObserver(()=>{const w=W();if(w&&w!==lw){lw=w;home()}});ro.observe(D);
  ap();requestAnimationFrame(home);
  return {top(){fit();anim(()=>{x=(W()-CW()*z)/2;y=0;clamp();ap()})},home,fit,reveal(el){if(!el)return;const t=el.offsetTop*z+y;if(t>H()*.55||t<0)anim(()=>{y=-el.offsetTop*z+H()*.12;clamp();ap()})}};
}
var DC=desk("deskC","cuicui-desk-chart","button,.abar,.dreset");
(()=>{if(!("IntersectionObserver" in window))return;const io=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle("inview",e.isIntersecting&&e.intersectionRatio>.15)),{threshold:[0,.15,.3]});["deskC","deskB"].forEach(id=>$(id)&&io.observe($(id)))})();
const GSEEN={};
function gestShow(id){if(GSEEN[id])return;const bc=document.body.classList;if(bc.contains("mem-on")||bc.contains("co-on")||bc.contains("how-on")||bc.contains("intro-on")||$("boot")){if(bc.contains("co-on"))GSEEN[id]=1;return}const D=$(id);if(!D||!D.offsetParent)return;const r=D.getBoundingClientRect(),vb=innerHeight-(MQM.matches?70:0),cy=(Math.max(r.top,60)+Math.min(r.bottom,vb))/2;if(Math.min(r.bottom,vb)-Math.max(r.top,60)<Math.min(150,r.height*.5))return;const g0=D.querySelector(".gest");g0.style.top=(cy-r.top-r.height/2)+"px";
  GSEEN[id]=1;const g=D.querySelector(".gest");g.classList.remove("on");void g.offsetWidth;g.classList.add("on");setTimeout(()=>g.classList.remove("on"),3200)}
function gestChk(){if(ST)gestShow("deskC");if(document.body.dataset.view=="cards")gestShow("deskB")}
addEventListener("scroll",gestChk,{passive:true});setInterval(gestChk,700);
function deskFix(){if(!MQM.matches)return;["deskC","deskB"].forEach(id=>{const D=$(id);if(!D||!D.offsetParent)return;const r=D.getBoundingClientRect(),mb=$("mbar"),mh=mb&&!mb.hidden?mb.offsetHeight:62,gap=Math.max(mh+14,innerHeight-r.bottom+10);D.style.setProperty("--fb",gap+"px")})}
addEventListener("scroll",deskFix,{passive:true});addEventListener("resize",deskFix);setInterval(deskFix,500);
var DB=desk("deskB","cuicui-desk-board","button,.bcard,.dreset");
/* ---------- 等待頁＋網站導覽 ---------- */
const T0=Date.now(),INTROK="cuicui-intro-v1";let BOOTED=false;
function bootDone(){if(BOOTED)return;BOOTED=true;const w=Math.max(0,1600-(Date.now()-T0));setTimeout(()=>{const b=$("boot");b.classList.add("out");setTimeout(()=>b.remove(),500);
  let seen=null;try{seen=sessionStorage.getItem(INTROK)}catch(e){seen="1"}
  if(!seen&&document.body.dataset.view=="chart")introOpen();else if(IO)replay($(VIEW[document.body.dataset.view]))},w)}
setTimeout(bootDone,12000);
let IS=0;const IST=[...document.querySelectorAll("#intro .ist")];
$("idots").innerHTML=IST.map((_,i)=>`<i data-i="${i}"></i>`).join("");
function introGo(n,dir){IS=Math.max(0,Math.min(IST.length-1,n));IST.forEach((s,i)=>{s.hidden=i!=IS;if(i==IS){s.classList.remove("in-l","in-r");void s.offsetWidth;s.classList.add(dir<0?"in-r":"in-l")}});
  $("icount").textContent=String(IS+1).padStart(2,"0")+" / "+String(IST.length).padStart(2,"0");
  $("idots").querySelectorAll("i").forEach((d,i)=>d.classList.toggle("on",i==IS));
  $("iprev").style.visibility=IS?"visible":"hidden";$("inext").textContent=IS==IST.length-1?"下一步：實際操作看看 →":"下一步"}
function introOpen(){const it=$("intro");it.hidden=false;document.body.classList.add("intro-on");introGo(0,1);requestAnimationFrame(()=>it.classList.add("on"))}
function introClose(){const it=$("intro");it.classList.remove("on");document.body.classList.remove("intro-on");setTimeout(()=>{it.hidden=true},300);try{sessionStorage.setItem(INTROK,"1")}catch(e){}
  if(document.body.dataset.view!="chart")view("chart");else if(IO)replay($("vChart"))}
$("inext").onclick=()=>{if(IS==IST.length-1){introClose();setTimeout(()=>coStart(CHART_T),350)}else introGo(IS+1,1)};
$("iprev").onclick=()=>introGo(IS-1,-1);
document.querySelector("[data-iskip]").onclick=introClose;
$("idots").onclick=e=>{const d=e.target.closest("i");if(d)introGo(+d.dataset.i,+d.dataset.i>IS?1:-1)};
document.addEventListener("keydown",e=>{if($("intro").hidden)return;if(e.key=="ArrowRight")$("inext").click();else if(e.key=="ArrowLeft"&&IS)introGo(IS-1,-1);else if(e.key=="Escape")introClose()});
(()=>{let x0=0,y0=0;const st=document.querySelector(".intro-stage");st.addEventListener("touchstart",e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});
  st.addEventListener("touchend",e=>{const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;if(Math.abs(dx)<50||Math.abs(dx)<Math.abs(dy))return;if(dx<0)$("inext").click();else if(IS)introGo(IS-1,-1)},{passive:true})})();
$("tour").onclick=introOpen;document.querySelectorAll("[data-tour]").forEach(b=>b.onclick=introOpen);
var NOTESVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h9l3.5 3.5v13.5H6z M14.5 3.5V7.5H18.5 M9 12h6.5M9 15.5h6.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></svg>';
/* ---------- 手機：下方工作列＋從下方拉出的面板（星盤頁＝輸入星盤資料、卡牌頁＝卡牌清單） ---------- */
var MSQ=matchMedia("(max-width:760px)");
var HOMEF={p:$("f").parentNode,n:$("f").nextSibling},HOMEL={p:$("lib").parentNode,n:$("lib").nextSibling};
function msOpen(){const v=document.body.dataset.view;if(v!="chart"&&v!="cards")return;if(typeof npClose=="function")npClose();const s=$("msheet");$("msF").hidden=v!="chart";$("msL").hidden=v!="cards";s.hidden=false;document.body.classList.add("ms-on");requestAnimationFrame(()=>s.classList.add("on"))}
function msClose(){const s=$("msheet");if(!s)return;if(s.hidden)return;s.classList.remove("on");document.body.classList.remove("ms-on");setTimeout(()=>{if(!s.classList.contains("on"))s.hidden=true},280)}
function mbarR(){if(!MSQ||!HOMEF)return;const b=$("mbar"),v=document.body.dataset.view,on=MSQ.matches&&(v=="chart"||v=="cards");b.hidden=!on;document.body.classList.toggle("mbar-on",on);if(!on)return;
  const [yy,mm,dd]=($("date").value||"").split("-");
  if(v=="chart")b.innerHTML=`<button type="button" class="mb-now" id="mbNow">現在天象</button><button type="button" class="mb-sum" data-msopen>${yy?esc(`${+yy}/${+mm}/${+dd} ${$("time").value}`):""}</button><button type="button" class="mb-open" data-msopen>查詢星盤 <span aria-hidden="true">︿</span></button>`;
  else b.innerHTML=`<button type="button" class="mb-help" data-how aria-label="使用方式">?</button><button type="button" class="mb-open mb-wide" data-msopen><span aria-hidden="true">︿</span> 占星卡牌<small>選擇符號加入卡牌</small></button><button type="button" class="mb-note" data-npopen aria-label="占星筆記">${NOTESVG}<span>筆記</span></button>`;
  const n=$("mbNow");if(n)n.onclick=()=>{showNow();mbarR()}}
var HOMEN={p:$("notes").parentNode,n:$("notes").nextSibling};
function msPlace(){if(MSQ.matches){$("msF").appendChild($("f"));$("msL").appendChild($("lib"));$("npBody").appendChild($("notes"))}else{HOMEF.p.insertBefore($("f"),HOMEF.n);HOMEL.p.insertBefore($("lib"),HOMEL.n);HOMEN.p.insertBefore($("notes"),HOMEN.n);msClose();if(typeof npClose=="function")npClose()}mbarR()}
document.addEventListener("click",e=>{if(e.target.closest("[data-msopen]"))msOpen();else if(e.target.closest("[data-msclose]"))msClose()});
MSQ.addEventListener&&MSQ.addEventListener("change",msPlace);msPlace();
/* ---------- 手機：星盤與參數區可收合 ---------- */
$("mvFold").onclick=()=>{const on=!document.body.classList.contains("mv-fold");document.body.classList.toggle("mv-fold",on);$("mvFold").setAttribute("aria-expanded",!on);
  $("mvFold").innerHTML=on?'展開星盤與參數 <span aria-hidden="true">﹀</span>':'收合 <span aria-hidden="true">︿</span>';if(ST)setTimeout(sizeMV,50)};
/* ---------- 現在天象 ---------- */
function setNow(){let z=$("tz").value.trim()||TW,p;
  const parts=zz=>Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:zz,hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).formatToParts(new Date()).map(x=>[x.type,x.value]));
  try{p=parts(z)}catch(e){p=parts(TW)}$("date").value=`${p.year}-${p.month}-${p.day}`;$("time").value=`${p.hour}:${p.minute}`}
function showNow(){if(!swe)return;NOWM=true;setNow();compute();LASTQ={...snapQ(),nm:"現在天象"};if(ST&&$("msg").className.includes("ok"))msg("現在天象｜"+ST.info,1);if($("f").classList.contains("folded"))$("fsum").textContent=fsumTxt()}
$("now").onclick=showNow;

/* ---------- 載入 Swiss Ephemeris（獨立檔案，可被瀏覽器記住） ---------- */
const SWV="__V__",SWU={"swisseph.wasm":"swisseph.wasm?v="+SWV,"swisseph.data":"swisseph.data?v="+SWV};
window.__SWE_URLS=SWU;
const sweLocal=()=>new Promise((ok,no)=>{if(location.protocol!="file:")return ok();const sc=document.createElement("script");sc.src="swe-local.js";sc.onerror=no;sc.onload=()=>{const B=t=>{const b=atob(t),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};const W=window.__SWEB,BIN={[SWU["swisseph.wasm"]]:[B(W[0]),"application/wasm"],[SWU["swisseph.data"]]:[B(W[1]),"application/octet-stream"]};const _f=window.fetch.bind(window);window.fetch=(u,o)=>{const k=typeof u=="string"?u:(u&&u.url)||"",b=BIN[k];return b?Promise.resolve(new Response(b[0],{status:200,headers:{"Content-Type":b[1]}})):_f(u,o)};ok()};document.head.appendChild(sc)});
(async()=>{try{await sweLocal();swe=new window.SwissEph();await swe.initSwissEph();$("go").disabled=false;$("go").textContent="排盤";showNow();bootDone()}
  catch(e){msg("星曆載入失敗："+(e.message||e));$("go").textContent="載入失敗";bootDone()}})();
function redo(){const yy=+($("date").value||"").split("-")[0];if(yy&&yy<1000)return;if(ST&&swe){compute();if(ST){if(!NOWM)saveQ();LASTQ=NOWM?{...snapQ(),nm:"現在天象"}:snapQ()}if($("f").classList.contains("folded"))$("fsum").textContent=fsumTxt();if(typeof mbarR=="function")mbarR()}}
$("nm").addEventListener("input",()=>{if(LASTQ&&!NOWM){LASTQ.nm=$("nm").value;saveQ()}});
$("gen").addEventListener("change",()=>{if(LASTQ&&!NOWM){LASTQ.gen=$("gen").value;saveQ()}});
["date","time","lat","lon","tz"].forEach(id=>$(id).addEventListener("change",redo));
$("hsg").querySelectorAll("button").forEach(b=>b.onclick=()=>{$("hs").value=b.dataset.v;$("hsg").querySelectorAll("button").forEach(x=>{const on=x===b;x.classList.toggle("on",on);x.setAttribute("aria-checked",on)});redo()});
$("go").onclick=()=>{if(!swe)return;if(NOWM){const q=loadQ();if(q)applyQ(q)}NOWM=false;compute();if(ST){saveQ();LASTQ=snapQ()}if($("f").classList.contains("folded"))$("fsum").textContent=fsumTxt();if(MSQ.matches&&ST)msClose()};
$("f").addEventListener("submit",e=>e.preventDefault());
$("f").addEventListener("keydown",e=>{if(e.key=="Enter"&&e.target.tagName=="INPUT"&&e.target.id!="place"){e.preventDefault();$("go").click()}});

/* ---------- 會員：Google 登入、我的星盤 ---------- */
let LASTQ=null,ME=null,MLIST=[],PEND=false,FBL=null;
const MKEY="cuicui-signed";
function fbLoad(){if(FBL)return FBL;if(!window.FB&&location.protocol=="file:")return Promise.reject(new Error("file"));
  FBL=(window.FB?Promise.resolve():new Promise((ok,no)=>{const sc=document.createElement("script");sc.src="fb.js?v=__FBV__";sc.async=true;sc.onload=()=>{window.FB?ok():no(new Error("fb"))};sc.onerror=()=>{FBL=null;no(new Error("net"))};document.head.appendChild(sc)}))
    .then(()=>{FB.onUser(u=>{ME=u;try{u?localStorage.setItem(MKEY,"1"):localStorage.removeItem(MKEY)}catch(e){}acctR();admBtnR(u);if(u){memLoad();if(PEND){PEND=false;saveChart()}}else{MLIST=[];memR()}notesOnUser(u)})});
  return FBL}
const escH=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function acctR(){const b=$("acct");if(!b)return;if(ME){b.classList.add("in");b.setAttribute("aria-label","我的帳號");
    b.querySelector(".acct-i").innerHTML=ME.photoURL?`<img src="${escH(ME.photoURL)}" alt="" referrerpolicy="no-referrer">`:`<b>${escH((ME.displayName||"我")[0])}</b>`;b.querySelector(".acct-t").textContent="我的帳號"}
  else{b.classList.remove("in");b.setAttribute("aria-label","會員登入");b.querySelector(".acct-i").innerHTML=ACCTSVG;b.querySelector(".acct-t").textContent="登入"}}
const ACCTSVG=$("acct")?$("acct").querySelector(".acct-i").innerHTML:"";
function mmsg(t,ok){const m=$(ME?"memMsg2":"memMsg");m.textContent=t||"";m.className="mem-msg"+(ok?" ok":"")}
function memOpen(lead){if(typeof npClose=="function")npClose();$("mem").hidden=false;document.body.classList.add("mem-on");$("memLead").textContent=lead||"登入後，就能把星盤和占星筆記存起來，換手機或電腦也看得到。";memR();fbLoad().catch(e=>mmsg(e.message=="file"?"會員功能要在網站上才能使用。":"會員功能載入失敗，請檢查網路後再試一次。"))}
/* ---------- 會員後台（站長專用，只讀；權限由 Firestore 規則把關） ---------- */
function ageOf(s){if(!s)return null;const [y,m,d]=String(s).split("-").map(Number);if(!y||!m||!d)return null;const n=new Date(Date.now()+8*3600e3);const cm=n.getUTCMonth()+1,cd=n.getUTCDate();let a=n.getUTCFullYear()-y;if(cm<m||(cm===m&&cd<d))a--;return a>=0?a:null}
/* ---------- 後台（站長專用）：左側選單 翠誌文章｜新增文章｜會員資料 ---------- */
let EDP=null,ADM_NAV=false,PCATS=[],ADM_FONT=false,EDSEL=null;
function admFont(){if(ADM_FONT)return;ADM_FONT=true;try{const l=document.createElement("link");l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap";document.head.appendChild(l)}catch(e){}}
const ED_IMG=/^https:\/\/firebasestorage\.googleapis\.com\//;
const fmtD=t=>t?new Date(t).toLocaleDateString("zh-TW",{timeZone:"Asia/Taipei"}):"—";
const catLabel=p=>[p.cat,p.sub].filter(Boolean).join("・");
async function adminOpen(){
  admFont();
  let ok=false;
  for(let i=0;i<2&&!ok;i++){try{await fbLoad();ok=true}catch(e){FBL=null;if(i==0)await new Promise(r=>setTimeout(r,1500))}}
  if(!ok){$("admMsg").textContent="後台載入失敗，請檢查網路後再試一次。";return}
  const u=await new Promise(r=>{let un=null;un=FB.onUser(x=>{if(un)un();r(x)})});
  if(!ADM_NAV){ADM_NAV=true;$("admPvX").onclick=()=>{$("admPv").hidden=true};$("admTog").onclick=()=>document.querySelector(".adm2-nav").classList.toggle("open");document.querySelectorAll("#vAdmin [data-an]").forEach(b=>b.addEventListener("click",()=>admGo(b.dataset.an)));document.addEventListener("selectionchange",edSelChange)}
  if(!u){admGo("list",true);$("anList").innerHTML=`<button type="button" class="pill" id="admLogin">用 Google 帳號登入</button>`;$("admLogin").onclick=()=>memOpen("登入後才能使用後台。");return}
  admGo("list");
}
function admGo(p,skip){
  document.querySelectorAll("#vAdmin [data-an]").forEach(b=>b.classList.toggle("on",b.dataset.an===p));
  const nv=document.querySelector(".adm2-nav"),tg=$("admTog");if(nv)nv.classList.remove("open");
  if(tg){const cur=document.querySelector('#vAdmin [data-an="'+p+'"]');tg.textContent=(cur?cur.textContent:"選單")+" ▾"}
  $("anList").hidden=p!=="list";$("anNew").hidden=p!=="new";$("anMem").hidden=p!=="mem";
  $("admMsg").textContent="";
  if(skip)return;
  if(p==="list")postListOpen();else if(p==="new")postEditorOpen(null);else admMembersOpen();
}
/* 會員資料（沿用原本的後台內容，只讀） */
async function admMembersOpen(){
  const msg=$("admMsg"),out=$("admOut");out.innerHTML="";msg.textContent="讀取中…";
  let d;
  try{d=await FB.adminLoad()}catch(e){msg.textContent="這個帳號沒有後台權限。";return}
  let views=0;try{views=await FB.siteViews()}catch(e){}
  const {charts,users=[]}=d,userMap={};users.forEach(x=>userMap[x.uid]=x);
  const uids=[...new Set([...users.map(x=>x.uid),...charts.map(c=>c.uid)])].filter(Boolean);
  const rows=[];
  uids.forEach(id=>{const um=userMap[id]||{},email=um.email||"",name=um.name||"";const cs=charts.filter(c=>c.uid==id);
    if(!cs.length){rows.push({id,email,name,nm:"",place:"",gen:"",age:null});return}
    cs.forEach(c=>rows.push({id,email,name,nm:c.nm||"",place:c.place||"",gen:c.gen||"",age:ageOf(c.date)}))});
  msg.textContent="";
  out.innerHTML=`<div class="adm-cards"><div class="adm-card">網站閱覽人數<b>${Number(views).toLocaleString("zh-TW")}</b></div><div class="adm-card">會員<b>${uids.length}</b></div><div class="adm-card">星盤<b>${charts.length}</b></div></div>`+
    `<div class="adm-filters"><label>性別<select id="fGen"><option value="">全部</option><option value="女">女</option><option value="男">男</option><option value="未填">未填</option></select></label>`+
    `<label>出生地區<input id="fPlace" placeholder="例如：台北" maxlength="20"></label>`+
    `<label>年齡<span><input id="fAgeMin" type="number" min="0" max="120" placeholder="最小" style="width:72px"> ～ <input id="fAgeMax" type="number" min="0" max="120" placeholder="最大" style="width:72px"></span></label>`+
    `<label>搜尋<input id="fQ" type="search" placeholder="Email、名稱、星盤名稱"></label></div>`+
    `<p class="adm-sum" id="admSum"></p><div class="adm-tw"><table class="adm-t mem-t"><thead><tr><th>Email</th><th>會員代號</th><th>出生地區</th><th>會員性別</th><th>會員名稱</th><th>星盤名稱</th><th>年齡</th></tr></thead><tbody id="admTb"></tbody></table></div>`;
  const draw=()=>{
    const g=$("fGen").value,pl=$("fPlace").value.trim(),mn=$("fAgeMin").value,mx=$("fAgeMax").value,q=$("fQ").value.trim().toLowerCase();
    const list=rows.filter(r=>{
      if(g==="未填"?r.gen:(g&&r.gen!==g))return false;
      if(pl&&!r.place.includes(pl))return false;
      if(mn!==""&&(r.age==null||r.age<+mn))return false;
      if(mx!==""&&(r.age==null||r.age>+mx))return false;
      if(q&&!(r.email+r.name+r.nm).toLowerCase().includes(q))return false;
      return true});
    $("admSum").textContent=`符合 ${list.length} 筆`;
    $("admTb").innerHTML=list.length?list.map(r=>`<tr><td data-label="Email">${escH(r.email||"—")}</td><td data-label="會員代號">${escH(r.id.slice(0,8))}</td><td data-label="出生地區">${escH(r.place||"—")}</td><td data-label="會員性別">${escH(r.gen||"未填")}</td><td data-label="會員名稱">${escH(r.name)}</td><td data-label="星盤名稱">${escH(r.nm||"（沒有存星盤）")}</td><td data-label="年齡">${r.age==null?"—":r.age}</td></tr>`).join(""):`<tr><td colspan="7">沒有符合條件的會員。</td></tr>`;
  };
  ["fGen","fPlace","fAgeMin","fAgeMax","fQ"].forEach(i=>$(i).addEventListener("input",draw));
  draw();
}
/* 後台按鈕：只有站長帳號登入時才顯示（非站長看不到） */
function admBtnR(u){const ok=!!(u&&u.email===ADM_EMAIL&&u.emailVerified);const b=$("admBtn");if(b)b.hidden=!ok;const ma=$("memAdm");if(ma)ma.hidden=!ok;
  try{ok?localStorage.setItem("cuicui-admin","1"):localStorage.removeItem("cuicui-admin")}catch(e){}
}

/* 翠誌文章：列表、分類管理、編輯器 */
async function postListOpen(){
  const box=$("anList");box.innerHTML='<p class="adm-lead">讀取中…</p>';
  try{[POSTS,PCATS]=await Promise.all([FB.postsAll(),FB.catsAll().catch(()=>[])])}catch(e){box.innerHTML='<p class="adm-msg">文章讀取失敗，請重新整理後再試。</p>';return}
  POSTS.sort((a,b)=>(b.updated||0)-(a.updated||0));
  box.innerHTML=`<div class="adm2-row"><h3 class="adm-h">翠誌文章</h3><div><button type="button" class="pill" id="pCats">分類管理</button> <button type="button" class="pill" id="pNew">＋ 新增文章</button></div></div><div id="pCatBox"></div>`+
    (POSTS.length?`<div class="adm-tw"><table class="adm-t adm2-t"><thead><tr><th>標題</th><th>分類</th><th>狀態</th><th>更新</th><th></th></tr></thead><tbody>${POSTS.map(p=>`<tr><td>${escH(p.title||"未命名文章")}</td><td>${escH(catLabel(p)||"未分類")}</td><td><span class="tag${p.status==="published"?"":" draft"}">${p.status==="published"?"已發佈":"草稿"}</span></td><td>${fmtD(p.updated)}</td><td><button type="button" class="pill" data-pe="${escH(p.id)}">編輯</button></td></tr>`).join("")}</tbody></table></div>`:'<p class="adm-lead">還沒有文章。</p>');
  $("pNew").onclick=()=>admGo("new");
  $("pCats").onclick=()=>catPanel();
  box.onclick=e=>{const b=e.target.closest("[data-pe]");if(!b)return;const p=POSTS.find(x=>x.id==b.dataset.pe);admGo("new",true);postEditorOpen(p)};
}
let CAT_OPEN=new Set();
function catPanel(boxId="pCatBox",after){
  const box=$(boxId);if(!box)return;
  const tops=PCATS.filter(c=>!c.parent);
  const subsOf=id=>PCATS.filter(c=>c.parent===id);
  const nameRow=c=>`<div class="adm2-crow"><input data-cn="${escH(c.id)}" value="${escH(c.name)}" maxlength="30" aria-label="分類名稱"><button type="button" class="pill" data-cs="${escH(c.id)}">改名</button><button type="button" class="pill" data-cd="${escH(c.id)}">刪除</button></div>`;
  box.innerHTML=`<div class="adm2-cbox">
    <form class="adm2-cadd adm2-cadd-top" data-top="1"><input name="name" maxlength="30" placeholder="新增大分類名稱" required aria-label="新增大分類名稱"><button type="submit" class="pill">新增大分類</button></form>
    ${tops.length?"":'<p class="adm-lead">還沒有分類，先新增一個大分類。</p>'}
    ${tops.map(t=>`<details class="adm2-ctop" data-id="${escH(t.id)}"${CAT_OPEN.has(t.id)?" open":""}>
      <summary><span class="adm2-cname">${escH(t.name)}</span><span class="adm2-cnum">${subsOf(t.id).length} 個子分類</span></summary>
      <div class="adm2-cbody">
        <div class="adm2-clabel">大分類</div>${nameRow(t)}
        <div class="adm2-clabel">子分類</div>
        ${subsOf(t.id).map(c=>nameRow(c)).join("")||'<p class="adm-lead">還沒有子分類。</p>'}
        <form class="adm2-cadd" data-sub="${escH(t.id)}"><input name="name" maxlength="30" placeholder="新增子分類名稱" required aria-label="新增子分類名稱"><button type="submit" class="pill">新增子分類</button></form>
      </div></details>`).join("")}
    <p class="adm-lead">刪除大分類時，它底下的子分類也會一起刪除；文章不會被刪除，文章上的分類名稱會保留。</p>
  </div>`;
  if(!box._catBound){box._catBound=1;box.addEventListener("toggle",e=>{const d=e.target;if(!d.dataset||!d.dataset.id)return;d.open?CAT_OPEN.add(d.dataset.id):CAT_OPEN.delete(d.dataset.id)},true)}
  const refresh=async()=>{PCATS=await FB.catsAll();catPanel(boxId,after);if(after)after()};
  const fail=()=>{$("admMsg").textContent="分類儲存失敗，請稍後再試。"};
  box.onsubmit=async e=>{
    e.preventDefault();const f=e.target;const name=String(new FormData(f).get("name")||"").trim();if(!name)return;
    const parent=f.dataset.sub||null;if(parent)CAT_OPEN.add(parent);
    try{await FB.catSave(null,{name,parent});await refresh()}catch(er){fail()}
  };
  box.onclick=async e=>{
    const s=e.target.closest("[data-cs]"),d=e.target.closest("[data-cd]");
    if(s){const inp=box.querySelector(`[data-cn="${s.dataset.cs}"]`);const name=inp?inp.value.trim():"";if(!name)return;
      try{await FB.catSave(s.dataset.cs,{name});await refresh()}catch(er){fail()}return}
    if(d){if(!confirm("確定要刪除這個分類嗎？如果是大分類，它的子分類也會一起刪除。文章不會被刪除。"))return;
      try{await FB.catDel(d.dataset.cd);CAT_OPEN.delete(d.dataset.cd);await refresh()}catch(er){$("admMsg").textContent="刪除失敗，請稍後再試。"}}
  };
}
/* 內文格式：只保留副標 h3、內文 p、引言 blockquote、粗體 b、斜體 i、圖片 img（網址必須來自 Firebase Storage） */
function sanitizeBody(html){
  const src=new DOMParser().parseFromString(`<body>${String(html||"")}</body>`,"text/html").body;
  const out=document.createElement("div");
  const keep={P:1,H3:1,BLOCKQUOTE:1,B:1,I:1,BR:1,HR:1};
  const walk=(from,to)=>{from.childNodes.forEach(n=>{
    if(n.nodeType===3){to.appendChild(document.createTextNode(n.nodeValue));return}
    if(n.nodeType!==1)return;
    let t=n.tagName;if(t==="DIV")t="P";if(t==="STRONG")t="B";if(t==="EM")t="I";
    if(t==="IMG"){const s=n.getAttribute("src")||"";if(ED_IMG.test(s)){const im=document.createElement("img");im.src=s;im.alt="";to.appendChild(im)}return}
    if(!keep[t]){walk(n,to);return}
    const el=document.createElement(t.toLowerCase());walk(n,el);to.appendChild(el);
  })};
  walk(src,out);
  return out.innerHTML;
}
const bodyIsHtml=s=>/<[a-z!\/]/i.test(String(s||""));
const legacyToHtml=s=>String(s||"").split(/\n\s*\n/).map(t=>t.trim()).filter(Boolean).map(t=>"<p>"+t.split("\n").map(escH).join("<br>")+"</p>").join("");
function edSubs(){const top=PCATS.find(c=>!c.parent&&c.name===$("edCat").value);return top?PCATS.filter(c=>c.parent===top.id):[]}
function edCatFill(cur){$("edCat").innerHTML=`<option value="">未分類</option>`+PCATS.filter(c=>!c.parent).map(c=>`<option value="${escH(c.name)}"${c.name===cur?" selected":""}>${escH(c.name)}</option>`).join("")}
function edRefreshSel(){const cur=$("edCat").value,sub=$("edSub").value;edCatFill(cur);edSubFill(sub)}
function edSubFill(cur){$("edSub").innerHTML=`<option value="">無</option>`+edSubs().map(c=>`<option value="${escH(c.name)}"${c.name===cur?" selected":""}>${escH(c.name)}</option>`).join("")}
function edBtns(p){
  $("edBtns").innerHTML=`<button type="button" class="pill" data-es="preview">預覽</button><button type="button" class="pill" data-es="draft">存成草稿</button><button type="button" class="pill" data-es="published">${p.status==="published"?"更新上架":"上架發布"}</button>${p.status==="published"?'<button type="button" class="pill" data-es="draft">改回草稿</button>':""}${p.id?'<button type="button" class="pill" data-es="del">刪除文章</button>':""}<button type="button" class="pill" data-es="back">回列表</button>`;
}
function postEditorOpen(p){
  p=p||{};EDP=p;const box=$("anNew");
  const tops=PCATS.filter(c=>!c.parent);
  box.innerHTML=`<h3 class="adm-h">${p.id?"編輯文章":"新增文章"}</h3>
  <div class="ed2">
    <div class="ed2-main">
      <textarea id="edT" class="ed2-title" rows="1" maxlength="120" placeholder="文章標題">${escH(p.title||"")}</textarea>
      <div class="ed2-body" id="edB" contenteditable="true" spellcheck="false" aria-label="文章內文"></div>
      <button type="button" class="ed2-del" id="edDel" hidden>刪除</button>
      <button type="button" class="ed2-plus" id="edPlus" hidden aria-label="加入內容">+</button>
      <div class="ed2-pm" id="edPM" hidden><button type="button" data-eplus="img">圖片</button><button type="button" data-eplus="hr">分隔線（· · ·）</button></div>
      <div class="ed2-tb" id="edTB" hidden role="toolbar" aria-label="文字格式"><button type="button" data-ec="h3">副標</button><button type="button" data-ec="p">內文</button><button type="button" data-ec="blockquote">引言</button><button type="button" data-ec="bold"><b>B</b></button><button type="button" data-ec="italic"><i>I</i></button></div>
      <p class="pe-hint">選取文字會出現格式工具。在空白行按「＋」可加入圖片。</p>
    </div>
    <aside class="ed2-side is-closed"><button type="button" class="ed2-stog" id="edSTog" aria-expanded="false"><span>文章設定（分類、封面、摘要、SEO）</span><i class="ed2-sico" aria-hidden="true"></i></button>
      <label>分類<select id="edCat"><option value="">未分類</option>${tops.map(c=>`<option value="${escH(c.name)}"${c.name===p.cat?" selected":""}>${escH(c.name)}</option>`).join("")}</select></label>
      <label>子分類<select id="edSub"></select></label>
      <details class="ed2-seo" id="edCatD"><summary>管理分類（新增、改名、刪除）</summary><div id="edCatBox"></div></details>
      <label>摘要（列表上顯示）<textarea id="edSum" rows="3" maxlength="300">${escH(p.summary||"")}</textarea></label>
      <div class="ed2-cov"><span>封面圖</span><div class="ed2-covp" id="edCovP">${p.cover&&ED_IMG.test(p.cover)?`<img src="${escH(p.cover)}" alt="">`:"<em>尚未設定</em>"}</div><label class="ed2-cover-box" for="edCovF">點擊上傳封面</label><input type="file" id="edCovF" accept="image/*"><button type="button" class="pill" id="edCovB">從內文選封面</button> <button type="button" class="pill" id="edCovX"${p.cover?"":" hidden"}>移除封面</button><div id="edCovPick" class="ed2-covpick" hidden></div></div>
      <details class="ed2-seo"><summary>SEO 設定（可留空）</summary>
        <label>SEO 標題<input id="edSt" maxlength="70" value="${escH(p.seoTitle||"")}"></label>
        <label>SEO 描述<textarea id="edSd" rows="2" maxlength="180">${escH(p.seoDesc||"")}</textarea></label></details>
      <div class="pe-btns" id="edBtns"></div>
      <p id="edMsg" class="adm-msg" aria-live="polite"></p>
    </aside>
  </div>`;
  $("edB").innerHTML=sanitizeBody(bodyIsHtml(p.body)?p.body:legacyToHtml(p.body));
  edCatFill(p.cat||"");
  edSubFill(p.sub||"");
  $("edSTog").onclick=()=>{const a=$("edSTog").closest(".ed2-side");const closed=a.classList.toggle("is-closed");$("edSTog").setAttribute("aria-expanded",String(!closed))};
  $("edCatD").addEventListener("toggle",()=>{if($("edCatD").open)catPanel("edCatBox",edRefreshSel)});
  edBtns(p);
  const t=$("edT");const fit=()=>{t.style.height="auto";t.style.height=t.scrollHeight+"px"};t.addEventListener("input",fit);fit();
  $("edCat").onchange=()=>edSubFill("");
  $("edB").addEventListener("click",edSelect);$("edDel").onclick=()=>{if(EDSEL)EDSEL.remove();EDSEL=null;$("edDel").hidden=true};
  $("edB").addEventListener("keyup",edPlace);$("edB").addEventListener("click",edPlace);$("edB").addEventListener("input",edPlace);
  $("edTB").addEventListener("mousedown",e=>{const b=e.target.closest("[data-ec]");if(!b)return;e.preventDefault();edFmt(b.dataset.ec)});
  $("edPlus").onclick=()=>{$("edPM").hidden=!$("edPM").hidden};
  $("edPM").onclick=e=>{const b=e.target.closest("[data-eplus]");if(!b)return;$("edPM").hidden=true;if(b.dataset.eplus==="hr"){edHrInsert();return}edPickImage(async f=>{const url=await edUpload(f,"posts/images",$("edMsg"));if(url)edImgInsert(url)})};
  $("edCovF").onchange=async e=>{const f=e.target.files[0];if(!f)return;const url=await edUpload(f,"posts/covers",$("edMsg"));e.target.value="";if(!url)return;
    EDP.cover=url;$("edCovP").innerHTML=`<img src="${escH(url)}" alt="">`;$("edCovX").hidden=false;$("edMsg").textContent="封面已上傳，記得按存檔。"};
  $("edCovB").onclick=()=>edCovPick(false);
  $("edCovX").onclick=()=>{EDP.cover="";$("edCovP").innerHTML="<em>尚未設定</em>";$("edCovX").hidden=true;$("edMsg").textContent="封面已移除，記得按存檔。"};
  $("edBtns").onclick=e=>{const b=e.target.closest("[data-es]");if(b)edSave(b.dataset.es)};
}
function edSelect(e){const t=e.target,del=$("edDel");
  if(t.tagName==="IMG"||t.tagName==="HR"){EDSEL=t;const r=t.getBoundingClientRect(),pr=$("edB").parentElement.getBoundingClientRect();del.style.top=(r.top-pr.top+4)+"px";del.style.left=Math.max(0,r.right-pr.left-80)+"px";del.hidden=false}
  else{del.hidden=true;EDSEL=null}}
function openPreview(){
  const sub=$("edSub").value,cats=[$("edCat").value,sub&&sub!=="無"?sub:""].filter(Boolean).join("・");
  const cover=EDP&&EDP.cover&&ED_IMG.test(EDP.cover)?`<img class="blg-cover" src="${escH(EDP.cover)}" alt="">`:"";
  $("admPvBody").innerHTML=`<div class="pv-cat2"><span>${escH(cats||"未分類")}</span><span>${escH(fmtD(Date.now()))}</span></div><h1 class="pv-t2">${escH($("edT").value||"（未填標題）")}</h1><hr class="pv-rule2"><div class="blg-body">${sanitizeBody($("edB").innerHTML)}</div>`;
  $("admPv").hidden=false;
}
function edSelChange(){
  const tb=$("edTB"),B=$("edB");if(!tb||!B)return;
  const sel=window.getSelection();
  if(!sel||!sel.rangeCount||sel.isCollapsed||!B.contains(sel.anchorNode)){tb.hidden=true;return}
  const r=sel.getRangeAt(0).getBoundingClientRect();
  tb.hidden=false;tb.style.top=Math.max(8,r.top-48)+"px";tb.style.left=Math.max(8,Math.min(window.innerWidth-300,r.left))+"px";
}
function edFmt(c){
  if(c==="bold")document.execCommand("bold");
  else if(c==="italic")document.execCommand("italic");
  else document.execCommand("formatBlock",false,"<"+c+">");
}
function edPlace(){
  const B=$("edB"),plus=$("edPlus"),pm=$("edPM");const sel=window.getSelection();
  if(!sel||!sel.rangeCount||!B.contains(sel.anchorNode)){plus.hidden=true;pm.hidden=true;return}
  const n=sel.anchorNode;const blk=n.nodeType===1?n:n.parentElement;
  const empty=blk&&blk!==B&&B.contains(blk)&&blk.textContent.trim()===""&&!blk.querySelector("img");
  if(!empty){plus.hidden=true;pm.hidden=true;return}
  const r=blk.getBoundingClientRect(),pr=B.parentElement.getBoundingClientRect();
  plus.style.top=(r.top-pr.top+4)+"px";pm.style.top=(r.top-pr.top+38)+"px";plus.hidden=false;
}
function edPickImage(cb){const f=document.createElement("input");f.type="file";f.accept="image/*";f.onchange=()=>{if(f.files&&f.files[0])cb(f.files[0])};f.click()}
async function edUpload(file,folder,msgEl){
  if(!/^image\//.test(file.type)){msgEl.textContent="請選擇圖片檔。";return null}
  if(file.size>5*1024*1024){msgEl.textContent="圖片請小於 5 MB。";return null}
  msgEl.textContent="上傳中…";
  try{const url=await Promise.race([FB.upload(file,folder),new Promise((_,rj)=>setTimeout(()=>rj(new Error("timeout")),20000))]);msgEl.textContent="";return url}
  catch(e){msgEl.textContent=e&&e.message==="timeout"?"上傳逾時：請確認 Storage 已在控制台開通，並已發布 storage.rules。":"上傳失敗：請確認 Storage 已開通並已發布 storage.rules。";return null}
}
function edHrInsert(){
  const B=$("edB"),sel=window.getSelection();
  let blk=sel&&sel.rangeCount&&B.contains(sel.anchorNode)?sel.anchorNode:null;
  if(blk&&blk.nodeType===3)blk=blk.parentElement;
  const hr=document.createElement("hr");
  if(blk&&blk!==B&&B.contains(blk)){if(blk.textContent.trim()===""&&!blk.querySelector("img"))blk.replaceWith(hr);else blk.after(hr)}else B.appendChild(hr);
  const nx=document.createElement("p");nx.innerHTML="<br>";hr.after(nx);
  const rg=document.createRange();rg.setStart(nx,0);rg.collapse(true);const s=window.getSelection();s.removeAllRanges();s.addRange(rg);
}
function edImgInsert(url){
  const B=$("edB"),sel=window.getSelection();
  const img=document.createElement("img");img.src=url;img.alt="";
  let blk=sel&&sel.rangeCount&&B.contains(sel.anchorNode)?sel.anchorNode:null;
  if(blk&&blk.nodeType===3)blk=blk.parentElement;
  const wrap=document.createElement("p");wrap.appendChild(img);
  if(blk&&blk!==B&&B.contains(blk)){if(blk.textContent.trim()===""&&!blk.querySelector("img"))blk.replaceWith(wrap);else blk.after(wrap)}else B.appendChild(wrap);
  const nx=document.createElement("p");nx.innerHTML="<br>";wrap.after(nx);
  const rg=document.createRange();rg.setStart(nx,0);rg.collapse(true);const s=window.getSelection();s.removeAllRanges();s.addRange(rg);
}
function makeSlug(){return "p"+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function edCovPick(force){
  const box=$("edCovPick");const imgs=[...$("edB").querySelectorAll("img")].map(i=>i.getAttribute("src")).filter(x=>ED_IMG.test(x||""));
  if(!imgs.length){box.hidden=true;$("edMsg").textContent="內文還沒有圖片，請先在內文插入圖片。";return}
  box.hidden=false;
  box.innerHTML=`<p class="ed2-covhint">${force?"發布前請點一張內文圖片當封面：":"點一張內文圖片當封面："}</p><div class="ed2-covgrid">${imgs.map((x,i)=>`<button type="button" class="ed2-covitem${x===EDP.cover?" on":""}" data-cp="${i}"><img src="${escH(x)}" alt=""></button>`).join("")}</div>${force?'<button type="button" class="pill" id="edNoCov">不設封面，直接發布</button>':""}`;
  box.onclick=e=>{
    const b=e.target.closest("[data-cp]");
    if(b){EDP.cover=imgs[+b.dataset.cp];$("edCovP").innerHTML=`<img src="${escH(EDP.cover)}" alt="">`;$("edCovX").hidden=false;box.hidden=true;box.innerHTML="";
      if(force)edSave("published",true);else $("edMsg").textContent="已設為封面，記得按上架或存檔。";return}
    if(e.target.closest("#edNoCov")){box.hidden=true;box.innerHTML="";edSave("published",true)}
  };
}
async function edSave(a,skipCov){
  const msg=$("edMsg");
  if(a==="back"){admGo("list");return}
  if(a==="del"){if(!EDP||!EDP.id)return;if(!confirm("確定要刪除這篇文章嗎？刪除後無法復原。"))return;
    try{await FB.postDel(EDP.id);admGo("list")}catch(e){msg.textContent="刪除失敗，請稍後再試。"}return}
  const title=$("edT").value.trim();
  if(!title){msg.textContent="請先填寫標題。";return}
  if(a==="preview"){openPreview();return}
  const status=a==="draft"?"draft":"published";
  if(status==="published"&&!EDP.cover&&!skipCov&&$("edB").querySelector("img")){edCovPick(true);msg.textContent="";return}
  const data={title,slug:EDP.slug||makeSlug(),cat:$("edCat").value,sub:$("edSub").value,summary:$("edSum").value.trim(),cover:EDP.cover||"",body:sanitizeBody($("edB").innerHTML),seoTitle:$("edSt").value.trim(),seoDesc:$("edSd").value.trim(),status,publishedAt:EDP.publishedAt||(status==="published"?Date.now():null)};
  msg.textContent="儲存中…";
  try{const id=await FB.postSave(EDP.id||null,data);EDP={...EDP,...data,id};edBtns(EDP);
    msg.textContent=status==="draft"?"已存成草稿 ✓":"已上架發布 ✓"}
  catch(e){msg.textContent="儲存失敗，請稍後再試。"}
}
/* 翠誌：公開列表與單篇文章 */
function blgFont(){try{if(document.getElementById("blgFontL"))return;const l=document.createElement("link");l.id="blgFontL";l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap";document.head.appendChild(l)}catch(e){}}
const catTxt=p=>[p.cat,p.sub||p.level].filter(Boolean).join("・");
async function blogOpen(){blgFont();const L=$("blgList");if(BLOG){blogR();return}
  L.innerHTML='<li class="blg-empty">讀取中…</li>';
  try{await fbLoad();BLOG=(await FB.postsPub()).sort((a,b)=>(b.publishedAt||0)-(a.publishedAt||0));blgFilterR();blogR()}
  catch(e){L.innerHTML='<li class="blg-empty">文章載入失敗，請重新整理後再試。</li>'}}
let BLOG_F="";
function blgMatch(p){if(!BLOG_F)return true;if(BLOG_F.startsWith("c:"))return p.cat===BLOG_F.slice(2);const [c,sub]=BLOG_F.slice(2).split("|");return p.cat===c&&p.sub===sub}
function blgFilterR(){const ul=$("blgFMenu");if(!ul)return;const m=new Map();
  BLOG.forEach(p=>{if(!p.cat)return;if(!m.has(p.cat))m.set(p.cat,new Set());if(p.sub)m.get(p.cat).add(p.sub)});
  const item=(v,txt,sub)=>`<li role="option" data-v="${escH(v)}" class="${sub?"sub":""}${BLOG_F===v?" on":""}" aria-selected="${BLOG_F===v}">${escH(txt)}</li>`;
  let h=item("","全部文章");
  m.forEach((subs,c)=>{h+=item("c:"+c,c);subs.forEach(sb=>{h+=item(`s:${c}|${sb}`,sb,true)})});
  ul.innerHTML=h;$("blgFilter").hidden=!BLOG.length;$("blgFBtn").classList.toggle("on",!!BLOG_F);}
function blgMenu(open){const ul=$("blgFMenu"),btn=$("blgFBtn");ul.hidden=!open;btn.setAttribute("aria-expanded",String(open))}
function blogR(){const L=$("blgList");
  const all=BLOG,list=all.filter(blgMatch);
  L.innerHTML=list.length?list.map((p,i)=>`<li class="blg-item" style="--i:${i}"><button type="button" class="blg-go" data-post="${escH(p.id)}"><span class="blg-thumb" aria-hidden="true">${p.cover&&ED_IMG.test(p.cover)?`<img src="${escH(p.cover)}" alt="">`:""}</span><span class="blg-txt"><span class="blg-line"><span>${escH(catTxt(p))}</span><time>${p.publishedAt?escH(fmtD(p.publishedAt)):""}</time></span><b class="blg-tt">${escH(p.title)}</b><span class="blg-sm">${escH(p.summary||"")}</span></span></button></li>`).join(""):`<li class="blg-empty">${all.length?"這個分類還沒有文章。":"文章即將上架，敬請期待。"}</li>`}
function postView(p){if(!p)return;$("pstCat").textContent=catTxt(p);$("pstT").textContent=p.title||"";$("pstMeta").textContent=p.publishedAt?fmtD(p.publishedAt):"";
  const cv=$("pstCover");if(cv){cv.hidden=true;cv.removeAttribute("src")}
  const B=$("pstBody");B.innerHTML="";
  if(bodyIsHtml(p.body)){B.innerHTML=sanitizeBody(p.body)}
  else String(p.body||"").split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean).forEach(t=>{const el=document.createElement("p");t.split("\n").forEach((ln,i)=>{if(i)el.appendChild(document.createElement("br"));el.appendChild(document.createTextNode(ln))});B.appendChild(el)});
  view("post")}
$("blgFBtn").onclick=e=>{e.stopPropagation();blgMenu($("blgFMenu").hidden)};
$("blgFMenu").onclick=e=>{const li=e.target.closest("[data-v]");if(!li)return;BLOG_F=li.dataset.v;blgFilterR();blgMenu(false);blogR()};
document.addEventListener("click",e=>{if(!e.target.closest("#blgFilter"))blgMenu(false)});
$("blgList").onclick=e=>{const b=e.target.closest("[data-post]");if(b&&BLOG)postView(BLOG.find(p=>p.id==b.dataset.post))};
$("vPost").onclick=e=>{if(e.target.closest("[data-blogback]")){e.preventDefault();view("blog")}};
{const ab=$("admBtn");if(ab)ab.onclick=()=>view("admin");}
$("memAdm").onclick=()=>{memClose();view("admin")};
function memClose(){$("mem").hidden=true;document.body.classList.remove("mem-on");$("memCf").hidden=true;$("memMsg").textContent="";$("memMsg2").textContent=""}
function memR(){$("memOut").hidden=!!ME;$("memIn").hidden=!ME;if(!ME)return;
  $("memAv").src=ME.photoURL||"";$("memAv").hidden=!ME.photoURL;$("memNm").textContent=ME.displayName||"會員";$("memEm").textContent=ME.email||"";
  const L=$("memList");if(!MLIST.length){L.innerHTML=`<li class="mem-empty">還沒有存任何星盤。排好星盤後，按「存星盤」就會出現在這裡。</li>`;return}
  L.innerHTML=MLIST.map((c,i)=>{const [y,m,d]=(c.date||"").split("-");return `<li data-i="${i}"><button type="button" class="mem-open" data-act="open"><b>${escH(c.nm||"未命名星盤")}</b><small>${y?`${+y}/${+m}/${+d}`:""} ${escH(c.time)}｜${escH(c.place)}</small></button><button type="button" class="mem-ic" data-act="ren" aria-label="改名"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5-4-4L4 16z M13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></button><button type="button" class="mem-ic" data-act="del" aria-label="刪除"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg></button></li>`}).join("")}
async function memLoad(){if(!ME)return;try{MLIST=await FB.list()}catch(e){mmsg("讀取星盤失敗，請稍後再試。")}memR()}
const sameQ=(a,b)=>["date","time","lat","lon","hs"].every(k=>String(a[k])==String(b[k]));
async function saveChart(){const b=$("saveC");if(!LASTQ){return}
  if(!ME){PEND=true;memOpen("登入後就能把這張星盤存起來。");return}
  const q={...LASTQ};if(!q.nm||!q.nm.trim())q.nm="未命名星盤";
  try{const ex=MLIST.find(c=>sameQ(c,q));if(ex)await FB.update(ex.id,q);else await FB.add(q);await memLoad();
    if(b){b.classList.add("done");b.querySelector("span").textContent="已存 ✓";clearTimeout(b._t);b._t=setTimeout(()=>{b.classList.remove("done");b.querySelector("span").textContent="存星盤"},1800)}
    if(!$("mem").hidden)mmsg("已存到星盤存檔 ✓",1)}
  catch(e){if(!$("mem").hidden)mmsg("儲存失敗，請稍後再試。");else if(b){b.querySelector("span").textContent="儲存失敗";setTimeout(()=>b.querySelector("span").textContent="存星盤",1800)}}}
$("saveC").onclick=saveChart;
$("acct").onclick=()=>{memOpen();if(ME)memLoad()};
document.addEventListener("click",e=>{if(e.target.closest("[data-mclose]"))memClose();const pv=e.target.closest("[data-pv],[data-tm]");if(pv){e.preventDefault();memClose();view(pv.hasAttribute("data-tm")?"terms":"privacy")}});
document.addEventListener("keydown",e=>{if(e.key=="Escape"&&!$("mem").hidden)memClose()});
$("memLogin").onclick=async()=>{const b=$("memLogin");if(!window.FB){mmsg("載入中，請稍等一下再按一次。");fbLoad().catch(()=>{});return}
  b.disabled=true;mmsg("");try{await FB.login()}catch(e){const c=e&&e.code||"";PEND=false;
    mmsg(c=="auth/popup-closed-by-user"||c=="auth/cancelled-popup-request"?"登入已取消。":c=="auth/popup-blocked"?"登入視窗被瀏覽器擋住了，請允許彈出視窗後再試一次。":c=="auth/unauthorized-domain"?"這個網址還沒開放登入，請聯絡站長。":"登入失敗，請稍後再試。")}
  b.disabled=false};
$("memOutBtn").onclick=async()=>{try{await FB.logout()}catch(e){}memClose()};
$("memList").onclick=async e=>{const b=e.target.closest("[data-act]");if(!b)return;const c=MLIST[+b.closest("li").dataset.i];if(!c)return;const a=b.dataset.act;
  if(a=="open"){applyQ(c);NOWM=false;memClose();view("chart");compute();if(ST){saveQ();LASTQ=snapQ()}if($("f").classList.contains("folded"))$("fsum").textContent=fsumTxt();if(typeof mbarR=="function")mbarR();return}
  const li=b.closest("li");
  if(a=="ren"){li.innerHTML=`<form class="mem-rn"><input value="${escH(c.nm||"")}" maxlength="40" aria-label="星盤名稱"><button type="submit" class="pill">儲存</button><button type="button" class="pill" data-act="cancel">取消</button></form>`;const ip=li.querySelector("input");ip.focus();ip.select();
    li.querySelector("form").onsubmit=async ev=>{ev.preventDefault();const v=ip.value.trim()||"未命名星盤";try{await FB.rename(c.id,v);c.nm=v}catch(er){mmsg("改名失敗，請稍後再試。")}memR()};return}
  if(a=="cancel"){memR();return}
  if(a=="del"){li.innerHTML=`<div class="mem-dq"><span>刪除「${escH(c.nm||"未命名星盤")}」？</span><button type="button" class="pill" data-act="cancel">取消</button><button type="button" class="pill mem-cf-y" data-act="delok">刪除</button></div>`;return}
  if(a=="delok"){try{await FB.del(c.id);MLIST=MLIST.filter(x=>x!==c)}catch(er){mmsg("刪除失敗，請稍後再試。")}memR()}};
$("memDelAcc").onclick=()=>{$("memCf").hidden=false};
$("memCfNo").onclick=()=>{$("memCf").hidden=true};
$("memCfYes").onclick=async()=>{const b=$("memCfYes");b.disabled=true;try{await FB.deleteAccount();memClose()}catch(e){mmsg("刪除失敗，請重新登入後再試一次。")}b.disabled=false;$("memCf").hidden=true};
(()=>{let s=null;try{s=localStorage.getItem(MKEY)}catch(e){}const go=()=>fbLoad().then(()=>{try{if(sessionStorage.getItem("cuicui-visit"))return;sessionStorage.setItem("cuicui-visit","1")}catch(e){}FB.visit()}).catch(()=>{});if(s)setTimeout(go,400);else if(window.requestIdleCallback)requestIdleCallback(go,{timeout:4000});else setTimeout(go,2500)})();

/* ---------- 占星筆記（未登入存在裝置；登入後存在帳號） ---------- */
const LKN="cuicui-notes-v1",NPRE=["行星","星座","宮位","相位","自我覺察","生活觀察","其他"];
let NOTES=[],NREADY=false;
const NST={};
function nLocal(){try{return JSON.parse(localStorage.getItem(LKN)||"[]")}catch(e){return []}}
function nLocalSave(a){try{localStorage.setItem(LKN,JSON.stringify(a))}catch(e){}}
function nDate(t){const d=new Date(t||Date.now());return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`}
function nCats(){const s=new Set(NPRE);NOTES.forEach(n=>n.cat&&s.add(n.cat));return [...s]}
async function notesOnUser(u){
  if(u){try{const loc=nLocal();if(loc.length){for(const n of loc.slice().reverse())await FB.nAdd(n);nLocalSave([])}NOTES=await FB.nList()}catch(e){NOTES=[];nMsg("筆記讀取失敗，請稍後再試。")}}
  else NOTES=nLocal();
  NREADY=true;NRA()}
function nMsg(t){document.querySelectorAll(".nt-msg").forEach(m=>{m.textContent=t||""})}
function NRA(){[$("notes"),$("notesM")].forEach(r=>r&&NR(r));const dl=$("ntCats");if(dl)dl.innerHTML=nCats().map(c=>`<option value="${escH(c)}">`).join("")}
function NR(root){const st=NST[root.id]||(NST[root.id]={mode:"list",id:null,f:""});
  if(st.mode=="edit"){const n=st.id?NOTES.find(x=>x.id==st.id):null;if(st.id&&!n){st.mode="list";return NR(root)}
    if(root.querySelector(".nt-ed")&&root.dataset.eid==(st.id||"new"))return;
    root.dataset.eid=st.id||"new";
    root.innerHTML=`<form class="nt-ed" autocomplete="off"><label><span>分類</span><input class="nt-c" list="ntCats" maxlength="30" placeholder="例如：太陽、自我覺察" value="${escH(n?n.cat:(st.f||""))}"></label>
      <label><span>標題</span><input class="nt-t" maxlength="80" placeholder="筆記主標" value="${escH(n?n.title:"")}"></label>
      <label class="nt-bl"><span>內文</span><textarea class="nt-b" maxlength="5000" placeholder="看著卡牌，寫下你的練習與聯想…">${escH(n?n.body:"")}</textarea></label>
      <p class="nt-msg" aria-live="polite"></p>
      <div class="nt-btns"><button type="button" class="nt-back">← 返回</button><span>${n?'<button type="button" class="pill nt-del">刪除</button>':""}<button type="submit" class="pill nt-save">儲存</button></span></div>
      <div class="nt-dq" hidden><span>確定刪除這則筆記？</span><button type="button" class="pill nt-dno">取消</button><button type="button" class="pill mem-cf-y nt-dok">刪除</button></div></form>`;
    const f=root.querySelector("form");
    f.querySelector(".nt-back").onclick=()=>{st.mode="list";st.id=null;NR(root)};
    f.onsubmit=async e=>{e.preventDefault();const o={cat:f.querySelector(".nt-c").value.trim()||"未分類",title:f.querySelector(".nt-t").value.trim()||"未命名筆記",body:f.querySelector(".nt-b").value};
      const m=f.querySelector(".nt-msg"),b=f.querySelector(".nt-save");b.disabled=true;m.textContent="";
      try{if(ME){if(st.id){await FB.nUpd(st.id,o);Object.assign(NOTES.find(x=>x.id==st.id),o,{updated:Date.now()})}else{const id=await FB.nAdd(o);NOTES.unshift({id,...o,created:Date.now(),updated:Date.now()});st.id=id}}
        else{const a=nLocal();if(st.id){const x=a.find(x=>x.id==st.id);if(x)Object.assign(x,o,{updated:Date.now()})}else{st.id="l"+Date.now();a.unshift({id:st.id,...o,created:Date.now(),updated:Date.now()})}a.sort((p,q)=>q.updated-p.updated);nLocalSave(a);NOTES=a}
        NOTES.sort((p,q)=>q.updated-p.updated);root.dataset.eid=st.id;m.textContent="已儲存 ✓";m.className="nt-msg ok";
        if(!f.querySelector(".nt-del")){const sp=f.querySelector(".nt-btns span");sp.insertAdjacentHTML("afterbegin",'<button type="button" class="pill nt-del">刪除</button>');bindDel()}
        [$("notes"),$("notesM")].forEach(r=>r&&r!==root&&NR(r));const dl=$("ntCats");if(dl)dl.innerHTML=nCats().map(c=>`<option value="${escH(c)}">`).join("")}
      catch(er){m.textContent="儲存失敗，請稍後再試。";m.className="nt-msg"}b.disabled=false};
    const bindDel=()=>{const d=f.querySelector(".nt-del");if(d)d.onclick=()=>{f.querySelector(".nt-dq").hidden=false}};bindDel();
    f.querySelector(".nt-dno").onclick=()=>{f.querySelector(".nt-dq").hidden=true};
    f.querySelector(".nt-dok").onclick=async()=>{try{if(ME)await FB.nDel(st.id);else nLocalSave(nLocal().filter(x=>x.id!=st.id));NOTES=NOTES.filter(x=>x.id!=st.id);st.mode="list";st.id=null;NRA()}catch(er){f.querySelector(".nt-msg").textContent="刪除失敗，請稍後再試。"}};
    return}
  root.dataset.eid="";
  const cats=[...new Set(NOTES.map(n=>n.cat||"未分類"))],L=NOTES.filter(n=>!st.f||(n.cat||"未分類")==st.f);if(st.f&&!cats.includes(st.f))st.f="";
  root.innerHTML=`<div class="nt-top"><select class="nt-f" aria-label="依分類篩選"><option value="">全部分類（${NOTES.length}）</option>${cats.map(c=>`<option value="${escH(c)}"${c==st.f?" selected":""}>${escH(c)}（${NOTES.filter(n=>(n.cat||"未分類")==c).length}）</option>`).join("")}</select><button type="button" class="pill nt-new">＋ 新增筆記</button></div>
    ${ME?"":`<p class="nt-hint">筆記目前只存在這台裝置。<button type="button" class="nt-login">登入</button>後會存到帳號，換手機或電腦也看得到。</p>`}
    <p class="nt-msg" aria-live="polite"></p>
    <ul class="nt-list">${L.length?L.map(n=>`<li><button type="button" data-nid="${escH(n.id)}"><span class="nt-cat">${escH(n.cat||"未分類")}</span><b>${escH(n.title||"未命名筆記")}</b><small>${nDate(n.updated)}${n.body?"・"+escH(n.body.replace(/\s+/g," ").slice(0,40)):""}</small></button></li>`).join(""):`<li class="nt-empty">${NREADY||!ME?"還沒有筆記。看著卡牌，把想到的句子寫下來吧。":"載入中…"}</li>`}</ul>`;
  root.querySelector(".nt-f").onchange=e=>{st.f=e.target.value;NR(root)};
  root.querySelector(".nt-new").onclick=()=>{st.mode="edit";st.id=null;NR(root);const t=root.querySelector(".nt-t");if(t&&!MSQ.matches)t.focus()};
  const lg=root.querySelector(".nt-login");if(lg)lg.onclick=()=>{npClose();memOpen("登入後，筆記會存到你的帳號，換手機或電腦也看得到。")};
  root.querySelectorAll("[data-nid]").forEach(b=>b.onclick=()=>{st.mode="edit";st.id=b.dataset.nid;NR(root)})}
document.body.insertAdjacentHTML("beforeend",'<datalist id="ntCats"></datalist>');
/* 電腦：占星卡牌／占星筆記切換 */
function ltSet(v){document.body.dataset.lt=v;document.querySelectorAll(".ltog button").forEach(b=>{const on=b.dataset.lt==v;b.classList.toggle("on",on);b.setAttribute("aria-selected",on)});document.body.classList.remove("note-open");if($("noteBtn"))$("noteBtn").setAttribute("aria-expanded",false)}
document.querySelectorAll(".ltog button").forEach(b=>b.onclick=()=>ltSet(b.dataset.lt));ltSet("lib");
/* 會員視窗：星盤存檔／占星筆記切換 */
function mtSet(v){document.querySelectorAll(".mem-tabs button").forEach(b=>{const on=b.dataset.mt==v;b.classList.toggle("on",on);b.setAttribute("aria-selected",on)});$("memC").hidden=v!="c";$("memN").hidden=v!="n";if(v=="n")NR($("notesM"))}
document.querySelectorAll(".mem-tabs button").forEach(b=>b.onclick=()=>mtSet(b.dataset.mt));
/* 手機：筆記從下方跳出，不擋住卡牌，可一邊縮放卡牌一邊打字 */
function npOpen(){const p=$("npanel");p.hidden=false;document.body.classList.add("np-on");requestAnimationFrame(()=>{p.classList.add("on");npFit()});NR($("notes"))}
function npClose(){const p=$("npanel");if(!p||p.hidden)return;const a=document.activeElement;if(a&&p.contains(a))a.blur();p.classList.remove("on");document.body.classList.remove("np-on");setTimeout(()=>{if(!p.classList.contains("on"))p.hidden=true},260)}
function npFit(){const p=$("npanel");if(!p||p.hidden)return;const vv=window.visualViewport;if(!vv){p.style.bottom="0px";return}
  const kb=Math.max(0,Math.round(innerHeight-vv.height-vv.offsetTop));p.style.bottom=kb+"px";p.style.maxHeight=Math.round(vv.height*(kb>40?.6:.52))+"px";p.style.height=p.style.maxHeight}
if(window.visualViewport){visualViewport.addEventListener("resize",npFit);visualViewport.addEventListener("scroll",npFit)}
document.addEventListener("click",e=>{if(e.target.closest("[data-npopen]"))npOpen()});
$("npX").onclick=npClose;$("npGrab").onclick=npClose;
(()=>{let y0=null;const h=$("npanel").querySelector(".np-head");h.addEventListener("touchstart",e=>{y0=e.touches[0].clientY},{passive:true});h.addEventListener("touchend",e=>{if(y0!=null&&e.changedTouches[0].clientY-y0>50)npClose();y0=null},{passive:true})})();
NOTES=nLocal();NRA();
