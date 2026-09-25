const RUNTIME_BUILD=33;
const c=document.querySelector('#game'),g=c.getContext('2d');g.imageSmoothingEnabled=false;
const W=480,H=320,T=32,C=15,R=10;let area='home',battle=false,last=performance.now(),walk=0,encDist=0,portalLock=0;
let p={x:7.5*T,y:5.5*T,r:8,hp:30,max:30,lvl:1,xp:0,cash:12,weapon:'Keppi',face:'down'};
const homeMap=['TTTTTTTTTTTTTTT','T....TTT......T','T.H..T........T','T....T..H.....T','T.............T','T.............T','T.............T','T..H.......H..T','T..........>>>T','TTTTTTTTTTTTTTT'];
function makeMalmi(){
 const w=44,h=30,m=Array.from({length:h},()=>Array(w).fill('s'));
 const fill=(x,y,ww,hh,ch)=>{for(let yy=y;yy<y+hh;yy++)for(let xx=x;xx<x+ww;xx++)if(m[yy]?.[xx]!=null)m[yy][xx]=ch};
 const frame=(x,y,ww,hh,ch='B')=>{for(let xx=x;xx<x+ww;xx++){m[y][xx]=ch;m[y+hh-1][xx]=ch}for(let yy=y;yy<y+hh;yy++){m[yy][x]=ch;m[yy][x+ww-1]=ch}};
 for(let x=0;x<w;x++){m[0][x]='B';m[h-1][x]='B'}for(let y=0;y<h;y++){m[y][0]='B';m[y][w-1]='B'}
 // YLÄ-MALMI: tori / Malmin raitti / pienet liiketalot
 fill(2,4,17,2,'r'); fill(8,2,2,13,'r'); fill(2,10,17,2,'r');
 frame(2,2,5,3,'B'); frame(11,2,7,3,'B'); frame(2,13,7,5,'B'); frame(11,13,8,5,'B');
 fill(3,7,4,2,'t'); // Ylä-Malmin tori
 fill(12,7,4,2,'P'); // King Pizza -tyyppinen pizzeria
 fill(3,20,6,5,'z'); fill(11,20,8,5,'z');
 // MALMIN ASEMA + ratakäytävä erottaa alueet
 fill(20,1,4,28,'#'); fill(19,8,1,5,'='); fill(24,8,1,5,'=');
 // ALA-MALMI: Nova / market / pysäköinti / kävelykatu
 fill(25,4,17,2,'r'); fill(28,2,2,15,'r'); fill(25,15,17,2,'r'); fill(36,2,2,15,'r');
 frame(25,2,8,6,'N'); // Nova-tyyppinen kauppakeskus
 frame(34,2,8,7,'M'); // suuri market
 fill(34,10,8,4,'p'); // parkkialue
 frame(25,18,7,6,'B'); frame(34,18,8,7,'B');
 fill(26,26,7,2,'z'); fill(35,26,6,2,'z');
 // portit
 m[10][2]='<'; m[10][1]='<';
 return m.map(r=>r.join(''));
}
const maps={home:homeMap,malmi:makeMalmi()};
function malmiZone(){return area==='malmi'&&p.x>=24*T?'ala':'yla'}
const enemies=[{name:'Pultsari',hp:12,atk:3,xp:5,cash:3,icon:'🥴',line:'“Onks heittää kahta euroa?”'},{name:'Vihainen mummo',hp:16,atk:4,xp:7,cash:5,icon:'👵',line:'“Nuoriso pilalla.”'},{name:'Roadman',hp:21,atk:5,xp:10,cash:8,icon:'🥷',line:'“Bro.”'}];let e=null;
function rect(x,y,w,h,col){g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function px(x,y,col){rect(x,y,2,2,col)}
function line(x,y,w,h,c){rect(x,y,w,h,c)}
function stone(x,y){rect(x+5,y+16,22,10,'#55605a');rect(x+8,y+12,17,8,'#737e76');rect(x+11,y+11,10,3,'#8d978e')}
function flower(x,y){rect(x,y,2,2,'#f4e8a0');rect(x+2,y+2,2,2,'#d77878');rect(x,y+3,1,3,'#37683d')}
function bush(x,y){rect(x+2,y+10,28,13,'#315f39');rect(x+5,y+5,22,14,'#477d45');rect(x+9,y+3,9,5,'#5d9555');rect(x+6,y+9,3,3,'#73a766');rect(x+21,y+11,3,3,'#2a5533')}
function lamp(x,y){rect(x+15,y+8,3,22,'#3b3b38');rect(x+12,y+6,9,4,'#4b4b46');rect(x+13,y+3,7,5,'#ffe59a');rect(x+14,y+4,5,3,'#fff1b9')}
const urbanSheet=new Image();urbanSheet.src='assets/urban/tilemap_packed.png?v=27';
// Malmi gets its own dark city renderer. Kenney props can still be layered later,
// but the street/building structure no longer depends on guessed spritesheet indices.
function cityNoise(x,y,gx,gy,n=3){
 for(let i=0;i<n;i++){let q=Math.abs(((gx*37+gy*71+i*19)*997)%29);rect(Math.round(x+2+q),Math.round(y+4+(q*7)%23),2,1,'#59605e')}
}
function urbanTile(ch,x,y,gx,gy){
 // asphalt base
 rect(x,y,T,T,'#3e4443');cityNoise(x,y,gx,gy,2);
 if(ch==='z'){ // stable neglected park ground; trees are explicit world objects
   rect(x,y,T,T,'#293b32');rect(x,y+25,T,7,'#303634');
 }
 if(ch==='#'){ // rail / underpass
   rect(x,y,T,T,'#242827');rect(x,y+7,T,4,'#777873');rect(x,y+21,T,4,'#777873');
   rect(x,y+9,T,2,'#171918');rect(x,y+23,T,2,'#171918');
   rect(x+4,y,T,32,'#4c504e');rect(x+24,y,T,32,'#4c504e')
 }
 if(ch==='B'){ // dark apartment/building block
   rect(x,y,T,T,'#202423');rect(x+2,y+2,28,30,'#555a59');rect(x+4,y+4,24,28,'#454a49');
   const lit=((gx*13+gy*7)|0)%5===0;
   rect(x+6,y+8,7,7,lit?'#c6a35f':'#263132');rect(x+19,y+8,7,7,'#273334');
   rect(x+6,y+19,7,7,'#273334');rect(x+19,y+19,7,7,lit?'#b49355':'#252e30');
   rect(x+14,y+19,4,13,'#242827')
 }
 if(ch==='A'){rect(x,y,T,T,'#555b59');}
 if(ch==='<'||ch==='>'){
   rect(x,y,T,T,'#565348');rect(x+3,y+3,26,26,'#242827');g.fillStyle='#d7c77e';g.font='bold 18px monospace';g.fillText(ch,x+10,y+22)
 }
 // Coherent streets: broad asphalt lanes with continuous sidewalks and markings.
 if(ch==='.'){
   const vertical=(gx>=14&&gx<=16)||(gx>=25&&gx<=27);
   const horizontal=(gy>=5&&gy<=6)||(gy>=10&&gy<=11);
   if(vertical||horizontal){
     rect(x,y,T,T,'#303534');
     if(vertical){rect(x,y,5,T,'#6b706d');rect(x+27,y,5,T,'#6b706d');if(gy%2===0)rect(x+15,y+8,2,12,'#b3aa76')}
     if(horizontal){rect(x,y,T,5,'#6b706d');rect(x,y+27,T,5,'#6b706d');if(gx%2===0)rect(x+8,y+15,12,2,'#b3aa76')}
   }else{
     rect(x,y,T,T,'#555b59');rect(x,y+27,T,5,'#676d69');
     if((gx*11+gy*17)%13===0)rect(x+5,y+8,3,2,'#343938');
   }
 }
 return true
}
function tile(ch,x,y,gx=0,gy=0){
 const h=area==='home';if(!h){urbanTile(ch,Math.round(x),Math.round(y),gx,gy);return}rect(x,y,T,T,'#719b58');
 for(let i=0;i<4;i++){let q=(x*3+y*7+i*11)%27;px(x+3+q,y+4+(q*5)%23,i%2?'#83aa67':'#628b4d')}
 if(ch==='.'&&h){rect(x,y+12,T,10,'#bda875');rect(x,y+12,T,2,'#d0bd8b');rect(x,y+20,T,2,'#9e8c63');for(let i=0;i<3;i++)rect(x+4+i*11,y+16,6,2,'#d7c797');if(((x+y)/T)%3===0)flower(x+4,y+4)}
 if(ch==='T'){rect(x+12,y+16,7,15,'#684a31');rect(x+3,y+7,26,14,'#356b3b');rect(x+7,y+2,19,18,'#4e884d');rect(x+11,y,12,7,'#61985b');rect(x+5,y+10,4,4,'#79ad68')}
 if(ch==='H'){rect(x+1,y+14,30,18,'#bd8157');rect(x+3,y+16,26,2,'#d69a6b');rect(x-2,y+8,36,7,'#5a3b35');rect(x+2,y+4,28,6,'#70463c');rect(x+5,y+2,22,4,'#855448');rect(x+7,y+20,8,8,'#e7bd6b');rect(x+20,y+19,8,13,'#5e4032')}
 if(ch==='>'||ch==='<'){rect(x,y,T,T,'#d5bd75');g.fillStyle='#292b28';g.font='bold 18px monospace';g.fillText(ch,x+10,y+22)}
}
function player(){
 let cam=camera(),X=Math.round(p.x-cam.x),Y=Math.round(p.y-cam.y),step=Math.floor(walk)%2,side=p.face==='left'||p.face==='right',flip=p.face==='left'?-1:1;
 rect(X-9,Y+12,18,4,'#0005');
 let leg=step?2:0;rect(X-7-leg,Y+5,6,8,'#252b32');rect(X+1+leg,Y+5,6,8,'#252b32');
 rect(X-8,Y-8,16,16,'#7d3040');rect(X-6,Y-6,12,3,'#a64b59');rect(X-7,Y+4,14,4,'#51242d');
 rect(X-6,Y-18,12,11,'#d4a27d');rect(X-7,Y-20,14,5,'#332824');rect(X-8,Y-17,3,8,'#332824');
 if(p.face==='down'){rect(X-4,Y-14,2,2,'#27231f');rect(X+2,Y-14,2,2,'#27231f');rect(X-2,Y-10,4,1,'#9b604d')}
 if(p.face==='up'){rect(X-6,Y-17,12,6,'#332824')}
 if(side){rect(X+flip*4-1,Y-14,2,2,'#27231f');rect(X+flip*6-1,Y-5,3,8,'#d4a27d')}
 else{rect(X-9,Y-6,3,9,'#d4a27d');rect(X+6,Y-6,3,9,'#d4a27d')}
 rect(X-5,Y+12+(step?0:1),5,2,'#111518');rect(X+1,Y+12+(step?1:0),5,2,'#111518');
 // Player HP bar
 const bw=28,bx=X-bw/2,by=Y-28,ratio=Math.max(0,Math.min(1,p.hp/p.max));rect(bx-1,by-1,bw+2,6,'#111');rect(bx,by,bw,4,'#54282d');rect(bx,by,bw*ratio,4,ratio>.5?'#6fb36b':ratio>.25?'#d0a34f':'#c85858');
}
function camera(){if(area==='home')return{x:0,y:0};let mw=maps.malmi[0].length*T,mh=maps.malmi.length*T;return{x:Math.round(Math.max(0,Math.min(mw-W,p.x-W/2))),y:Math.round(Math.max(0,Math.min(mh-H,p.y-H/2)))}}
function drawMalmiDetails(cam){
 function treeWorld(tx,ty){let x=Math.round(tx*T-cam.x),y=Math.round(ty*T-cam.y);rect(x+13,y+15,6,17,'#403a31');rect(x+5,y+5,22,17,'#334d3c');rect(x+9,y+1,14,14,'#3f6047')}
 function lampWorld(tx,ty){let x=Math.round(tx*T-cam.x),y=Math.round(ty*T-cam.y);rect(x+15,y+7,3,25,'#202423');rect(x+9,y+4,15,5,'#555c5a');rect(x+12,y+3,9,3,'#d4b96e')}
 [[3,8],[5,9],[7,8],[4,10],[6,10],[12,8],[13,9],[12,15],[15,16]].forEach(v=>treeWorld(v[0],v[1]));
 [[2,6],[9,6],[16,5],[27,6],[10,16],[18,16],[27,11]].forEach(v=>lampWorld(v[0],v[1]));
 const X=(tx)=>Math.round(tx*T-cam.x),Y=(ty)=>Math.round(ty*T-cam.y);
 function car(tx,ty,dir,col){let x=X(tx),y=Y(ty);if(dir==='h'){rect(x+2,y+8,28,15,'#171a1a');rect(x+4,y+6,24,14,col);rect(x+9,y+8,13,6,'#293638');rect(x+5,y+20,6,3,'#111');rect(x+21,y+20,6,3,'#111');rect(x+27,y+10,3,4,'#d9c77a')}else{rect(x+8,y+2,15,28,'#171a1a');rect(x+6,y+4,14,24,col);rect(x+8,y+9,6,13,'#293638');rect(x+20,y+5,3,6,'#111');rect(x+20,y+21,3,6,'#111')}}
 function bin(tx,ty){let x=X(tx),y=Y(ty);rect(x+8,y+13,16,16,'#222827');rect(x+6,y+10,20,5,'#343b39');rect(x+11,y+16,10,8,'#49524e')}
 function bench(tx,ty){let x=X(tx),y=Y(ty);rect(x+4,y+15,24,5,'#76543a');rect(x+6,y+11,20,4,'#8b6545');rect(x+7,y+20,3,7,'#242827');rect(x+22,y+20,3,7,'#242827')}
 function stop(tx,ty){let x=X(tx),y=Y(ty);rect(x+15,y+5,3,27,'#343a39');rect(x+9,y+2,15,11,'#e4e0d0');rect(x+11,y+4,11,7,'#315c87');g.fillStyle='#fff';g.font='bold 6px monospace';g.fillText('HSL',x+12,y+10)}
 function shop(tx,ty,label){let x=X(tx),y=Y(ty);rect(x,y+7,64,25,'#343938');rect(x+3,y+10,58,8,'#7e3e35');rect(x+5,y+20,18,12,'#1c282a');rect(x+28,y+20,28,12,'#202c2e');g.fillStyle='#e6d69d';g.font='bold 7px monospace';g.fillText(label,x+6,y+16)}
 // crossroads and zebra crossings
 [[14,5],[25,10]].forEach(([tx,ty])=>{let x=X(tx),y=Y(ty);for(let i=0;i<5;i++){rect(x+i*7,y+5,4,22,'#c9c9bd');rect(x+5,y+i*7,22,4,'#c9c9bd')}});
 car(15,7,'h','#596f78');car(26,8,'v','#704b48');car(14,15,'h','#6e6750');car(24,6,'h','#465d50');
 stop(13,6);stop(27,11);bin(9,11);bin(18,11);bin(26,16);bench(5,10);bench(12,17);
 shop(17,6,'MALMIN GRILLI');shop(3,17,'KIOSKI');
 // fence beside neglected park
 g.strokeStyle='#69706d';g.lineWidth=2;let fy=Y(12);for(let tx=2;tx<9;tx++){let x=X(tx);g.beginPath();g.moveTo(x,fy);g.lineTo(x+T,fy);g.stroke();rect(x+4,fy-7,2,14,'#59605d')}
 // graffiti on underpass
 let gx=X(11),gy=Y(12);g.font='bold 9px monospace';g.fillStyle='#a95e73';g.fillText('MALMI',gx+2,gy+19);g.fillStyle='#5f8f8a';g.fillText('HOODS',gx+5,gy+28)
}
function draw(){
 // Clear the whole viewport every frame so moving sprites/projectiles never leave trails.
 g.clearRect(0,0,W,H);rect(0,0,W,H,area==='home'?'#719b58':'#3f4543');
 const cam=camera(),map=maps[area],sx=Math.floor(cam.x/T),sy=Math.floor(cam.y/T),ex=Math.min(map[0].length,sx+C+2),ey=Math.min(map.length,sy+R+2);
 for(let y=sy;y<ey;y++)for(let x=sx;x<ex;x++)tile(map[y][x],x*T-cam.x,y*T-cam.y,x,y);
 if(area==='home'){stone(38,188);bush(272,40);bush(304,40);flower(220,76);flower(330,92);flower(92,180);lamp(205,224);lamp(365,224);rect(80,238,60,4,'#5f744b');rect(82,234,3,14,'#76563b');rect(106,234,3,14,'#76563b');rect(132,234,3,14,'#76563b')}else{let cam=camera();g.fillStyle='#c5c8c3';g.font='bold 12px monospace';g.fillText('MALMIN ASEMA',4*T-cam.x,2*T-cam.y);g.fillText('PUISTO',3*T-cam.x,7*T-cam.y);g.fillText('ALIKULKU',10*T-cam.x,12*T-cam.y)}
 if(area==='home'){rect(0,0,W,18,'#efd37f');g.fillStyle='#302d22';g.font='10px monospace';g.fillText('TORPPARINMÄKI — THREAT LEVEL: EI TÄÄLLÄ MITÄÄN TAPAHDU',8,12)}
 else{rect(0,0,W,18,'#252928');g.fillStyle='#b8bbb7';g.font='10px monospace';g.fillText('MALMI — THREAT LEVEL: EPÄMÄÄRÄINEN',8,12);g.strokeStyle='#aeb8b833';for(let i=0;i<18;i++){let rx=(i*73+performance.now()/12)%520-20,ry=(i*47+performance.now()/8)%340;g.beginPath();g.moveTo(rx,ry);g.lineTo(rx-5,ry+12);g.stroke()}}
 try{drawSurvivor()}catch(err){console.error('survivor render',err)}finally{player()}
 // Player render is protected: optional effects/mobs cannot prevent the character from drawing.
}
function cellAt(x,y){let cx=Math.floor(x/T),cy=Math.floor(y/T);return maps[area][cy]?.[cx]||'B'}
function blocked(x,y){return 'TBHNM'.includes(cellAt(x,y))}
function playerBlocked(x,y){let r=6;return blocked(x-r,y-r)||blocked(x+r,y-r)||blocked(x-r,y+r)||blocked(x+r,y+r)}
function nudgeToFree(){if(!playerBlocked(p.x,p.y))return;for(let rad=8;rad<=T*3;rad+=8)for(let a=0;a<Math.PI*2;a+=Math.PI/8){let x=p.x+Math.cos(a)*rad,y=p.y+Math.sin(a)*rad;if(!playerBlocked(x,y)){p.x=x;p.y=y;return}}}
let joy={x:0,y:0,active:false,id:null};const j=document.querySelector('#joy'),s=document.querySelector('#stick');
function setJoy(ev){let r=j.getBoundingClientRect(),dx=ev.clientX-(r.left+r.width/2),dy=ev.clientY-(r.top+r.height/2),d=Math.hypot(dx,dy),m=40;if(d>m){dx*=m/d;dy*=m/d}joy.x=dx/m;joy.y=dy/m;s.style.transform='translate('+dx+'px,'+dy+'px)'}
function startJoy(ev){joy.active=true;joy.id=ev.pointerId??'touch';try{if(ev.pointerId!=null)j.setPointerCapture(ev.pointerId)}catch(_){}setJoy(ev)}
function release(){joy.active=false;joy.id=null;joy.x=joy.y=0;s.style.transform='translate(0,0)'}
j.addEventListener('pointerdown',startJoy);
j.addEventListener('pointermove',ev=>{if(joy.active&&(joy.id===ev.pointerId||joy.id==='touch'))setJoy(ev)});
j.addEventListener('pointerup',release);j.addEventListener('pointercancel',release);j.addEventListener('lostpointercapture',release);
// Android WebView fallback: direct touch controls
j.addEventListener('touchstart',ev=>{ev.preventDefault();let t=ev.changedTouches[0];joy.active=true;joy.id='touch';setJoy(t)},{passive:false});
j.addEventListener('touchmove',ev=>{ev.preventDefault();if(joy.active){let t=ev.changedTouches[0];setJoy(t)}},{passive:false});
j.addEventListener('touchend',ev=>{ev.preventDefault();release()},{passive:false});
j.addEventListener('touchcancel',release,{passive:false});
let keys={};addEventListener('keydown',e=>keys[e.key]=1);addEventListener('keyup',e=>keys[e.key]=0);
function movement(dt){
 if(portalLock>0)portalLock-=dt;if(battle||bagOpen)return;let dx=joy.x+(keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0),dy=joy.y+(keys.ArrowDown?1:0)-(keys.ArrowUp?1:0),mag=Math.hypot(dx,dy);if(mag<.08)return;if(mag>1){dx/=mag;dy/=mag;mag=1}
 const sp=94*mag,ox=p.x,oy=p.y,nx=p.x+dx*sp*dt,ny=p.y+dy*sp*dt;
 nudgeToFree();if(!playerBlocked(nx,p.y))p.x=nx;if(!playerBlocked(p.x,ny))p.y=ny;
 let moved=Math.hypot(p.x-ox,p.y-oy);walk+=moved/8;if(Math.abs(dx)>Math.abs(dy))p.face=dx>0?'right':'left';else p.face=dy>0?'down':'up';
 let ch=cellAt(p.x,p.y);if(portalLock<=0&&area==='home'&&ch==='>'){area='malmi';p.x=4.5*T;p.y=10.5*T;portalLock=1.5;release();msg('MALMI. Sade alkaa melkein välittömästi. Tutki asemaa, puistoa ja alikulkua.');}
 else if(portalLock<=0&&area==='malmi'&&ch==='<'){area='home';p.x=7.5*T;p.y=5.5*T;p.hp=p.max;portalLock=1.5;release();msg('Takaisin Torpparinmäessä. HP palautui.');}
 hud()
}
// --- SURVIVOR COMBAT (Build 16) ---
let mobs=[],shots=[],drops=[],bursts=[],spawnClock=0,skillClock=0,hitClock=0,bagOpen=false;const bag={};
const skill={name:'KOFF-THROW',cooldown:1.35,speed:235,damage:9,radius:46};
const lootTable=[
 {name:'1 € kolikko',chance:.55,value:1,col:'#d8c36a',kind:'money'},
 {name:'2 € kolikko',chance:.18,value:2,col:'#ead276',kind:'money'},
 {name:'Tupakannatsa',chance:.38,col:'#b88962',kind:'junk'},
 {name:'Panttitölkki',chance:.22,col:'#c9b35b',kind:'junk'},
 {name:'Ruttuinen kuitti',chance:.12,col:'#d5d0bd',kind:'junk'},
 {name:'Pullonkorkki',chance:.08,col:'#8c8f8b',kind:'junk'},
 {name:'Makkaraperunat',chance:.035,heal:8,col:'#d28b55',kind:'food'},
 {name:'Mystinen kultakorkki',chance:.000001,col:'#f5df72',kind:'legendary'}
];
function addBag(name){bag[name]=(bag[name]||0)+1}
function safeSpot(x,y){return !'TBH#NM'.includes(cellAt(x,y))}
function spawnMob(){
 if(area!=='malmi'||mobs.length>45)return;
 let a=Math.random()*Math.PI*2,d=250+Math.random()*100,x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d;
 x=Math.max(T,Math.min(maps.malmi[0].length*T-T,x));y=Math.max(T,Math.min(maps.malmi.length*T-T,y));
 if(!safeSpot(x,y))return;
 let roll=Math.random(),hard=malmiZone()==='ala',type=roll<.58?{name:'Pultsari',hp:hard?24:15,sp:hard?42:35,dmg:hard?6:4,col:'#9b765c',xp:hard?4:2}:roll<.88?{name:'Roadman',hp:hard?38:24,sp:hard?56:48,dmg:hard?9:6,col:'#45445c',xp:hard?7:4}:{name:'Vihainen mummo',hp:hard?52:34,sp:hard?34:27,dmg:hard?12:8,col:'#79566e',xp:hard?10:6};
 mobs.push({...type,x,y,max:type.hp,r:10});
}
function fireKoff(){
 if(area!=='malmi'||!mobs.length)return;
 let target=mobs.reduce((a,b)=>Math.hypot(b.x-p.x,b.y-p.y)<Math.hypot(a.x-p.x,a.y-p.y)?b:a),dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy)||1;
 shots.push({x:p.x,y:p.y,vx:dx/d*skill.speed,vy:dy/d*skill.speed,life:2.2,r:5});
}
function explode(x,y){
 bursts.push({x,y,r:4,life:.28});
 for(let i=mobs.length-1;i>=0;i--){let m=mobs[i];if(Math.hypot(m.x-x,m.y-y)<=skill.radius){m.hp-=skill.damage;if(m.hp<=0)killMob(i)}}
}
function killMob(i){
 let m=mobs[i];mobs.splice(i,1);p.xp+=m.xp;
 for(const it of lootTable)if(Math.random()<it.chance)drops.push({x:m.x+(Math.random()-.5)*12,y:m.y+(Math.random()-.5)*12,item:it,life:45});
 if(p.xp>=p.lvl*15){p.xp-=p.lvl*15;p.lvl++;p.max+=3;p.hp=Math.min(p.max,p.hp+5);msg('LEVEL UP! Taso '+p.lvl+'. Koff-Throw vahvistuu.');skill.damage+=1.5}
}
function survivor(dt){
 if(area!=='malmi'){mobs=[];shots=[];drops=[];bursts=[];return}if(bagOpen)return
 spawnClock-=dt;skillClock-=dt;hitClock-=dt;
 if(spawnClock<=0){spawnClock=.8+Math.random()*.55;spawnMob()}
 if(skillClock<=0){skillClock=skill.cooldown;fireKoff()}
 for(let i=mobs.length-1;i>=0;i--){let m=mobs[i],dx=p.x-m.x,dy=p.y-m.y,d=Math.hypot(dx,dy)||1;m.x+=dx/d*m.sp*dt;m.y+=dy/d*m.sp*dt;if(d<18&&hitClock<=0){p.hp-=m.dmg;hitClock=.65;m.x-=dx/d*24;m.y-=dy/d*24;msg(m.name+' osui! HP '+p.hp+'/'+p.max);if(p.hp<=0){p.hp=p.max;p.cash=Math.max(0,p.cash-5);area='home';p.x=7.5*T;p.y=5.5*T;mobs=[];shots=[];drops=[];msg('Heräsit Torpparinmäessä. Malmi voitti tällä kertaa.');break}}}
 for(let i=shots.length-1;i>=0;i--){let q=shots[i];q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;let hit=mobs.find(m=>Math.hypot(m.x-q.x,m.y-q.y)<m.r+q.r);if(hit||q.life<=0){explode(q.x,q.y);shots.splice(i,1)}}
 for(let i=drops.length-1;i>=0;i--){let d=drops[i];d.life-=dt;if(Math.hypot(d.x-p.x,d.y-p.y)<22){if(d.item.heal){p.hp=Math.min(p.max,p.hp+d.item.heal);addBag(d.item.name);msg(d.item.name+' +'+d.item.heal+' HP')}else if(d.item.value){p.cash+=d.item.value;msg('Poimit '+d.item.name)}else{addBag(d.item.name);msg('BAG + '+d.item.name)}drops.splice(i,1)}else if(d.life<=0)drops.splice(i,1)}
 for(let i=bursts.length-1;i>=0;i--){bursts[i].life-=dt;bursts[i].r+=150*dt;if(bursts[i].life<=0)bursts.splice(i,1)}
 hud();
}
function drawSurvivor(){
 if(area!=='malmi')return;let cam=camera();
 for(const d of drops){let x=Math.round(d.x-cam.x),y=Math.round(d.y-cam.y);rect(x-6,y-6,12,12,'#101210aa');rect(x-4,y-4,8,8,d.item.col);g.fillStyle='#f4edc5';g.font='8px monospace';g.fillText(d.item.value?'€':d.item.kind==='junk'?'JUNK':'ITEM',x-9,y-9)}
 for(const m of mobs){let x=Math.round(m.x-cam.x),y=Math.round(m.y-cam.y);rect(x-8,y-10,16,18,m.col);rect(x-6,y-15,12,8,'#c69a7a');rect(x-8,y-20,16,5,'#292725');rect(x-9,y+9,18,3,'#0007');rect(x-9,y-25,18,3,'#191b1a');rect(x-9,y-25,18*(m.hp/m.max),3,'#b9534d')}
 for(const q of shots){let x=Math.round(q.x-cam.x),y=Math.round(q.y-cam.y);rect(x-3,y-7,6,13,'#c9b35b');rect(x-2,y-9,4,3,'#ded7b5');rect(x-2,y-3,4,2,'#8b3d34')}
 for(const b of bursts){g.strokeStyle='#e9d58a';g.lineWidth=3;g.beginPath();g.arc(Math.round(b.x-cam.x),Math.round(b.y-cam.y),b.r,0,Math.PI*2);g.stroke()}
 g.fillStyle='#efe2aa';g.font='bold 10px monospace';g.fillText('KOFF-THROW '+Math.max(0,skillClock).toFixed(1)+'s',8,H-8);
 if(bagOpen){rect(55,35,370,245,'#171a18ee');g.strokeStyle='#c7b574';g.lineWidth=3;g.strokeRect(55,35,370,245);g.fillStyle='#eadca6';g.font='bold 18px monospace';g.fillText('BAG',75,65);g.font='12px monospace';let y=92,items=Object.entries(bag);if(!items.length)g.fillText('(tyhjä)',75,y);for(const [name,n] of items){g.fillText(name+'  x'+n,75,y);y+=22}g.fillStyle='#9fa69f';g.font='10px monospace';g.fillText('A = sulje',75,258)}
}
function msg(t){document.querySelector('#message').textContent=t}function hud(){place.textContent=area==='home'?'TORPPARINMÄKI':'MALMI';hp.textContent=p.hp;lvl.textContent=p.lvl;cash.textContent=p.cash}
function startBattle(){battle=true;release();e={...enemies[Math.floor(Math.random()*enemies.length)]};enemyName.textContent=e.name;enemyArt.textContent=e.icon;enemyHp.textContent=e.hp;battleLog.textContent=e.line;document.querySelector('#battle').classList.remove('hidden')}
function endBattle(){battle=false;document.querySelector('#battle').classList.add('hidden');hud()}
attack.onclick=()=>{if(!battle)return;let dmg=4+Math.floor(Math.random()*5)+p.lvl;e.hp-=dmg;if(e.hp<=0){p.cash+=e.cash;p.xp+=e.xp;msg(e.name+' kaatui. +'+e.xp+' XP, +'+e.cash+' €');if(p.xp>=p.lvl*12){p.xp=0;p.lvl++;p.max+=5;p.hp=p.max;msg('LEVEL UP! Taso '+p.lvl+'.')}endBattle();return}p.hp-=Math.max(1,e.atk-Math.floor(p.lvl/2));enemyHp.textContent=e.hp;hp.textContent=p.hp;battleLog.textContent='Osuit '+dmg+'. Vastaisku. HP: '+p.hp;if(p.hp<=0){p.hp=p.max;area='home';p.x=7.5*T;p.y=5.5*T;p.cash=Math.max(0,p.cash-5);msg('Heräsit Torpparinmäessä. Joku oli vienyt 5 €.');endBattle()}};
talk.onclick=()=>{if(Math.random()<.3){msg(e.name+' päätti jättää asian sikseen.');endBattle()}else battleLog.textContent=e.name+': “Ei kiinnosta.”'};run.onclick=()=>{if(Math.random()<.65){msg('Poistuit tilanteesta ripeällä kävelyllä.');endBattle()}else battleLog.textContent='Et päässyt karkuun. Kiusaannuttavaa.'};
act.onclick=()=>{if(area==='malmi'){bagOpen=!bagOpen;release();msg(bagOpen?'BAG avattu.':'BAG suljettu. Liiku ja väistele!')}else msg('Torpparinmäki on epäilyttävän idyllinen. Malmi odottaa idässä →')};
function loop(t){let dt=Math.min(.033,(t-last)/1000);last=t;movement(dt);survivor(dt);draw();requestAnimationFrame(loop)}hud();requestAnimationFrame(loop);
// Runtime build marker: JS is authoritative even if an old HTML shell was cached.
const buildTag=document.querySelector('h1 small');if(buildTag)buildTag.textContent='BUILD '+RUNTIME_BUILD;
