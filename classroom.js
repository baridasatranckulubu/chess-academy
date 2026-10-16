(()=>{'use strict';
const {ChessEngine,START}=window.ChessAcademyEngine, $=id=>document.getElementById(id), KEY='chess-academy-classroom-v18';
const symbols={K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
let all=[],cursor=0,flipped=false,selected=null,note='';
const premium=window.ChessPremiumBoard?.init({boardId:'board',wrapId:'board'});
let suggestion=null,requestSerial=0,requestTimer=null,cloudCache=new Map(),autoAnalysis=true;
function boardCoords(sq){const f=sq.charCodeAt(0)-97,r=Number(sq[1])-1;return {x:(flipped?7-f:f)*12.5+6.25,y:(flipped?r:7-r)*12.5+6.25}}
function drawSuggestion(){
 const layer=$('hint-layer');layer.replaceChildren();if(!suggestion)return;
 const ns='http://www.w3.org/2000/svg',defs=document.createElementNS(ns,'defs'),marker=document.createElementNS(ns,'marker'),path=document.createElementNS(ns,'path');
 for(const [k,v] of Object.entries({id:'hint-arrow-head',markerWidth:'4',markerHeight:'4',refX:'2',refY:'2',orient:'auto'}))marker.setAttribute(k,v);
 path.setAttribute('d','M0 0 L4 2 L0 4 Z');path.setAttribute('fill','#38e8bb');marker.append(path);defs.append(marker);layer.append(defs);
 const a=boardCoords(suggestion.uci.slice(0,2)),b=boardCoords(suggestion.uci.slice(2,4));
 const svgNS='http://www.w3.org/2000/svg';
 const line=document.createElementNS(svgNS,'line');for(const [k,v] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#38e8bb','stroke-width':'3.5','stroke-linecap':'round',opacity:'.72','marker-end':'url(#hint-arrow-head)'}))line.setAttribute(k,v);layer.append(line);
}
async function analyzePosition(){
 const serial=++requestSerial;clearTimeout(requestTimer);suggestion=null;drawSuggestion();
 if(!autoAnalysis){$('suggestion-status').textContent='Otomatik öneriler kapalı.';return}
 const e=replay(cursor),fen=e.fen();
 if(e.isCheckmate()||e.isDraw()){$('suggestion-status').textContent='Oyun sona erdi; öneri yok.';return}
 $('suggestion-status').textContent='Lichess bulut değerlendirmesi aranıyor…';
 try{
  let result=cloudCache.get(fen);
  if(!result){
   const response=await fetch('https://lichess.org/api/cloud-eval?'+new URLSearchParams({fen,multiPv:'3',variant:'standard'}),{headers:{Accept:'application/json'}});
   if(serial!==requestSerial)return;
   if(response.status===404){$('suggestion-status').textContent='Bu pozisyon için Lichess bulut analizi yok. “Lichess ile analiz et” düğmesinden Stockfish çalıştırabilirsiniz.';return}
   if(response.status===429){autoAnalysis=false;$('auto-hints').checked=false;$('suggestion-status').textContent='Lichess istek sınırına ulaşıldı. Otomatik sorgular durduruldu.';return}
   if(!response.ok)throw Error('HTTP '+response.status);
   result=await response.json();cloudCache.set(fen,result);
  }
  if(serial!==requestSerial)return;
  const pv=result?.pvs?.[0],uci=pv?.moves?.split(' ')[0];
  if(!uci||!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci))throw Error('Öneri hamlesi bulunamadı');
  const test=replay(cursor);if(!test.move(uci.slice(0,2),uci.slice(2,4),uci[4]||'q'))throw Error('Öneri mevcut pozisyonda yasal değil');
  suggestion={uci,depth:result.depth,cp:pv.cp,mate:pv.mate};drawSuggestion();
  const score=typeof pv.mate==='number'?'Mat '+pv.mate:typeof pv.cp==='number'?(pv.cp/100).toFixed(2)+' piyon':'puan bilinmiyor';
  $('suggestion-status').textContent='Önerilen hamle: '+uci+' · Değerlendirme: '+score+' · Derinlik: '+(result.depth||'?')+'. Bu bir motor tahminidir, %100 garanti değildir.';
 }catch(err){if(serial===requestSerial)$('suggestion-status').textContent='Bulut analizi alınamadı ('+err.message+'). Lichess analiz tahtasını açabilirsiniz.'}
}
function scheduleAnalysis(){++requestSerial;clearTimeout(requestTimer);suggestion=null;drawSuggestion();if(autoAnalysis)requestTimer=setTimeout(analyzePosition,800)}

function fresh(){return new ChessEngine(START)}
function replay(limit){const e=fresh();for(let i=0;i<limit;i++){const u=all[i];if(!e.move(u.slice(0,2),u.slice(2,4),u[4]||'q'))throw Error('Geçersiz kayıt: '+u)}return e}
function persist(){try{localStorage.setItem(KEY,JSON.stringify({moves:all,note,updated:new Date().toISOString()}))}catch(e){$('status').textContent='Kaydetme başarısız: '+e.message}}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||'{}');if(!Array.isArray(d.moves))return;const candidate=d.moves;const e=fresh();for(const u of candidate){if(typeof u!=='string'||!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(u)||!e.move(u.slice(0,2),u.slice(2,4),u[4]||'q'))return}all=candidate;cursor=all.length;note=String(d.note||'').slice(0,5000)}catch{}}
function render(){premium?.coordinates(flipped);const e=replay(cursor);$('board').replaceChildren();for(let r=0;r<8;r++)for(let c=0;c<8;c++){const file=flipped?7-c:c,rank=flipped?r:7-r,sq=String.fromCharCode(97+file)+(rank+1),piece=e.at(sq);const b=document.createElement('button');b.type='button';b.className='sq '+((r+c)%2?'dark':'light')+(selected===sq?' selected':'');b.title=sq+(piece?' '+piece:'');b.setAttribute('aria-label',sq+(piece?' '+piece:''));b.textContent=symbols[piece]||'';b.onclick=()=>clickSquare(sq);$('board').append(b)}drawSuggestion();
$('moves').replaceChildren();const start=document.createElement('button');start.className='move'+(cursor===0?' active':'');start.textContent='Başlangıç';start.onclick=()=>jump(0);$('moves').append(start);all.forEach((u,i)=>{const b=document.createElement('button');b.className='move'+(cursor===i+1?' active':'');b.textContent=(Math.floor(i/2)+1)+(i%2?'... ':'. ')+u;b.onclick=()=>jump(i+1);$('moves').append(b)});$('summary').textContent=all.length+' yarım hamle kaydedildi · '+(e.turn==='w'?'Beyaz':'Siyah')+' oynayacak';$('saved-note').textContent=note||'Henüz not eklenmedi.';$('note').value=note;if(e.isCheckmate())$('status').textContent='Şah mat';else if(e.isDraw())$('status').textContent='Beraberlik pozisyonu';else $('status').textContent=e.isCheck()?'Şah çekildi':(e.turn==='w'?'Beyaz':'Siyah')+' hamlede'}
function jump(n){cursor=n;selected=null;render();scheduleAnalysis()}
function clickSquare(sq){const e=replay(cursor);if(selected){const capture=!!e.at(sq);const u=e.move(selected,sq);if(u){premium?.play(e.isCheckmate()?'mate':e.isCheck()?'check':capture||u.enPassant?'capture':'move');all=all.slice(0,cursor);all.push(u.uci);cursor=all.length;selected=null;persist();render();scheduleAnalysis();return}}selected=e.at(sq)&&((e.turn==='w')===(e.at(sq)===e.at(sq).toUpperCase()))?sq:null;render()}
function importMoves(){const text=$('input').value.trim();const raw=text.replace(/\{[^}]*\}/g,' ').replace(/\([^)]*\)/g,' ').replace(/\d+\.(?:\.\.)?/g,' ').replace(/\b(?:1-0|0-1|1\/2-1\/2|\*)\b/g,' ').trim().split(/[\s,;]+/).filter(Boolean);const e=fresh(),moves=[];for(let i=0;i<raw.length;i++){const u=raw[i].toLowerCase();if(!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(u)||!e.move(u.slice(0,2),u.slice(2,4),u[4]||'q')){$('status').textContent='Hamle '+(i+1)+' geçersiz: '+raw[i]+'. UCI biçimi kullanın.';return}moves.push(u)}all=moves;cursor=moves.length;persist();render();scheduleAnalysis()}
function lichess(){const fen=replay(cursor).fen(),url='https://lichess.org/analysis/standard/'+encodeURIComponent(fen.replaceAll(' ','_'));const slot=$('lichess-slot');slot.replaceChildren();const frame=document.createElement('iframe');frame.className='analysis-frame';frame.title='Lichess Stockfish analiz tahtası';frame.src='https://lichess.org/embed/analysis/standard/'+fen.replaceAll(' ','_')+'?theme=brown&bg=dark';frame.referrerPolicy='no-referrer';frame.loading='lazy';slot.append(frame);$('engine-status').textContent='Lichess analiz tahtası yükleniyor. Tam motor araçları için yeni sekmede açın.';window.open(url,'_blank','noopener,noreferrer')}
function download(){const txt=all.map((u,i)=>(i%2===0?(Math.floor(i/2)+1)+'. ':'')+u).join(' ')+'\n\n{'+note.replace(/[{}]/g,'')+'}\n';const a=document.createElement('a');const blob=new Blob([txt],{type:'text/plain;charset=utf-8'});a.href=URL.createObjectURL(blob);a.download='chess-academy-class-uci.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
$('back').onclick=()=>jump(Math.max(0,cursor-1));$('forward').onclick=()=>jump(Math.min(all.length,cursor+1));$('latest').onclick=()=>jump(all.length);$('flip').onclick=()=>premium?premium.flip(()=>{flipped=!flipped;render()}):(flipped=!flipped,render());if(premium)premium.flipButton.onclick=$('flip').onclick;$('reset').onclick=()=>{if(confirm('Mevcut oyunu sıfırlamak istiyor musunuz?')){all=[];cursor=0;note='';persist();render();scheduleAnalysis()}};$('import').onclick=importMoves;$('copy').onclick=()=>{const text=all.join(' ');navigator.clipboard?.writeText(text).then(()=>$('status').textContent='Hamleler kopyalandı').catch(()=>$('status').textContent='Kopyalama engellendi; metni elle seçin');$('input').value=text};$('save').onclick=()=>{note=$('note').value.slice(0,5000);persist();render();$('status').textContent='Sınıf defteri bu tarayıcıya kaydedildi'};$('open-lichess').onclick=lichess;$('download').onclick=download;
$('auto-hints').onchange=e=>{autoAnalysis=e.target.checked;if(autoAnalysis)scheduleAnalysis();else{++requestSerial;clearTimeout(requestTimer);suggestion=null;drawSuggestion();$('suggestion-status').textContent='Otomatik öneriler kapalı.'}};
$('refresh-hints').onclick=()=>analyzePosition();
window.addEventListener('storage',e=>{if(e.key===KEY){load();render();scheduleAnalysis()}});load();render();scheduleAnalysis();
})();
