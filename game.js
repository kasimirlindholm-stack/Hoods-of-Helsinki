const c=document.querySelector('#game'),x=c.getContext('2d');x.imageSmoothingEnabled=false;
const S=32,C=15,R=10;
let p={x:7,y:5,hp:30,max:30,lvl:1,xp:0,cash:12,weapon:'Keppi'}, area='home',battle=false;
const maps={
home:[
'TTTTTTTTTTTTTTT','T....TTT......T','T.H..T........T','T....T..H.....T','T.............T','T......P......T','T.............T','T..H.......H..T','T..........>>>T','TTTTTTTTTTTTTTT'],
malmi:[
'BBBBBBBBBBBBBBB','B..A....B.....B','B.###...B.zzz.B','B.......B.zzz.B','B..zz.........B','B..zz..P...A..B','B......####...B','B.zzz.........B','B.zzz...A..<<<B','BBBBBBBBBBBBBBB']};
const enemies=[
{name:'Pultsari',hp:12,atk:3,xp:5,cash:3,icon:'🥴',line:'“Onks heittää kahta euroa?”'},
{name:'Vihainen mummo',hp:16,atk:4,xp:7,cash:5,icon:'👵',line:'“Nuoriso pilalla.”'},
{name:'Roadman',hp:21,atk:5,xp:10,cash:8,icon:'🥷',line:'“Bro.”'}];
let e=null;
function tile(ch,px,py){
 const home=area==='home'; x.fillStyle=home?'#638257':'#3b4140';x.fillRect(px,py,S,S);
 if(ch==='T'){x.fillStyle=home?'#315c37':'#202b27';x.fillRect(px,py,S,S);x.fillStyle=home?'#477a43':'#293831';x.fillRect(px+6,py+2,20,25)}
 if(ch==='B'||ch==='H'){x.fillStyle=home?'#bd9868':'#4b4e4d';x.fillRect(px+2,py+4,28,28);x.fillStyle=home?'#ffe08a':'#8b7358';x.fillRect(px+8,py+12,7,7);x.fillRect(px+19,py+12,7,7)}
 if(ch==='#'){x.fillStyle='#252827';x.fillRect(px,py+9,S,14);x.fillStyle='#65615b';x.fillRect(px,py+10,S,2)}
 if(ch==='z'){x.fillStyle='#252928';x.fillRect(px,py,S,S);x.fillStyle='#151817';for(let i=0;i<4;i++)x.fillRect(px+4+i*7,py+6+(i%2)*12,4,4)}
 if(ch==='A'){x.fillStyle='#555';x.fillRect(px+8,py+5,17,27);x.fillStyle='#c6a84a';x.fillRect(px+12,py+10,9,4)}
 if(ch==='>'||ch==='<'){x.fillStyle=home?'#d5bd75':'#736c50';x.fillRect(px,py,S,S);x.fillStyle='#222';x.font='18px monospace';x.fillText(ch,px+10,py+22)}
}
function draw(){
 const m=maps[area];for(let y=0;y<R;y++)for(let q=0;q<C;q++)tile(m[y][q],q*S,y*S);
 if(area==='home'){x.fillStyle='#f0ce78';x.fillRect(0,0,480,18);x.fillStyle='#27251e';x.font='10px monospace';x.fillText('TORPPARINMÄKI — THREAT LEVEL: EI TÄÄLLÄ MITÄÄN TAPAHDU',8,12)}
 else{x.fillStyle='#252525';x.fillRect(0,0,480,18);x.fillStyle='#aaa';x.font='10px monospace';x.fillText('MALMI — THREAT LEVEL: EPÄMÄÄRÄINEN',8,12)}
 x.fillStyle='#20252a';x.fillRect(p.x*S+8,p.y*S+8,16,21);x.fillStyle='#d9b18b';x.fillRect(p.x*S+10,p.y*S+3,12,10);x.fillStyle='#8a3131';x.fillRect(p.x*S+8,p.y*S+18,16,5)
}
function msg(t){document.querySelector('#message').textContent=t}
function hud(){place.textContent=area==='home'?'TORPPARINMÄKI':'MALMI';hp.textContent=p.hp;lvl.textContent=p.lvl;cash.textContent=p.cash}
function move(dx,dy){
 if(battle)return;let nx=p.x+dx,ny=p.y+dy,m=maps[area];if(nx<0||ny<0||nx>=C||ny>=R)return;
 let ch=m[ny][nx];if('TBH'.includes(ch))return;p.x=nx;p.y=ny;
 if(area==='home'&&ch==='>'){area='malmi';p.x=13;p.y=8;msg('MALMI. Jokin täällä haisee palaneelta sähköpotkulaudalta.');}
 else if(area==='malmi'&&ch==='<'){area='home';p.x=12;p.y=8;p.hp=p.max;msg('Takaisin Torpparinmäessä. HP palautui. Linnut laulavat epäilyttävän iloisesti.');}
 else if(area==='malmi'&&ch==='z'&&Math.random()<.28)startBattle();
 else if(ch==='A')msg('Automaatti näyttää toimivan. Se on jo Malmilla hyvä merkki.');
 draw();hud()
}
function startBattle(){battle=true;e={...enemies[Math.floor(Math.random()*enemies.length)]};enemyName.textContent=e.name;enemyArt.textContent=e.icon;enemyHp.textContent=e.hp;battleLog.textContent=e.line;document.querySelector('#battle').classList.remove('hidden')}
function endBattle(){battle=false;document.querySelector('#battle').classList.add('hidden');draw();hud()}
attack.onclick=()=>{if(!battle)return;let dmg=4+Math.floor(Math.random()*5)+p.lvl;e.hp-=dmg;if(e.hp<=0){p.cash+=e.cash;p.xp+=e.xp;msg(e.name+' kaatui. +'+e.xp+' XP, +'+e.cash+' €');if(p.xp>=p.lvl*12){p.xp=0;p.lvl++;p.max+=5;p.hp=p.max;msg('LEVEL UP! Olet nyt tasolla '+p.lvl+'.')}endBattle();return}p.hp-=Math.max(1,e.atk-Math.floor(p.lvl/2));enemyHp.textContent=e.hp;hp.textContent=p.hp;battleLog.textContent='Osuit '+dmg+'. '+e.name+' vastasi. HP: '+p.hp;if(p.hp<=0){p.hp=p.max;area='home';p.x=7;p.y=5;p.cash=Math.max(0,p.cash-5);msg('Heräsit Torpparinmäessä. Joku oli vienyt 5 €.');endBattle()}};
talk.onclick=()=>{if(Math.random()<.3){msg(e.name+' päätti, ettei tämä ollutkaan sen arvoista.');endBattle()}else battleLog.textContent=e.name+': “Ei kiinnosta.”'};
run.onclick=()=>{if(Math.random()<.65){msg('Poistuit tilanteesta ripeällä kävelyllä.');endBattle()}else battleLog.textContent='Et päässyt karkuun. Kiusaannuttavaa.'};
document.addEventListener('keydown',ev=>{const d={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[ev.key];if(d){ev.preventDefault();move(...d)}});
document.querySelectorAll('[data-k]').forEach(b=>b.addEventListener('pointerdown',()=>{let d={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[b.dataset.k];move(...d)}));
act.onclick=()=>msg(area==='home'?'Torpparinmäki tuntuu turvalliselta. Malmi odottaa idässä →':'Tutki kujia. Tummilla ruuduilla voi tulla encounter.');
draw();hud();