(()=>{'use strict';
const $=id=>document.getElementById(id),Engine=window.ChessAcademyEngine.ChessEngine;
const pieces=[['R','Kale','Yatay veya dikey ilerler; üzerinden taş atlayamaz.'],['B','Fil','Çapraz ilerler; üzerinden taş atlayamaz.'],['Q','Vezir','Kale ve filin hareketlerini birleştirir.'],['N','At','İki kare bir yönde, bir kare dik yönde sıçrar.'],['K','Şah','Her yönde bir kare gider, tehdit edilen kareye gidemez.'],['P','Piyon','Düz ilerler, çapraz taş alır; ilk hamlede iki kare gidebilir.']];
const icons={R:'♖',B:'♗',Q:'♕',N:'♘',K:'♔',P:'♙'};
const missions=[
{id:'R1',piece:'R',fen:'7k/8/8/8/4R3/8/8/4K3 w - - 0 1',from:'e4',to:'e7',tip:'Kale dikey ilerler.'},
{id:'R2',piece:'R',fen:'7k/8/8/8/4R2p/8/8/4K3 w - - 0 1',from:'e4',to:'h4',tip:'Kale aynı sıradaki rakip piyonu alabilir.'},
{id:'R3',piece:'R',fen:'7k/8/8/8/4R3/8/8/4K3 w - - 0 1',from:'e4',to:'b4',tip:'Kale yatay da ilerler.'},
{id:'B1',piece:'B',fen:'7k/8/8/8/4B3/8/8/4K3 w - - 0 1',from:'e4',to:'g6',tip:'Fil çapraz ilerler.'},
{id:'B2',piece:'B',fen:'7k/1p6/8/8/4B3/8/8/4K3 w - - 0 1',from:'e4',to:'b7',tip:'Fil çaprazdaki rakip taşı alır.'},
{id:'B3',piece:'B',fen:'7k/8/8/8/4B3/8/8/4K3 w - - 0 1',from:'e4',to:'b1',tip:'Fil çaprazda geriye de gidebilir.'},
{id:'Q1',piece:'Q',fen:'7k/8/8/8/4Q3/8/8/4K3 w - - 0 1',from:'e4',to:'g6',tip:'Vezir çapraz ilerleyebilir.'},
{id:'Q2',piece:'Q',fen:'7k/8/8/8/p3Q3/8/8/4K3 w - - 0 1',from:'e4',to:'a4',tip:'Vezir yatayda taş alabilir.'},
{id:'Q3',piece:'Q',fen:'7k/8/8/8/4Q3/8/8/4K3 w - - 0 1',from:'e4',to:'e7',tip:'Vezir dikey ilerleyebilir.'},
{id:'N1',piece:'N',fen:'7k/8/8/8/4N3/8/8/4K3 w - - 0 1',from:'e4',to:'f6',tip:'At L şeklinde gider.'},
{id:'N2',piece:'N',fen:'7k/8/8/2p5/4N3/8/8/4K3 w - - 0 1',from:'e4',to:'c5',tip:'At L hareketiyle taş alır.'},
{id:'N3',piece:'N',fen:'7k/8/8/8/4N3/8/8/4K3 w - - 0 1',from:'e4',to:'g3',tip:'At başka taşların üzerinden sıçrayabilir.'},
{id:'K1',piece:'K',fen:'7k/8/8/8/4K3/8/8/8 w - - 0 1',from:'e4',to:'d3',tip:'Şah bir kare çapraz gidebilir.'},
{id:'K2',piece:'K',fen:'7k/8/8/8/4K3/8/8/8 w - - 0 1',from:'e4',to:'f4',tip:'Şah bir kare yatay gidebilir.'},
{id:'K3',piece:'K',fen:'7k/8/8/8/4K3/8/8/8 w - - 0 1',from:'e4',to:'f5',tip:'Şah rakibin kontrol ettiği kareye gidemez.'},
{id:'P1',piece:'P',fen:'7k/8/8/8/8/8/4P3/4K3 w - - 0 1',from:'e2',to:'e3',tip:'Piyon bir kare ileri yürür.'},
{id:'P2',piece:'P',fen:'7k/8/8/8/8/8/4P3/4K3 w - - 0 1',from:'e2',to:'e4',tip:'Piyon ilk hamlede iki kare ilerleyebilir.'},
{id:'P3',piece:'P',fen:'7k/8/8/3p4/4P3/8/8/4K3 w - - 0 1',from:'e4',to:'d5',tip:'Piyon çapraz taş alır, düz taş alamaz.'}
];
window.ChessAcademyBeginnerMissions=missions.map(m=>({...m}));
const params=new URLSearchParams(location.search),student=/^(deniz|ece|mert)$/.test(params.get('student')||'')?params.get('student'):'guest';
const KEY='chess-academy-beginner-v2:'+student;
let completed=[];try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(x))completed=x.filter(id=>missions.some(m=>m.id===id)).filter((id,i,a)=>a.indexOf(id)===i)}catch{}
let index=0,game=null,mission=null,flipped=false,locked=false,selected=false,timer=null,captured=[];
const premium=window.ChessPremiumBoard.init({boardId:'board'});
premium.flipButton.onclick=()=>premium.flip(()=>{flipped=!flipped;draw()});
function xp(){return completed.length*20}
function sync(){try{localStorage.setItem(KEY,JSON.stringify(completed))}catch{}
 if(window.parent!==window)try{window.parent.postMessage({type:'chess-academy-beginner-xp',student,xp:xp()},location.origin)}catch{}
}
function menu(){document.querySelectorAll('.journey-grid [data-piece]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.piece)===index);b.setAttribute('aria-pressed',String(Number(b.dataset.piece)===index));});const box=$('piece-menu');box.replaceChildren();pieces.forEach(([id,name],i)=>{const n=completed.filter(x=>x.startsWith(id)).length,b=document.createElement('button');b.type='button';b.textContent=icons[id]+' '+name+' '+n+'/3';b.className=index===i?'active':'';b.setAttribute('aria-pressed',String(index===i));b.onclick=()=>{index=i;setup()};box.append(b)});$('xp').textContent='Toplam XP: '+xp()+' / 360 · Tamamlanan görev: '+completed.length+'/18 · Profil: '+student}
function setup(){clearTimeout(timer);locked=false;selected=false;captured=[];const id=pieces[index][0],list=missions.filter(m=>m.piece===id);mission=list.find(m=>!completed.includes(m.id))||list[0];try{game=new Engine(mission.fen)}catch(err){$('status').textContent='Görev açılamadı: '+err.message;return}
 const valid=game.moves({square:mission.from}).some(m=>m.to===mission.to);if(!valid){$('status').textContent='Bu görev geçerli değil.';return}
 $('piece-title').textContent=icons[id]+' '+pieces[index][1];$('explain').textContent=pieces[index][2]+' '+mission.tip;
 $('mission').textContent='Görev '+(list.indexOf(mission)+1)+'/3: '+mission.from+' → '+mission.to;
 $('status').className='';$('status').textContent=completed.includes(mission.id)?'Bu taşı tamamladın! Tekrar çalışabilirsin.':'Taşa dokun, sonra hedef kareye git.';menu();draw()}
function draw(){if(!game)return;const taken=$('beginnerCaptured');taken.replaceChildren();for(const p of captured){const el=document.createElement('span');el.innerHTML=premium.pieceSVG(icons[p.toUpperCase()]||'',p);taken.append(el)}premium.coordinates(flipped);const board=$('board');board.replaceChildren();for(let i=0;i<64;i++){const n=flipped?63-i:i,sq='abcdefgh'[n%8]+(8-Math.floor(n/8)),p=game.at(sq),b=document.createElement('button');b.type='button';b.className='sq '+((Math.floor(i/8)+i%8)%2?'dark':'light')+(sq===mission.to?' target':'');b.setAttribute('aria-label',sq+(p?' '+p:''));b.dataset.square=sq;if(p)b.innerHTML=premium.pieceSVG(icons[p.toUpperCase()]||'',p);b.onclick=()=>attempt(sq);board.append(b)}}
function attempt(sq){if(locked||!game)return;if(sq===mission.from){selected=true;$('status').textContent='Şimdi '+mission.to+' karesini seç.';return}if(!selected){$('status').textContent='Önce '+mission.from+' karesindeki taşı seç.';return}
 if(sq!==mission.to){$('status').className='';$('status').textContent='Bu hedef değil. '+mission.tip+' Hedef: '+mission.to;return}
 const victim=game.at(sq);const move=game.move(mission.from,sq);if(!move){$('status').textContent='Kurallara aykırı hamle. Tekrar dene.';return}
 if(victim)captured.push(victim);locked=true;const first=!completed.includes(mission.id);if(first){completed.push(mission.id);sync()}
 premium.play(move.capture?'capture':'move');$('status').className='success';$('status').textContent=first?'✓ Doğru! +20 XP.':'✓ Doğru! Bu görev zaten tamamlanmıştı, XP değişmedi.';menu();draw();
 const list=missions.filter(m=>m.piece===pieces[index][0]),remaining=list.some(m=>!completed.includes(m.id));
 if(remaining)timer=setTimeout(setup,1000);else if(completed.length<missions.length)timer=setTimeout(()=>{index=(index+1)%pieces.length;setup()},1200);
}
$('beginnerZoom').oninput=()=>document.querySelector('.beginner-board-shell').style.setProperty('--board-size',$('beginnerZoom').value+'px');document.querySelectorAll('.journey-grid [data-piece]').forEach(b=>b.onclick=()=>{index=Number(b.dataset.piece);setup();document.getElementById('board').scrollIntoView({behavior:'smooth',block:'center'})});$('retry').onclick=setup;$('next').onclick=()=>{index=(index+1)%pieces.length;setup()};setup();sync();
})();