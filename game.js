const c=document.querySelector('#game'),g=c.getContext('2d');g.imageSmoothingEnabled=false;
const W=480,H=320,T=32,C=15,R=10;let area='home',battle=false,last=performance.now(),walk=0,encDist=0,portalLock=0;
let p={x:7.5*T,y:5.5*T,r:8,hp:30,max:30,lvl:1,xp:0,cash:12,weapon:'Keppi',face:'down'};
const maps={home:['TTTTTTTTTTTTTTT','T....TTT......T','T.H..T........T','T....T..H.....T','T.............T','T.............T','T.............T','T..H.......H..T','T..........>>>T','TTTTTTTTTTTTTTT'],malmi:['BBBBBBBBBBBBBBB','B..A....B.....B','B.###...B.zzz.B','B.......B.zzz.B','B..zz.........B','B....... ...A.B'.replace(' ',''),'B......####...B','B.zzz.........B','B.zzz...A..<<<B','BBBBBBBBBBBBBBB']};
const enemies=[{name:'Pultsari',hp:12,atk:3,xp:5,cash:3,icon:'🥴',line:'“Onks heittää kahta euroa?”'},{name:'Vihainen mummo',hp:16,atk:4,xp:7,cash:5,icon:'👵',line:'“Nuoriso pilalla.”'},{name:'Roadman',hp:21,atk:5,xp:10,cash:8,icon:'🥷',line:'“Bro.”'}];let e=null;
function rect(x,y,w,h,col){g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}\nfunction px(x,y,col){rect(x,y,2,2,col)}
function tile(ch,x,y){
 const h=area==='home';rect(x,y,T,T,h?'#719b58':'#4b5250');\n if(h){for(let i=0;i<4;i++){let q=(x*3+y*7+i*11)%27;px(x+3+q,y+4+(q*5)%23,i%2?'#83aa67':'#628b4d')}}else{for(let i=0;i<3;i++){let q=(x*5+y*3+i*13)%27;px(x+2+q,y+5+(q*7)%22,'#5b625f')}}
 if(ch==='.'&&h){rect(x,y+14,T,8,'#b9a777');rect(x+2,y+16,T-4,4,'#c9ba8b')}
 if(ch==='T'){rect(x+12,y+16,7,15,h?'#684a31':'#393c38');rect(x+3,y+7,26,14,h?'#356b3b':'#303c36');rect(x+7,y+2,19,18,h?'#4e884d':'#3d4a41');rect(x+11,y,12,7,h?'#61985b':'#465449');rect(x+5,y+10,4,4,h?'#79ad68':'#566258')}
 if(ch==='H'){rect(x+1,y+13,30,19,'#c58d5d');rect(x+3,y+15,26,2,'#d8a474');rect(x-1,y+8,34,7,'#684337');rect(x+3,y+5,26,5,'#7b5040');rect(x+7,y+19,8,8,'#f6d17b');rect(x+9,y+21,4,4,'#fff0ad');rect(x+21,y+19,7,13,'#694633');rect(x+22,y+21,2,2,'#d8b26c')}
 if(ch==='B'){rect(x,y+5,T,27,'#474b4a');rect(x+3,y+9,7,6,'#786b52');rect(x+17,y+9,8,6,'#665e50');rect(x+6,y+22,18,10,'#343735')}
 if(ch==='#'){rect(x,y+8,T,18,'#292d2c');rect(x,y+10,T,2,'#74746c');rect(x+3,y+24,8,2,'#161817')}
 if(ch==='z'){rect(x,y,T,T,'#292e2d');rect(x+2,y+3,12,4,'#202322');rect(x+18,y+20,10,3,'#1e2220');rect(x+20,y+5,5,5,'#6b6049')}
 if(ch==='A'){rect(x+8,y+5,17,27,'#626462');rect(x+11,y+8,11,5,'#c2a14d');rect(x+12,y+19,9,3,'#333')}
 if(ch==='>'||ch==='<'){rect(x,y,T,T,h?'#d5bd75':'#77705a');g.fillStyle='#292b28';g.font='bold 18px monospace';g.fillText(ch,x+10,y+22)}
}
function player(){
 let X=p.x,Y=p.y,b=Math.floor(walk)%2;rect(X-8,Y+12,16,4,'#0004');rect(X-7,Y+4,6,9,'#20252b');rect(X+1,Y+4,6,9,'#20252b');rect(X-9,Y-9,18,17,'#7f2f3b');rect(X-7,Y-7,14,3,'#a94b55');rect(X-6,Y-18,12,11,'#d4a27d');rect(X-7,Y-20,14,5,'#332824');rect(X-8,Y-17,3,7,'#332824');rect(X-8,Y-7,3,9,'#d4a27d');rect(X+5,Y-7,3,9,'#d4a27d');rect(X-4,Y-15,2,2,'#27231f');rect(X+2,Y-15,2,2,'#27231f');if(b){rect(X-7,Y+9,5,5,'#171a1c');rect(X+2,Y+8,5,5,'#171a1c')}else{rect(X-7,Y+8,5,5,'#171a1c');rect(X+2,Y+9,5,5,'#171a1c')}}
function draw(){
 for(let y=0;y<R;y++)for(let x=0;x<C;x++)tile(maps[area][y][x],x*T,y*T);
 if(area==='home'){rect(0,0,W,18,'#efd37f');g.fillStyle='#302d22';g.font='10px monospace';g.fillText('TORPPARINMÄKI — THREAT LEVEL: EI TÄÄLLÄ MITÄÄN TAPAHDU',8,12)}
 else{rect(0,0,W,18,'#252928');g.fillStyle='#b8bbb7';g.font='10px monospace';g.fillText('MALMI — THREAT LEVEL: EPÄMÄÄRÄINEN',8,12);g.strokeStyle='#aeb8b833';for(let i=0;i<18;i++){let rx=(i*73+performance.now()/12)%520-20,ry=(i*47+performance.now()/8)%340;g.beginPath();g.moveTo(rx,ry);g.lineTo(rx-5,ry+12);g.stroke()}}
 player()
}
function cellAt(x,y){let cx=Math.floor(x/T),cy=Math.floor(y/T);return maps[area][cy]?.[cx]||'B'}
function blocked(x,y){return 'TBH'.includes(cellAt(x,y))}
let joy={x:0,y:0,active:false,id:null};const j=document.querySelector('#joy'),s=document.querySelector('#stick');
function setJoy(ev){let r=j.getBoundingClientRect(),dx=ev.clientX-(r.left+r.width/2),dy=ev.clientY-(r.top+r.height/2),d=Math.hypot(dx,dy),m=40;if(d>m){dx*=m/d;dy*=m/d}joy.x=dx/m;joy.y=dy/m;s.style.transform='translate('+dx+'px,'+dy+'px)'}
j.addEventListener('pointerdown',ev=>{joy.active=true;joy.id=ev.pointerId;j.setPointerCapture(ev.pointerId);setJoy(ev)});
j.addEventListener('pointermove',ev=>{if(joy.active&&ev.pointerId===joy.id)setJoy(ev)});
function release(){joy.active=false;joy.x=joy.y=0;s.style.transform='translate(0,0)'}j.addEventListener('pointerup',release);j.addEventListener('pointercancel',release);
let keys={};addEventListener('keydown',e=>keys[e.key]=1);addEventListener('keyup',e=>keys[e.key]=0);
function movement(dt){
 if(battle)return;let dx=joy.x+(keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0),dy=joy.y+(keys.ArrowDown?1:0)-(keys.ArrowUp?1:0),mag=Math.hypot(dx,dy);if(mag<.08)return;if(mag>1){dx/=mag;dy/=mag;mag=1}
 const sp=94*mag,ox=p.x,oy=p.y,nx=p.x+dx*sp*dt,ny=p.y+dy*sp*dt;
 if(!blocked(nx+Math.sign(dx)*p.r,p.y))p.x=nx;if(!blocked(p.x,ny+Math.sign(dy)*p.r))p.y=ny;
 let moved=Math.hypot(p.x-ox,p.y-oy);walk+=moved/8;if(Math.abs(dx)>Math.abs(dy))p.face=dx>0?'right':'left';else p.face=dy>0?'down':'up';
 let ch=cellAt(p.x,p.y);if(area==='home'&&ch==='>'){area='malmi';p.x=13.3*T;p.y=8.5*T;msg('MALMI. Sade alkaa melkein välittömästi. Tietenkin.');}
 else if(area==='malmi'&&ch==='<'){area='home';p.x=11.7*T;p.y=8.5*T;p.hp=p.max;msg('Takaisin Torpparinmäessä. HP palautui.');}
 if(area==='malmi'&&ch==='z'){encDist+=moved;if(encDist>45){encDist=0;if(Math.random()<.38)startBattle()}}else encDist=0;hud()
}
function msg(t){document.querySelector('#message').textContent=t}function hud(){place.textContent=area==='home'?'TORPPARINMÄKI':'MALMI';hp.textContent=p.hp;lvl.textContent=p.lvl;cash.textContent=p.cash}
function startBattle(){battle=true;release();e={...enemies[Math.floor(Math.random()*enemies.length)]};enemyName.textContent=e.name;enemyArt.textContent=e.icon;enemyHp.textContent=e.hp;battleLog.textContent=e.line;document.querySelector('#battle').classList.remove('hidden')}
function endBattle(){battle=false;document.querySelector('#battle').classList.add('hidden');hud()}
attack.onclick=()=>{if(!battle)return;let dmg=4+Math.floor(Math.random()*5)+p.lvl;e.hp-=dmg;if(e.hp<=0){p.cash+=e.cash;p.xp+=e.xp;msg(e.name+' kaatui. +'+e.xp+' XP, +'+e.cash+' €');if(p.xp>=p.lvl*12){p.xp=0;p.lvl++;p.max+=5;p.hp=p.max;msg('LEVEL UP! Taso '+p.lvl+'.')}endBattle();return}p.hp-=Math.max(1,e.atk-Math.floor(p.lvl/2));enemyHp.textContent=e.hp;hp.textContent=p.hp;battleLog.textContent='Osuit '+dmg+'. Vastaisku. HP: '+p.hp;if(p.hp<=0){p.hp=p.max;area='home';p.x=7.5*T;p.y=5.5*T;p.cash=Math.max(0,p.cash-5);msg('Heräsit Torpparinmäessä. Joku oli vienyt 5 €.');endBattle()}};
talk.onclick=()=>{if(Math.random()<.3){msg(e.name+' päätti jättää asian sikseen.');endBattle()}else battleLog.textContent=e.name+': “Ei kiinnosta.”'};run.onclick=()=>{if(Math.random()<.65){msg('Poistuit tilanteesta ripeällä kävelyllä.');endBattle()}else battleLog.textContent='Et päässyt karkuun. Kiusaannuttavaa.'};
act.onclick=()=>msg(area==='home'?'Torpparinmäki on epäilyttävän idyllinen. Malmi odottaa idässä →':'Kujilla kannattaa pitää silmät auki.');
function loop(t){let dt=Math.min(.033,(t-last)/1000);last=t;movement(dt);draw();requestAnimationFrame(loop)}hud();requestAnimationFrame(loop);