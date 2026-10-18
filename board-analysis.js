(()=>{
'use strict';
const getGame=()=>window.ChessAcademyDemo?.game;
const $=id=>document.getElementById(id);
const sources=['https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.min.js','https://cdn.jsdelivr.net/npm/stockfish@19.0.0/bin/stockfish-19-asm.js'];
let worker=null,ready=false,busy=false,current=null,queue=[],scores=new Map(),requested=false,lastKey='',error='',loading=false,attempt=0;
const fmt=v=>v===undefined?'…':typeof v==='string'?v:(v>=0?'+':'')+(v/100).toFixed(2);
function positions(){
 const g=getGame();if(!g)return [];
 const E=window.ChessAcademyEngine.ChessEngine;
 const replay=new E();const out=[replay.fen()];
 for(const h of g.history){const m=h.move;if(!replay.move(m.from,m.to,m.promotion||'q'))break;out.push(replay.fen())}
 if(out[out.length-1]!==g.fen())out.push(g.fen());
 return out;
}
function chance(cp){return 1/(1+Math.exp(-Math.max(-1000,Math.min(1000,cp))/170))}
function draw(){
 const pos=positions(),score=scores.get(pos[pos.length-1]);if(!$('caLiveEval'))return;
 $('caLiveEval').textContent=fmt(score);
 const white=$('caWhiteEval'),black=$('caBlackEval');if(white)white.textContent=fmt(score);if(black)black.textContent=typeof score==='number'?fmt(-score):typeof score==='string'&&score.startsWith('M')?'M'+(-Number(score.slice(1))):'…';
 $('caReviewStatus').textContent=error||'';
 const W=680,H=170,mid=H/2;let markup='<line x1="0" y1="'+mid+'" x2="'+W+'" y2="'+mid+'" stroke="#8999a8" stroke-dasharray="4 5"/>';
 const samples=pos.map((fen,i)=>({i,v:scores.get(fen)})).filter(p=>typeof p.v==='number');
 const bound=Math.max(200,...samples.map(p=>Math.abs(p.v)));
 const x=i=>pos.length===1?W/2:i*W/(pos.length-1),y=v=>mid-(v/bound)*(mid-12);
 if(samples.length)markup+='<polyline fill="none" stroke="#e9c27e" stroke-width="3" points="'+samples.map(p=>x(p.i)+','+y(p.v)).join(' ')+'"/>';
 if(samples.length)markup+='<polyline fill="none" stroke="#a9c8e9" stroke-width="2" stroke-dasharray="5 4" points="'+samples.map(p=>x(p.i)+','+y(-p.v)).join(' ')+'"/>';markup+='<text x="10" y="16" fill="#e9c27e" font-size="12">Beyaz avantajı</text><text x="10" y="162" fill="#a9c8e9" font-size="12">Siyah avantajı</text>'; for(const p of samples)markup+='<circle cx="'+x(p.i)+'" cy="'+y(p.v)+'" r="3" fill="#f6e6c6"><title>Hamle '+p.i+': '+fmt(p.v)+'</title></circle>';
 $('caEvalGraph').innerHTML=markup;
 const data={w:[],b:[]};for(let i=1;i<pos.length;i++){const before=scores.get(pos[i-1]),after=scores.get(pos[i]);if(typeof before!=='number'||typeof after!=='number')continue;const side=i%2?'w':'b';const loss=Math.max(0,(side==='w'?chance(before)-chance(after):chance(after)-chance(before)));data[side].push(loss)}
 const describe=side=>{const a=data[side];if(!a.length)return 'analiz bekleniyor';const avg=a.reduce((s,v)=>s+v,0)/a.length;return 'yaklaşık doğruluk %'+Math.round(100*(1-avg))+' · belirgin hata '+a.filter(v=>v>=.12).length+'/'+a.length};
 $('caReviewStats').textContent='';for(const side of ['w','b']){const line=document.createElement('div');line.textContent=(side==='w'?'Beyaz':'Siyah')+': '+describe(side);$('caReviewStats').append(line)}const note=document.createElement('small');note.textContent='Yaklaşık istatistiklerdir; Elo veya Lichess resmi doğruluğu değildir.';$('caReviewStats').append(note);
}
function next(){if(!ready||busy||!queue.length)return;const fen=queue.shift();if(scores.has(fen)){next();return}busy=true;current={fen,score:undefined,turn:fen.split(' ')[1]};worker.postMessage('position fen '+fen);worker.postMessage('go movetime '+(requested?350:200));draw()}
async function init(){
 if(worker||loading)return;
 loading=true;error='Motor dosyası indiriliyor…';draw();
 try{
  const address=sources[Math.min(attempt,sources.length-1)];
  const response=await fetch(address,{mode:'cors',cache:'force-cache'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const script=await response.text();
  if(script.length<10000)throw Error('Motor dosyası eksik');
  const src=URL.createObjectURL(new Blob([script],{type:'text/javascript'}));
  worker=new Worker(src);URL.revokeObjectURL(src);
  worker.onerror=e=>{const reason=e.message||'Web Worker başlatılamadı';worker?.terminate();worker=null;ready=false;busy=false;current=null;loading=false;if(attempt+1<sources.length){attempt++;error='Yedek motor deneniyor…';init()}else{error='Stockfish başlatılamadı: '+reason+' (tarayıcı güvenlik kısıtlaması olabilir)';draw()}};
  worker.onmessage=e=>{
   const line=String(e.data||'');
   if(line.includes('uciok'))worker.postMessage('isready');
   if(line.includes('readyok')){ready=true;loading=false;error='';next()}
   if(!current)return;
   const cp=line.match(/\bscore cp (-?\d+)/),mate=line.match(/\bscore mate (-?\d+)/);
   if(cp)current.score=Number(cp[1])*(current.turn==='w'?1:-1);
   if(mate)current.score='M'+(Number(mate[1])*(current.turn==='w'?1:-1));
   if(line.startsWith('bestmove ')){
    if(current.score!==undefined)scores.set(current.fen,current.score);
    current=null;busy=false;draw();next();
   }
  };
  worker.postMessage('uci');
  setTimeout(()=>{if(worker&&!ready&&loading){worker.terminate();worker=null;loading=false;if(attempt+1<sources.length){attempt++;init()}else{error='Stockfish yanıt vermedi. Tarayıcı motoru engelliyor olabilir.';draw()}}},18000);
 }catch(e){loading=false;if(attempt+1<sources.length){attempt++;error='Alternatif motor indiriliyor…';init()}else{error='Motor dosyası alınamadı: '+e.message;draw()}}
}

function schedule(full=false){
 const pos=positions();if(!pos.length)return;
 if(full)requested=true;
 const wanted=pos;
 for(const fen of wanted)if(!scores.has(fen)&&fen!==current?.fen&&!queue.includes(fen))queue.push(fen);
 draw();init();next();
}
function boot(){
 if(!getGame()||!$('caLiveEval')){setTimeout(boot,250);return}
 const style=document.createElement('style');style.textContent='.ca-review-tools{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:14px 0}.ca-review-tools button{padding:10px;border:1px solid #d4aa70;border-radius:8px;background:#5b482e;color:white;cursor:pointer}.ca-eval-summary{margin:12px 0;font-weight:700}#caLiveEval{font-size:23px;color:#e9c27e}#caEvalGraph{display:block;width:100%;height:auto;background:#101d27;border-radius:9px}#caReviewStats{font-size:13px;line-height:1.6} .ca-side-eval{position:absolute;left:-74px;top:12%;bottom:12%;width:65px;display:flex;flex-direction:column;justify-content:space-between;z-index:8;pointer-events:none}.ca-side-eval .ca-black-score{order:0}.ca-side-eval .ca-white-score{order:1}.ca-side-eval.flipped .ca-white-score{order:0}.ca-side-eval.flipped .ca-black-score{order:1}.ca-side-score{border:1px solid #b99862;border-radius:10px;background:#172631;color:#fff2d8;padding:8px 3px;text-align:center;box-shadow:0 5px 15px #0007;font:600 11px system-ui}.ca-side-score strong{display:block;font:700 18px system-ui;margin-top:4px}.ca-white-score strong{color:#f3db9f}.ca-black-score strong{color:#f4b9b9}body.embedded-studio .chess-board-frame{margin-left:74px!important;margin-right:0!important;width:calc(100% - 180px)!important}#caReviewStats>div{display:block;margin:5px 0}#caReviewStats small{display:block;margin-top:9px;opacity:.8}#caReviewStatus:empty{display:none}@media(max-width:550px){.ca-side-eval{left:-54px;width:48px}.ca-side-score{font-size:9px;padding:6px 1px}.ca-side-score strong{font-size:13px}body.embedded-studio .chess-board-frame{margin-left:54px!important;width:calc(100% - 155px)!important}}';document.head.append(style);

 const board=$('board');const frame=board.closest('.chess-board-frame');if(frame&&!$('caSideEval')){const rail=document.createElement('aside');rail.id='caSideEval';rail.className='ca-side-eval';rail.setAttribute('aria-label','Canlı beyaz ve siyah konum değerlendirmesi');rail.innerHTML='<div class="ca-side-score ca-white-score"><span>♔ Beyaz</span><strong id="caWhiteEval">…</strong></div><div class="ca-side-score ca-black-score"><span>♚ Siyah</span><strong id="caBlackEval">…</strong></div>';frame.append(rail)}const scoreRail=$('caSideEval'),capturedRail=document.querySelector('.ca-captured-rails');if(scoreRail&&capturedRail){const sync=()=>scoreRail.classList.toggle('flipped',capturedRail.classList.contains('flipped'));sync();new MutationObserver(sync).observe(capturedRail,{attributes:true,attributeFilter:['class']})}new MutationObserver(()=>{const g=getGame();if(!g)return;const key=g.fen()+'|'+g.history.length;if(key!==lastKey){lastKey=key;schedule(requested)}}).observe(board,{childList:true});
 schedule();
}
boot();
})();