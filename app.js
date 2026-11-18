/* CONFIG: add your own IDs to switch on Google and Apple sign-in. See SETUP.md. Never put secrets here. */
const CONFIG={googleClientId:"",appleServicesId:"",appleRedirectUri:""};
//<pure>
const $=id=>document.getElementById(id),f=Math.round,
esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),
fmt=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")},
hm=m=>{m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0")},
DN=["Mo","Tu","We","Th","Fr","Sa","Su"];
function eat(d){d=d||new Date();const p={};new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Nairobi",weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(d).forEach(x=>p[x.type]=x.value);return{d:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(p.weekday),m:+p.hour*60+ +p.minute}}
function parseOH(s){if(!s)return null;s=s.trim();const W=[[],[],[],[],[],[],[]];if(/^24\/7$/i.test(s)){for(let i=0;i<7;i++)W[i]=[[0,1440]];return W}
for(const r of s.split(";")){const t=r.trim();if(!t)continue;const m=t.match(/^([A-Za-z,\- ]*?)\s*((?:\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\s*,?\s*)+|off|closed)$/i);if(!m)return null;
let days=[];const dp=m[1].trim();if(!dp)days=[0,1,2,3,4,5,6];else{for(const tok of dp.split(",")){const q=tok.trim().split("-").map(x=>DN.indexOf(x.trim()));if(q.includes(-1))continue;if(q.length===1)days.push(q[0]);else for(let i=q[0];;i=(i+1)%7){days.push(i);if(i===q[1])break}}if(!days.length)continue}
const iv=/off|closed/i.test(m[2])?[]:[...m[2].matchAll(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g)].map(x=>{const a=+x[1]*60+ +x[2];let b=+x[3]*60+ +x[4];if(b<=a)b+=1440;return[a,b]});
days.forEach(d=>W[d]=iv)}return W}
function status(W,n){if(!W)return{s:"u",t:"Hours not listed"};const td=W[n.d],yd=W[(n.d+6)%7];
for(const[a,b]of td)if(n.m>=a&&n.m<b)return{s:"o",t:a===0&&b===1440?"Open 24 hours":"Open until "+hm(b)};
for(const[a,b]of yd)if(b>1440&&n.m<b-1440)return{s:"o",t:"Open until "+hm(b)};
const nx=td.filter(i=>i[0]>n.m).sort((x,y)=>x[0]-y[0])[0];if(nx)return{s:"c",t:"Closed. Opens "+hm(nx[0])};
for(let k=1;k<=7;k++){const iv=W[(n.d+k)%7];if(iv.length)return{s:"c",t:"Closed. Opens "+(k===1?"tomorrow ":DN[(n.d+k)%7]+" ")+hm(iv[0][0])}}return{s:"c",t:"Closed"}}
function km(a,b,c,d){const r=x=>x*Math.PI/180,h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return 12742*Math.asin(Math.sqrt(h))}
//</pure>
const AR=[["Nairobi CBD",-1.2864,36.8172],["Westlands",-1.2676,36.8108],["Kilimani",-1.2905,36.7870],["Lavington",-1.2790,36.7700],["Karen",-1.3190,36.7090],["Gigiri",-1.2300,36.8070],["Roysambu",-1.2190,36.8860],["Mombasa",-4.0435,39.6682],["Kisumu",-0.0917,34.7680],["Nakuru",-0.3031,36.0800],["Eldoret",0.5143,35.2698],["Nanyuki",0.0070,37.0722]];
$("area").innerHTML=AR.map((a,i)=>'<option value="'+i+'">'+a[0]+"</option>").join("");
let map,layer,P=[],pos=AR[0].slice(1),onlyOpen=false,seq=0,gps=false;
if(window.L){map=L.map("map").setView(pos,14);L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap contributors"}).addTo(map);layer=L.layerGroup().addTo(map)}else $("map").textContent="The map could not load. Check your connection and refresh."
const EP=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
async function fetchCafes(lat,lon,r){const q='[out:json][timeout:25];(node["amenity"="cafe"](around:'+r+","+lat+","+lon+');way["amenity"="cafe"](around:'+r+","+lat+","+lon+"););out center tags 150;";
for(const u of EP){try{const res=await fetch(u,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"data="+encodeURIComponent(q)});if(res.ok)return(await res.json()).elements}catch(e){}}return null}
async function search(){const id=++seq;$("cs").textContent="Searching for cafés…";$("list").innerHTML='<div class="sk"></div><div class="sk"></div><div class="sk"></div><div class="sk"></div>';const els=await fetchCafes(pos[0],pos[1],+$("rad").value);if(id!==seq)return;
if(!els){P=[];$("list").innerHTML="";$("pick").innerHTML="<option>None to show</option>";$("cs").innerHTML='Could not reach the café data service. <button class="gh sm" id="rt2">Try again</button>';$("rt2").onclick=search;return}
P=els.filter(e=>e.tags&&e.tags.name).map(e=>{const la=e.lat!==undefined?e.lat:e.center.lat,lo=e.lon!==undefined?e.lon:e.center.lon,t=e.tags;return{n:t.name,la,lo,d:km(pos[0],pos[1],la,lo),oh:t.opening_hours||"",w:t.website||t["contact:website"]||"",W:parseOH(t.opening_hours),a:[t["addr:street"],t["addr:suburb"]].filter(Boolean).join(", ")}}).sort((a,b)=>a.d-b.d);draw()}
function draw(){const n=eat();P.forEach(p=>p.st=status(p.W,n));const qn=$("cq").value.trim().toLowerCase(),show=P.filter(p=>(!onlyOpen||p.st.s==="o")&&(!qn||p.n.toLowerCase().includes(qn))),hid=P.length-show.length;
$("cs").textContent=P.length?(onlyOpen?show.length+" open now"+(hid?". "+hid+" hidden: closed or no hours listed.":"."):(qn?show.length+" of "+P.length+" match your search.":P.length+" cafés found, nearest first.")):($("cs").textContent.startsWith("Could")?$("cs").textContent:"No cafés found in this radius. Try a larger one.");
$("pick").innerHTML=show.length?show.map((p,i)=>'<option value="'+i+'">'+esc(p.n)+" · "+p.d.toFixed(1)+" km</option>").join(""):"<option>None to show</option>";
$("list").innerHTML=show.slice(0,60).map((p,i)=>'<button class="pl" style="--i:'+Math.min(i,12)+'" data-i="'+i+'"><span class="pn"><strong>'+esc(p.n)+'</strong><em>'+p.d.toFixed(1)+' km</em></span><span class="st '+p.st.s+'">'+p.st.t+'</span>'+(p.a?'<span class="mut">'+esc(p.a)+'</span>':'')+'</button>').join("");
if(map){layer.clearLayers();L.circleMarker(pos,{radius:8,color:"#fff",weight:3,fillColor:"#1565C0",fillOpacity:1}).bindTooltip("You are here").addTo(layer);
show.slice(0,60).forEach((p,i)=>{p.m=L.circleMarker([p.la,p.lo],{radius:9,weight:2,color:"#241B17",fillOpacity:.95,fillColor:p.st.s==="o"?"#2F7A3E":p.st.s==="c"?"#8A8178":"#C98A2B"}).on("click",()=>openCafe(p)).addTo(layer)});map.setView(pos,+$("rad").value>=5000?12:14)}
window.SH=show}
function focusP(i){const p=window.SH[i];if(!p)return;if(map)map.setView([p.la,p.lo],16);openCafe(p)}
$("list").onclick=e=>{const b=e.target.closest(".pl");if(b)focusP(+b.dataset.i)};$("pick").onchange=()=>focusP(+$("pick").value);
$("open").onclick=()=>{onlyOpen=!onlyOpen;$("open").setAttribute("aria-pressed",onlyOpen);draw()};
$("area").onchange=()=>{const a=AR[+$("area").value];pos=[a[1],a[2]];gps=false;search()};$("rad").onchange=search;
function near(){if(!navigator.geolocation){$("cs").textContent="Your browser cannot share location. Pick an area instead.";return}$("cs").textContent="Finding you…";
navigator.geolocation.getCurrentPosition(g=>{pos=[g.coords.latitude,g.coords.longitude];gps=true;search()},()=>{$("cs").textContent="Location is blocked. Allow it in your browser, or pick an area."},{enableHighAccuracy:true,timeout:15000})}
$("near").onclick=near;$("heroNear").onclick=()=>near();
try{navigator.permissions.query({name:"geolocation"}).then(r=>{if(r.state==="granted")near();else search()}).catch(search)}catch(e){search()}
setInterval(()=>{if(P.length)draw()},60000);

const M={
v60:{n:"V60",r:16.7,lo:14,hi:18,d:20,mg:9,g:"Medium-fine, like table salt",t:"96–100 °C, as hot as you can",E:210,tm:"3:30",tip:"Sour or thin? Grind finer. Bitter or slow to drain? Grind coarser.",
 c:(d,W)=>[[0,"Bloom: pour to "+f(2*d)+" g, then swirl","bloom"],[45,"Pour to "+f(.6*W)+" g, reaching it by 1:15","pour2"],[75,"Pour to "+f(W)+" g, reaching it by 1:45","pour3"],[105,"Stop pouring. Swirl gently and let it drain","swirl-drain"],[210,"Drawdown should be finishing. Serve and taste","done"]]},
fp:{n:"French press",r:16.7,lo:14,hi:18,d:30,mg:9,g:"Coarse, like sea salt",t:"About 96 °C",E:540,tm:"9:00",tip:"Skim and wait for a clean cup. Pour gently and leave the last bit behind.",
 c:(d,W)=>[[0,"Pour all "+f(W)+" g of water. Lid on, do not stir","pour-all"],[240,"Break the crust with a spoon and skim off the foam","skim"],[540,"Pour gently and leave the last bit in the press","pour-gently"]]},
aero:{n:"AeroPress",r:18,lo:14,hi:19,d:11,mg:9,g:"Medium-fine",t:"Just off the boil, about 96 °C",E:150,tm:"2:30",tip:"Upright or inverted both work. Press slowly and stop at the hiss.",
 c:(d,W)=>[[0,"Pour "+f(W)+" g of water","pour-all"],[110,"Swirl the AeroPress gently","swirl"],[120,"Press slowly, about 30 seconds","press"],[150,"Stop at the hiss. Done","hiss"]]},
esp:{n:"Espresso",r:2,lo:1.5,hi:3,d:18,mg:7,g:"Fine, finer than table salt",t:"92–96 °C (set by your machine)",E:30,tm:"0:25–0:30",tip:"Too fast or sour? Grind finer. Too slow or bitter? Grind coarser.",
 c:(d,W)=>[[0,"Start the shot","start-shot"],[25,"Stop at "+f(W)+" g in the cup","stop-shot"],[30,"Done. Taste it","done"]]},
cold:{n:"Cold brew",r:8,lo:5,hi:10,d:100,mg:0,g:"Coarse",t:"Cold or room-temperature water",E:0,tm:"12–18 h",tip:"Steep 12 to 18 hours in the fridge, strain through paper, then dilute with water or milk.",c:()=>[]}};
let cur="v60",run=false,t0=0,acc=0,tm=null,cues=[],fired=0,E=0,wl=null;
$("methods").innerHTML=Object.keys(M).map(k=>'<button class="chip" data-k="'+k+'">'+M[k].n+"</button>").join("");
const dose=()=>+$("dose").value||0,ratio=()=>+$("ratio").value,water=()=>dose()*ratio();
function pick(k){cur=k;const m=M[k];$("dose").value=m.d;$("ratio").min=m.lo;$("ratio").max=m.hi;$("ratio").value=m.r;render()}
function render(){const m=M[cur];$("rv").textContent=ratio();$("water").textContent=f(water())+" g";$("grind").textContent=m.g;$("temp").textContent=m.t;$("tip").textContent=m.tip;$("prol").textContent="Standard: 1:"+m.r+" · about "+m.tm;tech();
const cs=m.c(dose(),water());$("sch").innerHTML=m.E?cs.map((c,i)=>'<li data-i="'+i+'"><b>'+fmt(c[0])+"</b><span>"+c[1]+"</span></li>").join(""):"<li><span>No timer. Steep 12 to 18 hours in the fridge.</span></li>";
document.querySelectorAll("#methods .chip").forEach(b=>b.setAttribute("aria-pressed",b.dataset.k===cur));$("go").disabled=!m.E;reset()}
$("methods").onclick=e=>{if(e.target.dataset.k)pick(e.target.dataset.k)};$("dose").oninput=render;$("ratio").oninput=render;$("pro").onclick=()=>{$("ratio").value=M[cur].r;render()};
let ac;function beep(){try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.frequency.value=660;g.gain.setValueAtTime(.18,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.5);o.start();o.stop(ac.currentTime+.5)}catch(e){}}
function sound(id){if(!$("snd").checked)return;try{const a=new Audio("audio/"+id+".mp3");a.onerror=beep;a.play().catch(beep)}catch(e){beep()}try{navigator.vibrate&&navigator.vibrate(200)}catch(e){}}
async function lock(){try{wl=await navigator.wakeLock.request("screen")}catch(e){}}function unlock(){try{wl&&wl.release();wl=null}catch(e){}}
const el=()=>acc+(run?(Date.now()-t0)/1000:0),ring=p=>$("ring").style.strokeDashoffset=339.3*(1-Math.min(1,p));
function tick(){const e=el();while(fired<cues.length&&cues[fired][0]<=e){const c=cues[fired],i=fired++,q=$("cue");q.textContent=c[1];q.classList.remove("pop");void q.offsetWidth;q.classList.add("pop");const rb=document.querySelector(".ringbox");rb.classList.remove("fl");void rb.offsetWidth;rb.classList.add("fl");sound(c[2]);document.querySelectorAll("#sch li").forEach(l=>l.classList.toggle("on",+l.dataset.i===i))}
$("clock").textContent=fmt(e);ring(e/E);const n=cues[fired];$("next").textContent=n?"Next cue in "+fmt(n[0]-e):"";
if(e>=E){clearInterval(tm);run=false;acc=0;unlock();$("go").textContent="Start";let s="Brew complete.";const m=M[cur];if($("auto").checked&&m.mg){const mg=f(dose()*m.mg/Math.max(1,+$("srv").value||1));LOG.push({t:Date.now(),mg,n:m.n+" brew"});save();dc();s+=" Added about "+mg+" mg to your tracker."}$("next").textContent=s}}
function reset(){clearInterval(tm);run=false;acc=0;fired=0;unlock();$("clock").textContent="0:00";ring(0);$("go").textContent="Start";$("next").textContent="";$("cue").textContent="Press Start. Each pour is shown and sounded.";document.querySelectorAll("#sch li").forEach(l=>l.classList.remove("on"))}
$("go").onclick=()=>{if(!run){if(acc===0){cues=M[cur].c(dose(),water());E=M[cur].E;fired=0}run=true;t0=Date.now();tm=setInterval(tick,200);tick();$("go").textContent="Pause";lock()}else{acc=el();run=false;clearInterval(tm);$("go").textContent="Resume";unlock()}};$("reset").onclick=reset;

const D=[["Espresso",63],["Filter coffee",95],["Instant",62],["Tea",47],["Cola",32],["Decaf",5]];
$("qa").innerHTML=D.map((d,i)=>'<button class="chip" data-q="'+i+'">+ '+d[0]+" · "+d[1]+" mg</button>").join("");
let LOG=[],SET={};try{LOG=JSON.parse(localStorage.getItem("cn-log")||"[]");SET=JSON.parse(localStorage.getItem("cn-set")||"{}")}catch(e){}
["bed","hl","lim","bw","sens"].forEach(k=>{if(SET[k])$(k).value=SET[k];$(k).onchange=$(k).oninput=()=>{SET[k]=$(k).value;try{localStorage.setItem("cn-set",JSON.stringify(SET))}catch(e){}dc()}});
function save(){const c=Date.now()-60*864e5;LOG=LOG.filter(x=>x.t>c);try{localStorage.setItem("cn-log",JSON.stringify(LOG))}catch(e){}}
$("qa").onclick=e=>{const i=e.target.dataset.q;if(i===undefined)return;const dd=D[+i];guard(dd[1],()=>{LOG.push({t:Date.now(),mg:dd[1],n:dd[0]});save();dc()})};
$("undo").onclick=()=>{LOG.pop();save();dc()};
const hl=()=>+$("hl").value||5,KA=4,left=(mg,h)=>{const ke=Math.LN2/hl();h=Math.max(0,h);return mg*KA/(KA-ke)*(Math.exp(-ke*h)-Math.exp(-KA*h))},act=t=>LOG.reduce((a,x)=>t>=x.t?a+left(x.mg,(t-x.t)/36e5):a,0);
function dc(){const d0=new Date();d0.setHours(0,0,0,0);const s0=d0.getTime(),lim=+$("lim").value||400,now=Date.now();
const [bh,bm]=($("bed").value||"23:00").split(":");let bt=+bh*60+ +bm;const bedT=s0+(bt<300?bt+1440:bt)*6e4,cutM=(bt<300?bt+1440:bt)-480;
const tot=LOG.filter(x=>x.t>=s0).reduce((a,x)=>a+x.mg,0);$("tot").textContent=tot+" mg";
$("msg").textContent=!tot?"Nothing logged today.":tot>lim?"Over your limit by "+(tot-lim)+" mg. Choose water or decaf for the rest of the day.":(lim-tot)+" mg left today.";
$("cut").textContent="Last coffee of the day: "+hm(cutM);
const nowM=(now-s0)/6e4;$("cut").className=nowM>cutM?"warn":"ok";
const bw=+$("bw").value||70;let clr="";if(act(now)>=25)for(let q=1;q<192;q++){const tt=now+q*9e5;if(act(tt)<25){clr=" Mostly cleared (under 25 mg) by "+new Date(tt).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})+".";break}}
$("bedmsg").textContent="At bedtime about "+f(act(bedT))+" mg will still be active. Estimated blood level now: "+(act(now)/(.6*bw)).toFixed(1)+" mg/L."+clr;
const cup=bedT>now?left(95,(bedT-now)/36e5):95;$("what").innerHTML="<strong>Another cup now?</strong> It would leave about "+f(cup)+" mg at bedtime. "+(nowM>cutM?'<span class="warn">That is past your cutoff.</span>':'<span class="ok">Before your cutoff.</span>');
let pts="",mx=150;const cv=[];for(let q=0;q<=96;q++){const v=act(s0+q*15*6e4);cv.push(v);mx=Math.max(mx,v)}
const X=q=>40+q/96*540,Y=v=>160-v/mx*140;cv.forEach((v,q)=>pts+=(q?"L":"M")+X(q).toFixed(1)+" "+Y(v).toFixed(1));
const bx=40+Math.min(1440,(bt<300?bt+1440:bt))/1440*540,cx=40+Math.max(0,cutM)/1440*540,nx=40+nowM/1440*540;
$("c1").innerHTML='<svg class="ch" viewBox="0 0 600 190" role="img" aria-label="Estimated caffeine in your body across today"><path class="ar" d="'+pts+' L580 160 L40 160Z"/><path class="ln" d="'+pts+'"/><line class="bd" x1="'+bx+'" x2="'+bx+'" y1="10" y2="160"/><text x="'+(bx-4)+'" y="8" text-anchor="end">Bed</text><line class="cu" x1="'+cx+'" x2="'+cx+'" y1="10" y2="160"/><text x="'+(cx+4)+'" y="8">Cutoff</text><line x1="'+nx+'" x2="'+nx+'" y1="20" y2="160" stroke="currentColor" opacity=".4"/><text x="'+nx+'" y="176" text-anchor="middle">Now</text><text x="36" y="22" text-anchor="end">'+f(mx)+'</text><text x="36" y="160" text-anchor="end">0</text><text x="40" y="184">00</text><text x="310" y="184" text-anchor="middle">12:00</text><text x="580" y="184" text-anchor="end">24</text></svg>';
const days=[];for(let i=6;i>=0;i--){const a=s0-i*864e5,b=a+864e5;days.push([new Date(a).toLocaleDateString("en-GB",{weekday:"short"}),LOG.filter(x=>x.t>=a&&x.t<b).reduce((q,x)=>q+x.mg,0)])}
const m2=Math.max(lim*1.1,...days.map(x=>x[1]));let bars="";days.forEach((x,i)=>{const h=x[1]/m2*130,xx=50+i*76;bars+='<rect class="bar'+(x[1]>lim?" x":"")+'" x="'+xx+'" y="'+(150-h)+'" width="46" height="'+h+'" rx="6"/><text x="'+(xx+23)+'" y="168" text-anchor="middle">'+x[0]+'</text><text x="'+(xx+23)+'" y="'+(144-h)+'" text-anchor="middle">'+(x[1]||"")+"</text>"});
$("c2").innerHTML='<svg class="ch" viewBox="0 0 600 180" role="img" aria-label="Caffeine per day over the last seven days">'+bars+'<line class="lm" x1="40" x2="590" y1="'+(150-lim/m2*130)+'" y2="'+(150-lim/m2*130)+'"/><text x="590" y="'+(144-lim/m2*130)+'" text-anchor="end">Limit '+lim+"</text></svg>"}
dc();setInterval(dc,60000);
$("theme").onclick=()=>{const d=document.documentElement,dk=d.dataset.theme?d.dataset.theme==="dark":matchMedia("(prefers-color-scheme:dark)").matches;d.dataset.theme=dk?"light":"dark"};
try{const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){[...x.target.children].forEach((c,i)=>c.style.transitionDelay=i*110+"ms");x.target.classList.add("in");io.unobserve(x.target)}}),{threshold:.05});document.querySelectorAll(".rv").forEach(n=>io.observe(n))}catch(e){document.querySelectorAll(".rv").forEach(n=>n.classList.add("in"))}
const hv=$("hv"),vfb=document.querySelector("svg.v60"),vfail=()=>{hv.hidden=true;vfb.hidden=false};
hv.addEventListener("error",vfail);hv.querySelector("source").addEventListener("error",vfail);
if(matchMedia("(prefers-reduced-motion:reduce)").matches)hv.removeAttribute("autoplay");else hv.play().catch(()=>{});
const mqi=["V60 1:16.7","French press 1:16.7","AeroPress 1:18","Espresso 1:2","Cold brew 1:8","Open now, near you","Pour cues you can hear","Know when to stop for better sleep"],mh=mqi.map(t=>"<span>"+t+"</span>").join("");$("mq").innerHTML="<div>"+mh+mh+"</div>";
const hr=document.querySelector(".hero");hr.addEventListener("pointermove",e=>{const r=hr.getBoundingClientRect();hr.style.setProperty("--mx",((e.clientX-r.left)/r.width).toFixed(3));hr.style.setProperty("--my",((e.clientY-r.top)/r.height).toFixed(3))});
const pg=$("prog");let tk=0;addEventListener("scroll",()=>{if(tk)return;tk=requestAnimationFrame(()=>{tk=0;const h=document.documentElement;pg.style.transform="scaleX("+(h.scrollTop/((h.scrollHeight-h.clientHeight)||1))+")"})},{passive:true});
/* Ambience: a file at audio/ambience.mp3 plays if present, otherwise a soft synthesized jazz room (original, no samples). */
const SC=[[50,53,57,60,64],[55,59,64,65],[48,52,55,59,62],[57,60,64,67]],BS=[38,43,36,45],MN=[67,69,72,74,76,79],fq=m=>440*Math.pow(2,(m-69)/12);
let AX=null,MG,AT=[],AS=null,AI=0,amOn=false,afile=null;
function note(m,t,d,v,ty){const o=AX.createOscillator(),g=AX.createGain(),fl=AX.createBiquadFilter();o.type=ty||"triangle";o.frequency.value=fq(m);fl.type="lowpass";fl.frequency.value=1100;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.06);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(fl);fl.connect(g);g.connect(MG);o.start(t);o.stop(t+d+.1)}
function chord(){if(!AX)return;const t=AX.currentTime+.05,i=AI++%4;SC[i].forEach((m,k)=>note(m,t+k*.035,5.5,.05));note(BS[i],t,2.4,.16,"sine");note(BS[i],t+3,2.2,.1,"sine")}
function mel(){if(!amOn||!AX)return;if(Math.random()<.7)note(MN[Math.floor(Math.random()*MN.length)],AX.currentTime+.05,1.8,.04,"sine");AT.push(setTimeout(mel,900+Math.random()*2200))}
function crackle(){const n=AX.sampleRate*2,b=AX.createBuffer(1,n,AX.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()<.0007?(Math.random()*2-1)*.9:(Math.random()*2-1)*.012;const s=AX.createBufferSource(),h=AX.createBiquadFilter(),g=AX.createGain();s.buffer=b;s.loop=true;h.type="highpass";h.frequency.value=1500;g.gain.value=.18;s.connect(h);h.connect(g);g.connect(MG);s.start();return s}
function startSynth(){try{AX=new(window.AudioContext||window.webkitAudioContext)();MG=AX.createGain();MG.gain.value=0;MG.gain.linearRampToValueAtTime(.7,AX.currentTime+1.5);MG.connect(AX.destination);const dl=AX.createDelay(1),fb=AX.createGain();dl.delayTime.value=.33;fb.gain.value=.38;MG.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(AX.destination);amOn=true;chord();AT.push(setInterval(chord,5600));mel();AS=crackle()}catch(e){}}
function stopSynth(){amOn=false;AT.forEach(t=>{clearTimeout(t);clearInterval(t)});AT=[];const x=AX,s=AS;AX=null;AS=null;try{MG.gain.linearRampToValueAtTime(0,x.currentTime+.6)}catch(e){}setTimeout(()=>{try{s&&s.stop();x&&x.close()}catch(e){}},700)}
$("amb").onclick=()=>{const b=$("amb"),on=b.getAttribute("aria-pressed")!=="true";b.setAttribute("aria-pressed",on);b.classList.toggle("on",on);$("ambs").textContent=on?"Playing":"Play";
if(on){try{afile=new Audio("audio/ambience.mp3");afile.loop=true;afile.volume=.6;afile.play().catch(()=>{afile=null;if($("amb").getAttribute("aria-pressed")==="true")startSynth()})}catch(e){afile=null;startSynth()}}
else{if(afile){afile.pause();afile=null}else stopSynth()}};
/* ---- café sheet, booking hand-off, menu book, policies, sign-up gate ---- */
const toast=m=>{const t=$("toast");t.textContent=m;t.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove("on"),2800)};
const OFF=[[/art\s*caff/i,"https://www.artcaffe.co.ke"],[/java\s*house/i,"https://javahouseafrica.com"]];
function site(p){let u=p.w;if(!u){const o=OFF.find(x=>x[0].test(p.n));u=o?o[1]:""}if(!u)return"";try{const x=new URL(/^https?:\/\//i.test(u)?u:"https://"+u);if(!/^https?:$/.test(x.protocol))return"";x.searchParams.set("utm_source","coffeenomad");x.searchParams.set("utm_medium","referral");return x.href}catch(e){return""}}
let CP=null,rt=null;
function openCafe(p){CP=p;{const rc=jget("cn-rcv").filter(x=>x.k!==cafeKey(p));rc.push({k:cafeKey(p),n:p.n,a:p.a||"",t:Date.now()});jset("cn-rcv",rc.slice(-10))}$("cn").textContent=p.n;$("cs2").innerHTML='<span class="st '+p.st.s+'">'+esc(p.st.t)+"</span>"+p.d.toFixed(1)+" km"+(p.a?" · "+esc(p.a):"");$("ch2").textContent=p.oh?"Hours: "+p.oh:"Opening hours are not published for this café.";$("dir").href="https://www.google.com/maps/dir/?api=1&destination="+p.la+","+p.lo;favState();$("cd").showModal()}
$("bkt").onclick=()=>{const p=CP,u=site(p);$("cd").close();if(!u){toast("No official website is listed for "+p.n+" yet. Try Directions.");return}
$("rdn").textContent=p.n;$("rdc").textContent="4";$("rd").showModal();let n=4;clearInterval(rt);rt=setInterval(()=>{n--;$("rdc").textContent=n;if(n<=0){clearInterval(rt);go(p,u)}},1000);$("rdg").onclick=()=>{clearInterval(rt);go(p,u)}};
function go(p,u){try{const o=JSON.parse(localStorage.getItem("cn-out")||"[]");o.push({c:p.n,t:Date.now()});localStorage.setItem("cn-out",JSON.stringify(o.slice(-200)))}catch(e){}location.assign(u)}
$("rds").onclick=()=>$("rd").close();$("rd").addEventListener("close",()=>clearInterval(rt));
$("mnb").onclick=()=>{$("cd").close();openMenu(CP)};
document.addEventListener("click",e=>{const x=e.target.closest("[data-x]");if(x)x.closest("dialog").close();if(e.target.tagName==="DIALOG"&&(e.target.id==="cd"||e.target.id==="pol"))e.target.close();
const a=e.target.closest("[data-pol]");if(a){e.preventDefault();const k=POL[a.dataset.pol];$("pt").textContent=k[0];$("pb").innerHTML=k[1];if(!$("pol").open)$("pol").showModal()}});
const SM=[["Coffee","Espresso and milk",[["Espresso","Single shot",63,""],["Americano","Double shot, hot water",126,""],["Cappuccino","Double shot, steamed milk",126,"Milk"],["Latte","Double shot, more milk",126,"Milk"],["Flat white","Double shot, velvet milk",126,"Milk"],["Filter coffee","Brewed to order",95,""]]],
["Tea and more","Cold and gentle",[["Cold brew","Slow-steeped, over ice",140,""],["Black tea","Pot or cup",47,""],["Chai latte","Spiced tea, milk",50,"Milk"],["Green tea","Light and grassy",28,""],["Hot chocolate","Rich and sweet",10,"Milk"],["Fresh juice","Seasonal fruit",0,""]]],
["From the kitchen","Bites and meals",[["Avocado toast","Sourdough, lime, seeds",0,"Gluten, sesame"],["Eggs on toast","Your style",0,"Egg, gluten"],["Chicken sandwich","Grilled, greens, aioli",0,"Gluten, egg"],["Croissant","Butter, baked daily",0,"Gluten, milk"],["Pancakes","Honey and berries",0,"Gluten, egg, milk"],["Garden salad","Leaves, seeds, vinaigrette",0,"Mustard"]]]],
AD=["After dark (18+)","Adults only",[["Local beer","Ask what is on tap",0,"Alcohol, gluten"],["House wine","Red or white",0,"Alcohol, sulphites"],["Irish coffee","Whiskey, coffee, cream",63,"Alcohol, milk"]]];
let U=null;try{U=JSON.parse(localStorage.getItem("cn-user"))}catch(e){}
function menuPages(c){const L=SM.slice();if(U&&U.adult)L.push(AD);
const P=['<div class="cv"><small>Menu</small><h2>'+esc(c.n)+'</h2><p>Swipe, tap the page edges, or use the arrows to turn the page.</p><p class="al">Sample menu. The café’s official menu appears here once it claims its page. Caffeine amounts are estimates.</p></div>'];
L.forEach(g=>P.push("<h3>"+g[0]+'</h3><p class="sub">'+g[1]+"</p>"+g[2].map(i=>'<div class="it"><div><b>'+i[0]+"</b><span>"+i[1]+"</span>"+(i[3]?"<em>Contains: "+i[3]+"</em>":"")+"</div>"+(i[2]>0?'<button data-lg="'+i[0]+'" data-mg="'+i[2]+'">Log '+i[2]+" mg</button>":"")+"</div>").join("")));
P.push('<h3>Before you order</h3><p>Tell the café about any allergy or intolerance. Kitchens handle milk, lactose, gluten, eggs, nuts and sesame, so cross-contact can happen.</p><p class="al">Prices and availability are set by each café.</p>');return P}
let cp=0,PG=0;const bk=$("book");
function paint(){[...bk.children].forEach((p,i)=>{p.classList.toggle("fl",i<cp);p.style.transition="";p.style.removeProperty("--a")});$("pc").textContent=(cp+1)+" / "+PG;$("pv").disabled=cp===0;$("nx").disabled=cp===PG-1}
function flip(d){const n=cp+d;if(n<0||n>=PG)return;cp=n;paint()}
function openMenu(c){const h=menuPages(c);PG=h.length;cp=0;bk.innerHTML=h.map((x,i)=>'<section class="pg" style="z-index:'+(PG-i)+'"><div class="pi">'+x+"</div></section>").join("");paint();$("mn").showModal()}
$("pv").onclick=()=>flip(-1);$("nx").onclick=()=>flip(1);$("mx").onclick=()=>$("mn").close();
$("mn").addEventListener("keydown",e=>{if(e.key==="ArrowRight")flip(1);if(e.key==="ArrowLeft")flip(-1)});
let dx0=null,dl=null,dd=0;
bk.addEventListener("pointerdown",e=>{if(e.target.closest("button"))return;dx0=e.clientX;dd=0;dl=null});
bk.addEventListener("pointermove",e=>{if(dx0===null)return;dd=e.clientX-dx0;const lf=dd<0?bk.children[cp]:bk.children[cp-1];if(!lf||(dd<0&&cp>=PG-1)){dl=null;return}dl=lf;const q=Math.min(1,Math.abs(dd)/(bk.clientWidth*.8));lf.style.transition="none";lf.style.setProperty("--a",(dd<0?-165*q:-165+165*q)+"deg")});
function endDrag(e){if(dx0===null)return;const tap=Math.abs(dd)<6,w=bk.clientWidth,r=bk.getBoundingClientRect(),commit=Math.abs(dd)>w*.22;dx0=null;if(tap){paint();flip(e.clientX>r.left+r.width/2?1:-1)}else if(dl&&commit)flip(dd<0?1:-1);else paint();dl=null}
bk.addEventListener("pointerup",endDrag);bk.addEventListener("pointercancel",endDrag);
bk.addEventListener("click",e=>{const b=e.target.closest("[data-lg]");if(!b)return;const mg=+b.dataset.mg;guard(mg,()=>{LOG.push({t:Date.now(),mg,n:b.dataset.lg});save();dc();toast("Logged "+b.dataset.lg+": "+mg+" mg")})});
const POL={cookies:["Cookie policy","<p>Coffee Nomad stores a few small items on your device so the site works: your profile, caffeine log, theme and consent choices. They are essential and are not used to follow you across other sites.</p><p>We use no advertising or analytics cookies today. If that changes we will ask first, and you can change your mind at any time. Clear this data with your browser settings or Sign out.</p>"],
privacy:["Privacy policy","<p>We collect your name, your email and whether you are 18 or older. We do not keep your date of birth. Your location is used only to find cafés near you, only when you allow it, and is not stored.</p><p>For now your profile and caffeine log stay on this device. When accounts go live we will explain what moves to our server, and you will be able to export or delete it, in line with Kenya’s Data Protection Act, 2019.</p>"],
terms:["Terms of use","<p>Café details come from OpenStreetMap and from the cafés. They can be out of date, so confirm hours and menus with the café. A booking or order made on a café’s website is between you and the café.</p><p>Where we have an agreement with a café, Coffee Nomad may earn a referral fee when you book through our link. It never changes the price you pay.</p>"],
allergens:["Allergens and age notice","<p>Menus on Coffee Nomad are guides, not guarantees. Food may contain or touch milk, lactose, gluten, eggs, nuts, sesame or sulphites. Tell the café about allergies before you order.</p><p>Alcohol is shown only to adults aged 18 and over. Caffeine amounts are estimates, not medical advice.</p>"],
notify:["Notifications policy","<p>We send no notifications today. If you opt in to updates we will say what we send and how often, and every message will include a way to stop. You can change this at any time.</p>"]};
$("so").onclick=e=>{e.preventDefault();try{localStorage.removeItem("cn-user")}catch(x){}location.reload()};
try{if(!localStorage.getItem("cn-ck"))$("ck").hidden=false}catch(e){}$("ckb").onclick=()=>{$("ck").hidden=true;try{localStorage.setItem("cn-ck","1")}catch(e){}};
M.chemex={n:"Chemex",r:16,lo:14,hi:18,d:30,mg:9,g:"Medium-coarse, like kosher salt",t:"96–100 °C",E:270,tm:"4:30",tip:"Chemex paper is thick and drains slowly. If it stalls, grind a little coarser.",c:(d,W)=>[[0,"Bloom: pour to "+f(2*d)+" g, then swirl","bloom"],[45,"Pour to "+f(.6*W)+" g in slow circles","pour2"],[105,"Pour to "+f(W)+" g, gently","pour3"],[135,"Stop pouring. Let it drain through","swirl-drain"],[270,"Drawdown should be finishing. Remove the filter and serve","done"]]};
M.siphon={n:"Siphon",r:15.5,lo:14,hi:18,d:20,mg:9,g:"Medium, a little finer than drip",t:"About 92 °C in the upper chamber",E:150,tm:"2:30",tip:"Keep the heat low so the water stays steady. Stir gently, never hard.",c:(d,W)=>[[0,"Water has risen. Add the coffee and stir to wet every grain","pour-all"],[45,"Stir gently once more","swirl"],[75,"Remove the heat. The coffee draws down","hiss"],[150,"Drawdown complete. Serve","done"]]};
/* ---- sign-up with validation, member chip, dashboard ---- */
const DISP=["mailinator.com","yopmail.com","guerrillamail.com","10minutemail.com","tempmail.com","trashmail.com","sharklasers.com"];
function vName(s){s=String(s).normalize("NFKC").replace(/\s+/g," ").trim();if(s.length<2||s.length>60)return["Enter your full name, 2 to 60 characters."];if(!/^\p{L}[\p{L}\p{M}'’.\- ]*$/u.test(s))return["Use letters, spaces, hyphens and apostrophes only."];if(/(.)\1{4,}/.test(s))return["That does not look like a real name."];return[null,s]}
function vEmail(s){s=String(s).trim();if(!s)return["Enter your email address."];if(s.length>254)return["That email is too long."];if(s!==s.toLowerCase())return["Use lowercase letters only, like name@example.com."];const m=s.match(/^([a-z0-9][a-z0-9._%+-]{0,63})@((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24})$/);if(!m||/\.\./.test(s)||/\.@/.test(s))return["Enter a valid email, like name@example.com."];if(DISP.includes(m[2]))return["Please use a permanent email address."];return[null,s]}
function vDob(d,m,y){d=+d;m=+m;y=+y;if(!d||!m||!y||String(y).length!==4)return["Enter the day, month and a 4-digit year."];const x=new Date(y,m-1,d);if(x.getFullYear()!==y||x.getMonth()!==m-1||x.getDate()!==d)return["That date does not exist."];const n=new Date();if(x>n)return["Date of birth cannot be in the future."];let a=n.getFullYear()-y;if(n<new Date(n.getFullYear(),m-1,d))a--;if(a<13)return["You must be at least 13 to use Coffee Nomad."];if(a>120)return["Please check the year."];return[null,a]}
const fe=(id,msg,el)=>{$(id+"-e").textContent=msg||"";(el||[id]).forEach(i=>$(i).setAttribute("aria-invalid",msg?"true":"false"))};
$("gdm").innerHTML='<option value="">Month</option>'+["January","February","March","April","May","June","July","August","September","October","November","December"].map((m,i)=>'<option value="'+(i+1)+'">'+m+"</option>").join("");
["gdd","gdy"].forEach(i=>$(i).addEventListener("input",e=>{e.target.value=e.target.value.replace(/\D/g,"")}));
$("ge").addEventListener("blur",()=>{$("ge").value=$("ge").value.trim().toLowerCase();if($("ge").value)fe("ge",vEmail($("ge").value)[0])});
$("gn").addEventListener("blur",()=>{if($("gn").value)fe("gn",vName($("gn").value)[0])});
function validate(){const a=vName($("gn").value),b=vEmail($("ge").value.toLowerCase()),c=vDob($("gdd").value,$("gdm").value,$("gdy").value),t=!$("gt").checked,l=!$("ga").checked;
fe("gn",a[0]);fe("ge",b[0]);fe("gd",c[0],["gdd","gdm","gdy"]);fe("gt",t?"Please accept the terms and policies.":"");fe("ga",l?"Please acknowledge the allergen notice.":"");
return{ok:!(a[0]||b[0]||c[0]||t||l),name:a[1],email:b[1],age:c[1]}}
const first=()=>U&&U.name?U.name.split(" ")[0]:"";
function chip(){if(U){$("mem").hidden=false;$("mem").innerHTML='<span class="mi">'+esc((first()[0]||"?").toUpperCase())+'</span><span class="mn">Hi, '+esc(first())+"</span>"}}
function enter(){chip();setTimeout(()=>{if(typeof lateOnce==="function")lateOnce()},2500);$("mem").classList.add("pulse");toast("Welcome, "+first()+". Your dashboard is ready.");scrollTo({top:0,behavior:"smooth"})}
$("gguest").onclick=()=>{U={name:"Guest",email:"",adult:false,guest:true,at:Date.now()};try{localStorage.setItem("cn-user",JSON.stringify(U))}catch(x){}$("gate").close();enter()};
if(!U){$("gate").addEventListener("cancel",e=>e.preventDefault());$("gate").showModal()}else chip();
const rd=k=>{try{return JSON.parse(localStorage.getItem(k)||"[]")}catch(e){return[]}};
function dash(tab){const out=rd("cn-out"),d0=new Date();d0.setHours(0,0,0,0);const s0=d0.getTime(),td=LOG.filter(x=>x.t>=s0).reduce((a,x)=>a+x.mg,0),wk=LOG.filter(x=>x.t>=s0-6*864e5).reduce((a,x)=>a+x.mg,0),sc=(n,l)=>'<div class="sc"><b>'+n+"</b><span>"+l+"</span></div>";let h="";
$("dtabs").innerHTML=[["ov","Overview"],["ac","Activity"],["sv","Saved"],["rf","Referrals"],["pf","Profile"]].map(t=>'<button class="chip" data-t="'+t[0]+'" aria-pressed="'+(t[0]===tab)+'">'+t[1]+"</button>").join("");
if(tab==="ov")h='<div class="sg4">'+sc(td+" mg","Caffeine today")+sc(f(wk/7)+" mg","Daily average, 7 days")+sc(LOG.length,"Drinks logged")+sc(out.length,"Café sites visited")+"</div><h3>Last 7 days</h3>"+$("c2").innerHTML+"<h3>Today</h3>"+$("c1").innerHTML+'<p class="mut">Coming with the account server: saved cafés, reviews, booking history and owner tools.</p>';
if(tab==="ac")h="<h3>Caffeine log</h3>"+(LOG.length?'<ul class="ac">'+LOG.map((x,i)=>[x,i]).slice(-25).reverse().map(y=>"<li><b>"+esc(y[0].n)+"</b><span>"+y[0].mg+" mg · "+new Date(y[0].t).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"})+' <button class="gh sm" data-del="'+y[1]+'" aria-label="Delete entry">Delete</button></span></li>').join("")+"</ul>":'<p class="mut">Nothing yet. Finish a brew or tap Log on a café menu.</p>');
if(tab==="sv"){const fv=jget("cn-fav"),rp=jget("cn-recipes"),rc=jget("cn-rcv");h="<h3>Saved cafés</h3>"+(fv.length?'<ul class="ac">'+fv.map((x,i)=>"<li><b>"+esc(x.n)+'</b><span><a href="https://www.google.com/maps/search/?api=1&query='+x.la+","+x.lo+'" target="_blank" rel="noopener noreferrer">Map</a> <button class="gh sm" data-rf="'+i+'">Remove</button></span></li>').join("")+"</ul>":'<p class="mut">No saved cafés yet. Open a café and tap Save café.</p>')+"<h3>Saved recipes</h3>"+(rp.length?'<ul class="ac">'+rp.map((x,i)=>"<li><b>"+esc((M[x.m]||{n:x.m}).n)+" · "+x.d+" g · 1:"+x.r+'</b><span><button class="gh sm" data-rl="'+x.id+'">Load</button> <button class="gh sm" data-rr="'+i+'">Delete</button></span></li>').join("")+"</ul>":'<p class="mut">No saved recipes yet. Tap Save recipe in the Brew lab.</p>')+"<h3>Recently viewed</h3>"+(rc.length?'<ul class="ac">'+rc.slice().reverse().map(x=>"<li><b>"+esc(x.n)+"</b><span>"+esc(x.a)+"</span></li>").join("")+"</ul>":'<p class="mut">Nothing yet.</p>')}
if(tab==="rf"){const m={};out.forEach(o=>{m[o.c]=m[o.c]||{n:0,t:0};m[o.c].n++;m[o.c].t=Math.max(m[o.c].t,o.t)});const r=Object.entries(m).sort((a,b)=>b[1].n-a[1].n);
h='<h3>Referrals (owner preview)</h3><p class="mut">What you will see as site owner: how many people were sent to each café’s official site. Commission is earned on bookings the café confirms, at the rate you agree with them. Clicks alone do not earn it. For now these counts live on this device only.</p>'+(r.length?'<div class="tw"><table><thead><tr><th>Café</th><th>Visits sent</th><th>Last</th></tr></thead><tbody>'+r.map(x=>"<tr><td>"+esc(x[0])+"</td><td>"+x[1].n+"</td><td>"+new Date(x[1].t).toLocaleDateString("en-GB")+"</td></tr>").join("")+"</tbody></table></div>":'<p class="mut">No referrals yet. Open a café and tap Book a table now.</p>')}
if(tab==="pf")h="<h3>Profile</h3><p><b>"+esc(U?U.name:"")+"</b><br>"+esc(U&&U.email?U.email:"No email (guest)")+"<br>Age group: "+(U&&U.adult?"18 and over":"under 18")+"<br>Signed up with: "+esc(U&&U.provider?U.provider:"guest")+(U&&U.consent?"<br>Consent version "+esc(U.consent.v)+(U.consent.marketing?", updates on":", updates off"):"")+'</p><div class="ctl"><button class="gh sm" id="dx">Export my data</button><button class="gh sm" id="dd">Delete my data</button><button class="gh sm" id="dso">Sign out</button></div>';
$("dbody").innerHTML=h}
$("mem").onclick=()=>{dash("ov");$("dash").showModal()};$("dtabs").onclick=e=>{if(e.target.dataset.t)dash(e.target.dataset.t)};
$("dbody").onclick=e=>{const i=e.target.id,dl=e.target.dataset.del,ds=e.target.dataset;if(ds.rf!==undefined){const f=jget("cn-fav");f.splice(+ds.rf,1);jset("cn-fav",f);dash("sv");return}if(ds.rr!==undefined){const r=jget("cn-recipes");r.splice(+ds.rr,1);jset("cn-recipes",r);dash("sv");return}if(ds.rl!==undefined){loadRecipe(+ds.rl);return}if(dl!==undefined){LOG.splice(+dl,1);save();dc();dash("ac");return}if(i==="dso")$("so").click();
if(i==="dd"&&confirm("Delete your profile and all data on this device?")){Object.keys(localStorage).filter(k=>k.startsWith("cn-")).forEach(k=>localStorage.removeItem(k));location.reload()}
if(i==="dx"){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify({profile:U,caffeineLog:LOG,referrals:rd("cn-out")},null,2)],{type:"application/json"}));a.download="coffee-nomad-data.json";a.click()}};
/* ---- more methods, technique panel, skip cue ---- */
M.moka={n:"Moka pot",r:9,lo:7,hi:11,d:20,mg:9,g:"Fine-medium, a little coarser than espresso",t:"Hot water in the base",E:300,tm:"4–5 min",tip:"Bitter or metallic? Lower the heat and stop as soon as it sputters. Fill the basket level, do not tamp.",c:(d,W)=>[[0,"Fill the base with "+f(W)+" g of hot water. Medium-low heat","pour-all"],[180,"Watch for coffee to start flowing, lid open","swirl"],[270,"When it turns pale and hisses, take it off the heat","hiss"],[300,"Cool the base under water to stop it, then serve","done"]]};
const TX={
v60:{eq:"V60 dripper, paper filters, gooseneck kettle, scale, timer, grinder.",how:"Wet all the grounds in the bloom and swirl. Pour in slow circles from the centre outward, kettle low, stream steady, water off the paper wall.",mis:"Pouring too fast, hitting the paper wall, and a grind so fine that the drawdown stalls.",cl:"Discard the filter and rinse the dripper. Wash with warm soapy water weekly."},
chemex:{eq:"Chemex, Chemex filters, gooseneck kettle, scale, timer, grinder.",how:"Bloom, then pour in slow circles and avoid the paper edge. The thick paper gives a very clean cup.",mis:"Grinding too fine, which stalls the drain, and pouring onto the paper wall.",cl:"Rinse the carafe, then wash it with warm soapy water."},
fp:{eq:"French press, kettle, scale, spoon, timer, coarse grinder.",how:"Pour everything at once and do not stir. At four minutes break the crust and skim the foam. Rest it, then pour gently so the sediment stays behind.",mis:"Grinding too fine, leaving coffee sitting in the press, and plunging hard.",cl:"Put the grounds in the bin, not the sink. Take the plunger apart and wash every part."},
aero:{eq:"AeroPress, paper filter, kettle, scale, stirrer, grinder, mug.",how:"Pour, swirl lightly, then press slowly. Stop at the hiss instead of squeezing out the last drops, which are the bitter ones.",mis:"Pressing hard, over-steeping, and skipping the filter rinse.",cl:"Push out the puck, then rinse the chamber and the rubber seal."},
siphon:{eq:"Siphon brewer, heat source, cloth or paper filter, stirrer, scale, grinder.",how:"Let the water rise, add the coffee, stir gently, then lift the heat. The vacuum pulls the coffee down through the filter.",mis:"Heat too high, stirring hard, and removing the heat too late.",cl:"Let it cool, then rinse. Wash a cloth filter with hot water only and store it wet."},
esp:{eq:"Espresso machine, grinder with fine adjustment, scale, tamper, timer.",how:"Level the grounds, tamp flat, and start timing at the first drip. Aim for the target weight in the cup in 25 to 30 seconds.",mis:"Uneven tamping, stale beans, and changing several things at once.",cl:"Backflush and wipe the group head and steam wand after each session."},
moka:{eq:"Moka pot, medium-low heat, fine-medium grind, scale, cloth.",how:"Fill the base with hot water just below the valve, add the coffee level and untamped, assemble and heat gently. Remove from the heat when it starts to hiss.",mis:"High heat, which burns the coffee, tamping the grounds, and leaving the pot on after it sputters.",cl:"Let it cool, rinse every part and dry fully. Do not use soap on the rubber seal."},
cold:{eq:"Jar or pitcher, coarse grinder, paper filter or sieve, fridge.",how:"Mix coffee and cold water, stir so every grain is wet, steep 12 to 18 hours in the fridge, then strain through paper.",mis:"Grinding too fine, which makes it muddy, and forgetting to dilute the concentrate.",cl:"Wash the jar and filter the same day so the oils do not turn stale."}};
function tech(){const x=TX[cur];$("tech").innerHTML=x?"<div><h4>Equipment</h4><p>"+x.eq+"</p></div><div><h4>Technique</h4><p>"+x.how+"</p></div><div><h4>Common mistakes</h4><p>"+x.mis+"</p></div><div><h4>Cleaning</h4><p>"+x.cl+"</p></div>":""}
const ORD=["v60","chemex","fp","aero","siphon","esp","moka","cold"];
$("methods").innerHTML=ORD.map(k=>'<button class="chip" data-k="'+k+'">'+M[k].n+"</button>").join("");
$("skip").onclick=()=>{const n=cues[fired];if(!n||(!run&&acc===0))return;if(run)t0-=(n[0]-el())*1000;else acc=n[0];tick()};
/* ---- v8: stronger email checks, real Google/Apple wiring, saved cafés and recipes ---- */
DISP.push("yopmail.fr","guerrillamail.net","guerrillamail.org","guerrillamail.biz","guerrillamail.de","grr.la","10minutemail.net","temp-mail.org","temp-mail.io","trashmail.net","getnada.com","nada.email","dispostable.com","maildrop.cc","throwawaymail.com","fakeinbox.com","mailnesia.com","mintemail.com","spamgourmet.com","tempail.com","moakt.com","emailondeck.com","mohmal.com","burnermail.io","mytemp.email","inboxkitten.com","tempinbox.com","spambox.us","trbvm.com","tmail.ws","tmpmail.org","fakemail.net","mailcatch.com","jetable.org","spam4.me","harakirimail.com","discard.email");
const COMMON=["gmail.com","googlemail.com","yahoo.com","yahoo.co.uk","outlook.com","hotmail.com","live.com","msn.com","icloud.com","me.com","proton.me","protonmail.com","aol.com"],RES=["example.com","example.org","example.net","test.com","localhost"];
function lev(a,b){const m=[];for(let i=0;i<=a.length;i++){m[i]=[i];for(let j=1;j<=b.length;j++)m[i][j]=i?0:j}for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return m[a.length][b.length]}
function vEmail(s){s=String(s).trim();if(!s)return["Enter your email address."];if(s.length>254)return["That email is too long."];if(s!==s.toLowerCase())return["Use lowercase letters only, like name@example.com."];
const m=s.match(/^([a-z0-9][a-z0-9._%+-]{0,63})@((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24})$/);if(!m||/\.\./.test(s)||/\.@/.test(s))return["Enter a valid email, like name@example.com."];
const d=m[2];if(/^\d+(\.\d+)+$/.test(d))return["Enter a valid email, like name@example.com."];
if(DISP.includes(d)||DISP.some(x=>d.endsWith("."+x)))return["Please use a permanent email address, not a temporary one."];
if(RES.includes(d)||/\.(test|invalid|example|localhost|local)$/.test(d))return["Please use a real email address."];
if(!COMMON.includes(d)){const g=COMMON.find(c=>lev(d,c)<=1||(c==="gmail.com"&&lev(d,c)<=2));if(g)return["Did you mean "+m[1]+"@"+g+"?"]}
return[null,s]}
async function mxOk(dom){if(COMMON.includes(dom))return true;const c=new AbortController(),t=setTimeout(()=>c.abort(),4500);
try{const q=async ty=>(await fetch("https://cloudflare-dns.com/dns-query?name="+encodeURIComponent(dom)+"&type="+ty,{headers:{accept:"application/dns-json"},signal:c.signal})).json();
const m=await q("MX");if(m.Status===3)return false;if((m.Answer||[]).some(a=>a.type===15&&!/^\d+\s+\.?$/.test(a.data)))return true;const a=await q("A");return(a.Answer||[]).some(x=>x.type===1)}catch(e){return null}finally{clearTimeout(t)}}
let OAUTH=null,GN="",tries=0,lockT=0;
const b64j=t=>JSON.parse(decodeURIComponent(escape(atob(t.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(t.length/4)*4,"=")))));
function gClaims(jwt){try{const c=b64j(String(jwt).split(".")[1]);if(!/^(https:\/\/)?accounts\.google\.com$/.test(c.iss)||c.aud!==CONFIG.googleClientId||c.exp*1000<Date.now()||c.email_verified!==true||!c.email||(GN&&c.nonce!==GN))return null;return c}catch(e){return null}}
function useOAuth(p,name,email){OAUTH={p,name,email};$("gn").value=name||"";$("ge").value=String(email||"").toLowerCase();$("gn").readOnly=!!name;$("ge").readOnly=true;$("gnote").textContent="Signed in with "+p+". Confirm your date of birth and accept the policies to finish.";$("oa-e").textContent="";$("gdd").focus()}
const loadJs=src=>new Promise((ok,no)=>{const s=document.createElement("script");s.src=src;s.async=true;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
async function initGoogle(){if(!CONFIG.googleClientId)return;try{await loadJs("https://accounts.google.com/gsi/client");GN=crypto.randomUUID?crypto.randomUUID():String(Math.random()).slice(2);
google.accounts.id.initialize({client_id:CONFIG.googleClientId,nonce:GN,callback:r=>{const c=gClaims(r.credential);if(!c){$("oa-e").textContent="Google sign-in could not be verified. Please try again.";return}useOAuth("Google",c.name,c.email)},cancel_on_tap_outside:true});
$("goog").hidden=true;google.accounts.id.renderButton($("gbox"),{theme:"outline",size:"large",text:"continue_with",shape:"pill",width:Math.max(200,Math.min(360,$("gbox").clientWidth||280))});google.accounts.id.prompt()}catch(e){$("oa-e").textContent="Google sign-in could not load. Check your connection."}}
$("goog").onclick=()=>{$("oa-e").textContent="Google sign-in is not switched on yet. It needs a Google client ID. See SETUP.md."};
$("appl").onclick=async()=>{const er=$("oa-e");if(!CONFIG.appleServicesId){er.textContent="Apple sign-in is not switched on yet. It needs an Apple Services ID. See SETUP.md.";return}
try{if(!window.AppleID)await loadJs("https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js");const st=crypto.randomUUID?crypto.randomUUID():String(Math.random()).slice(2);
AppleID.auth.init({clientId:CONFIG.appleServicesId,scope:"name email",redirectURI:CONFIG.appleRedirectUri||location.origin+location.pathname,state:st,usePopup:true});const r=await AppleID.auth.signIn();
if(r.authorization.state&&r.authorization.state!==st){er.textContent="Apple sign-in could not be verified.";return}
const c=b64j(r.authorization.id_token.split(".")[1]);if(c.iss!=="https://appleid.apple.com"||c.aud!==CONFIG.appleServicesId||c.exp*1000<Date.now()||!c.email){er.textContent="Apple sign-in could not be verified.";return}
useOAuth("Apple",r.user&&r.user.name?((r.user.name.firstName||"")+" "+(r.user.name.lastName||"")).trim():"",c.email)}catch(x){er.textContent="Apple sign-in was cancelled or did not finish."}};
$("gf").onsubmit=async e=>{e.preventDefault();const er=$("gerr");
if($("gweb").value){er.textContent="We could not create this profile. Please try again later.";return}
if(Date.now()<lockT){er.textContent="Too many attempts. Please wait "+Math.ceil((lockT-Date.now())/1000)+" seconds.";return}
const v=validate();
if(!v.ok){if(++tries>=5){lockT=Date.now()+30000;tries=0}er.textContent="Please fix the highlighted fields.";const f=$("gate").querySelector('[aria-invalid="true"]');if(f){f.scrollIntoView({block:"center",behavior:"smooth"});f.focus()}return}
const b=$("gsub");b.disabled=true;b.textContent="Checking your details…";let mx=true;
if(!OAUTH){mx=await mxOk(v.email.split("@")[1]);if(mx===false){b.disabled=false;b.textContent="Create profile and continue";fe("ge","That email domain cannot receive mail. Please check the spelling.");er.textContent="Please fix the highlighted fields.";$("ge").focus();return}}
b.textContent="Creating your profile…";
setTimeout(()=>{U={name:v.name,email:v.email,adult:v.age>=18,consent:{v:"2026-11-15",terms:true,allergen:true,marketing:$("gnn").checked,at:Date.now()},provider:OAUTH?OAUTH.p.toLowerCase():"email",providerAssertion:!!OAUTH,emailChecked:mx===true,at:Date.now()};try{localStorage.setItem("cn-user",JSON.stringify(U))}catch(x){}tries=0;$("gate").close();b.disabled=false;b.textContent="Create profile and continue";enter()},500)};
if(!U)initGoogle();
const jget=k=>{try{return JSON.parse(localStorage.getItem(k)||"[]")}catch(e){return[]}},jset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},cafeKey=p=>p.n+"|"+(+p.la).toFixed(4)+","+(+p.lo).toFixed(4);
function favState(){const on=jget("cn-fav").some(x=>x.k===cafeKey(CP));$("fav").setAttribute("aria-pressed",on);$("fav").textContent=on?"Saved":"Save café"}
$("fav").onclick=()=>{const k=cafeKey(CP);let f=jget("cn-fav");const had=f.some(x=>x.k===k);f=had?f.filter(x=>x.k!==k):f.concat({k,n:CP.n,a:CP.a||"",la:CP.la,lo:CP.lo,t:Date.now()});jset("cn-fav",f.slice(-100));favState();toast(had?"Removed from saved":"Saved "+CP.n)};
$("svr").onclick=()=>{const r=jget("cn-recipes");r.push({id:Date.now(),m:cur,d:dose(),r:ratio(),t:Date.now()});jset("cn-recipes",r.slice(-50));toast("Recipe saved: "+M[cur].n+", "+dose()+" g at 1:"+ratio())};
function loadRecipe(id){const r=jget("cn-recipes").find(x=>x.id===id);if(!r||!M[r.m])return;pick(r.m);$("dose").value=r.d;$("ratio").value=r.r;render();$("dash").close();location.hash="#brew"}
$("cq").oninput=draw;
if("serviceWorker" in navigator&&location.protocol==="https:")addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
/* ---- v9: caffeine window: how long you can drink caffeine before it affects sleep ---- */
function winCalc(now,bedT,hlh,thr,exist,past){const dh=(bedT-now)/36e5,room=thr-exist;
const until=mg=>room<=0?null:(mg<=room?bedT:bedT-hlh*Math.log2(mg/room)*36e5);
const mgMax=past||dh<=0?0:Math.max(0,room)*Math.pow(2,dh/hlh);
return{dh,mgMax,c95:until(95),c63:until(63),state:past||dh<=0?"past":mgMax>=95?"open":mgMax>=63?"last":"late"}}
function winState(){const now=Date.now(),d0=new Date(now);d0.setHours(0,0,0,0);const s0=d0.getTime(),p=($("bed").value||"23:00").split(":"),bt=+p[0]*60+ +p[1],nm=(now-s0)/6e4;
const bedT=s0+((bt<300&&nm<bt)?bt:(bt<300?bt+1440:bt))*6e4,past=nm<300&&(bt>=300||nm>=bt),hlh=hl(),thr=+$("sens").value||25;
const ex=LOG.reduce((a,x)=>x.t<=now&&x.t<bedT?a+x.mg*Math.pow(.5,(bedT-x.t)/36e5/hlh):a,0);return Object.assign(winCalc(now,bedT,hlh,thr,ex,past),{bedT,now})}
const clk=t=>new Date(t).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}),dur=ms=>{const m=Math.max(0,Math.round(ms/6e4));return m>=60?Math.floor(m/60)+" h "+(m%60)+" min":m+" min"};
function winRender(){const el=$("win");if(!el)return;const w=winState(),tz=Intl.DateTimeFormat().resolvedOptions().timeZone||"your time zone",c=w.state,mx=Math.round(w.mgMax);let h,t;
if(c==="open"){h="You can still have a regular coffee";t="Until "+clk(w.c95)+" ("+dur(w.c95-w.now)+" from now). A single espresso works until "+(w.c63?clk(w.c63):"later")+"."}
else if(c==="last"){h="Last call: keep it small";t="Your regular-cup time ended at "+(w.c95?clk(w.c95):"earlier today")+". A single espresso or small cup (up to about "+mx+" mg) is fine until "+clk(w.c63)+"."}
else if(c==="late"){h="It is late for caffeine";t="Even a single espresso may still be active at bedtime. Consider decaf."}
else{h="It is past your usual bedtime";t="Caffeine now would reach into your sleep. Consider decaf, herbal tea or water."}
const lo=new Date(w.now);lo.setHours(5,0,0,0);const a=Math.min(lo.getTime(),w.now),sp=Math.max(36e5,w.bedT-a),P=x=>Math.max(0,Math.min(100,(x-a)/sp*100)),g=w.c95?P(w.c95):0,y=w.c63?P(w.c63):g;
el.className="win "+c;
el.innerHTML='<div class="wt"><span>'+clk(w.now)+" · "+esc(tz)+"</span><span>Bedtime "+clk(w.bedT)+"</span></div><h3>"+h+"</h3><p>"+t+'</p><div class="wb" aria-hidden="true"><i style="width:'+g+'%"></i><i class="y" style="left:'+g+"%;width:"+Math.max(0,y-g)+'%"></i><i class="r" style="left:'+y+"%;width:"+(100-y)+'%"></i><u style="left:'+P(w.now)+'%"></u></div><p class="mut" style="margin:10px 0 0">Based on your bedtime, how fast you clear caffeine and what you have logged today. Times use your device clock, so they follow you across time zones. A guide, not medical advice.</p>';
$("cut").textContent=w.c95?"Last regular coffee today: "+clk(w.c95):"No regular coffee fits before bedtime today";$("cut").className=c==="open"?"ok":"warn";
const b95=w.dh>0?95*Math.pow(.5,w.dh/hl()):95;$("what").innerHTML="<strong>Another cup now?</strong> A regular cup now would leave about "+f(b95)+" mg at bedtime (cautious estimate). "+(c==="open"?'<span class="ok">Within your window.</span>':'<span class="warn">Outside your window.</span>');
$("bnote").textContent=c==="late"||c==="past"?"It is late for caffeine. Consider decaf beans for this brew.":""}
const dc0=dc;dc=function(){dc0();winRender()};
let pend=null;const lateOk=()=>{const s=winState().state;return s==="late"||s==="past"};
function showLate(proceed){const w=winState();$("ltd").textContent=w.state==="past"?"It is past your usual bedtime ("+clk(w.bedT)+").":"Your bedtime is "+clk(w.bedT)+", so caffeine now may still be active when you try to sleep.";pend=proceed||null;$("ltany").hidden=!proceed;$("late").showModal()}
function guard(mg,fn){if(mg>=20&&lateOk()){showLate(fn);return}fn()}
$("ltok").onclick=()=>{pend=null;$("late").close()};
$("ltany").onclick=()=>{const fn=pend;pend=null;$("late").close();if(fn)fn()};
$("ltdc").onclick=()=>{pend=null;LOG.push({t:Date.now(),mg:5,n:"Decaf"});save();dc();$("late").close();toast("Decaf logged: about 5 mg")};
function lateOnce(){if(!U||$("gate").hasAttribute("open")||!lateOk())return;const k="cn-late";let l=0;try{l=+localStorage.getItem(k)||0;if(Date.now()-l<3*36e5)return;localStorage.setItem(k,String(Date.now()))}catch(e){}showLate(null)}
winRender();setInterval(winRender,60000);if(U)setTimeout(lateOnce,2500);
pick("v60");
/* HERO VIDEO (optional): put your own pour footage at assets/v60-pour.mp4 and a still frame at assets/v60-poster.jpg. Keep it under 3 MB, 6 to 10 seconds, no sound. */
/* VOICE CLIPS (optional): record these as mp3 and put them in an audio/ folder next to index.html.
bloom, pour2, pour3, swirl-drain, done, pour-all, skim, pour-gently, swirl, press, hiss, start-shot, stop-shot
The page shows the gram amounts on screen, so your clips only need to say the action. */
