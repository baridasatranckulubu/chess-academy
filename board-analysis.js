(()=>{
'use strict';
const getGame=()=>window.ChessAcademyDemo?.game;
const $=id=>document.getElementById(id);
const sources=['engines/stockfish19/stockfish-19-lite-single.js'];
let worker=null,ready=false,busy=false,current=null,queue=[],scores=new Map(),requested=false,lastKey='',error='',loading=false,attempt=0,liveEnabled=false,bestMove=null,analysisEpoch=0;
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
 const livePositions=positions(),pos=reviewSnapshot?.positions||livePositions,score=scores.get(livePositions[livePositions.length-1]);if(!$('caLiveEval'))return;
 $('caLiveEval').textContent=fmt(score);
 const white=$('caWhiteEval'),black=$('caBlackEval');if(white)white.textContent=fmt(score);if(black)black.textContent=typeof score==='number'?fmt(-score):typeof score==='string'&&score.startsWith('M')?'M'+(-Number(score.slice(1))):'…';
 $('caReviewStatus').textContent=error||'';
 const W=680,H=170,mid=H/2;let markup='<line x1="0" y1="'+mid+'" x2="'+W+'" y2="'+mid+'" stroke="#8999a8" stroke-dasharray="4 5"/>';
 const samples=pos.map((fen,i)=>({i,v:scores.get(fen)})).filter(p=>typeof p.v==='number');
 const bound=Math.max(200,...samples.map(p=>Math.abs(p.v)));
 const x=i=>pos.length===1?W/2:i*W/(pos.length-1),y=v=>mid-(v/bound)*(mid-12);
 if(samples.length)markup+='<polyline fill="none" stroke="#e9c27e" stroke-width="3" points="'+samples.map(p=>x(p.i)+','+y(p.v)).join(' ')+'"/>';
 if(samples.length)markup+='<polyline fill="none" stroke="#a9c8e9" stroke-width="2" stroke-dasharray="5 4" points="'+samples.map(p=>x(p.i)+','+y(-p.v)).join(' ')+'"/>';markup+='<text x="10" y="16" fill="#e9c27e" font-size="12">Beyaz avantajı</text><text x="10" y="162" fill="#a9c8e9" font-size="12">Siyah avantajı</text>'; for(const p of samples)markup+='<circle cx="'+x(p.i)+'" cy="'+y(p.v)+'" r="3" fill="#f6e6c6"><title>Hamle '+p.i+': '+fmt(p.v)+'</title></circle>';
 $('caEvalGraph').innerHTML=markup;const graphWhite=$('caGraphWhite'),graphBlack=$('caGraphBlack');if(graphWhite)graphWhite.textContent=fmt(score);if(graphBlack)graphBlack.textContent=typeof score==='number'?fmt(-score):typeof score==='string'&&score.startsWith('M')?'M'+(-Number(score.slice(1))):'…';
 const data={w:[],b:[]};for(let i=1;i<pos.length;i++){const before=scores.get(pos[i-1]),after=scores.get(pos[i]);if(typeof before!=='number'||typeof after!=='number')continue;const side=i%2?'w':'b';const loss=Math.max(0,(side==='w'?chance(before)-chance(after):chance(after)-chance(before)));data[side].push(loss)}
 const stats=$('caReviewStats');stats.replaceChildren();
 for(const side of ['w','b']){
  const moves=[],losses=[];
  for(let i=1;i<pos.length;i++){if((i%2?'w':'b')!==side)continue;const before=scores.get(pos[i-1]),after=scores.get(pos[i]);if(typeof before!=='number'||typeof after!=='number')continue;const loss=Math.max(0,(side==='w'?chance(before)-chance(after):chance(after)-chance(before)));losses.push(loss);if(loss>=.12)moves.push(i)}
  const avg=losses.length?losses.reduce((sum,v)=>sum+v,0)/losses.length:null;
  const line=document.createElement('div');line.textContent=(side==='w'?'Beyaz':'Siyah')+': '+(avg===null?'analiz bekleniyor':'yaklaşık doğruluk %'+Math.round(100*(1-avg)))+' - belirgin hata '+moves.length;stats.append(line);
  const buttons=document.createElement('div');buttons.className='ca-mistake-numbers';
  moves.forEach((ply,index)=>{const btn=document.createElement('button');btn.type='button';btn.textContent=String(index+1);btn.title=Math.ceil(ply/2)+'. hamledeki hatayı tahtada göster';btn.onclick=()=>showMistake(ply,side,index+1);buttons.append(btn)});
  stats.append(buttons);
 }
}
let annotation=null,reviewSnapshot=null;
function clearAnnotation(){annotation=null;document.querySelectorAll('.ca-error-arrow,.ca-error-circle').forEach(el=>el.remove());}
function paintAnnotation(){
 if(!annotation)return;const board=$('board');if(!board)return;
 const from=board.querySelector('[data-square="'+annotation.from+'"]'),to=board.querySelector('[data-square="'+annotation.to+'"]');if(!from||!to)return;
 const bounds=board.getBoundingClientRect(),a=from.getBoundingClientRect(),b=to.getBoundingClientRect();
 const cx=r=>r.left-bounds.left+r.width/2,cy=r=>r.top-bounds.top+r.height/2;
 const circle=document.createElement('div');circle.className='ca-error-circle';circle.style.left=(cx(b)-b.width*.45)+'px';circle.style.top=(cy(b)-b.height*.45)+'px';circle.style.width=b.width*.9+'px';circle.style.height=b.height*.9+'px';board.append(circle);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('ca-error-arrow');svg.setAttribute('viewBox','0 0 '+bounds.width+' '+bounds.height);svg.setAttribute('preserveAspectRatio','none');svg.innerHTML='<defs><marker id="caArrowHead" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#ff7d4d"/></marker></defs><line x1="'+cx(a)+'" y1="'+cy(a)+'" x2="'+cx(b)+'" y2="'+cy(b)+'" stroke="#ff7d4d" stroke-width="7" stroke-linecap="round" marker-end="url(#caArrowHead)"/>';board.append(svg);
}
function showMistake(ply,side,number){
 if(!reviewSnapshot){const game=getGame();reviewSnapshot={positions:positions().slice(),moves:game.history.map(h=>({...h.move}))}}const entry=reviewSnapshot.moves[ply-1],fen=reviewSnapshot.positions[ply];if(!fen||!entry)return;
 const move={from:entry.from,to:entry.to};
 window.ChessAcademyDemo.loadReviewPosition(fen,move);
 annotation=move;paintAnnotation();
 const notice=$('caMistakeNotice');if(notice){notice.hidden=false;notice.textContent=(side==='w'?'Beyaz':'Siyah')+' '+number+'. hata: '+Math.ceil(ply/2)+'. hamle. İşaretleri kaldırmak ve bu konumdan devam etmek için tahtaya sol tıkla.'}
 $('board').scrollIntoView({behavior:'smooth',block:'center'});
}
function setupReview(){
 const board=$('board');if(!board)return;
 $('resetBoard')?.addEventListener('click',()=>{reviewSnapshot=null;clearAnnotation();const n=$('caMistakeNotice');if(n)n.hidden=true});
 const notice=document.createElement('p');notice.id='caMistakeNotice';notice.hidden=true;notice.className='ca-mistake-notice';board.closest('.chess-board-frame')?.after(notice);
 board.addEventListener('click',event=>{if(annotation){event.stopPropagation();event.preventDefault();clearAnnotation();const n=$('caMistakeNotice');if(n)n.hidden=true}},true);
}
function next(){if(!liveEnabled||!ready||busy||!queue.length)return;const fen=queue.pop();queue=[];busy=true;current={fen,score:undefined,turn:fen.split(' ')[1],epoch:analysisEpoch,depth:0,pv:null};worker.postMessage('position fen '+fen);worker.postMessage('go movetime 3500');draw()}
async function init(){
 if(worker||loading)return;
 loading=true;error='Motor dosyası indiriliyor…';draw();
 try{
  const address=new URL(sources[0],location.href);
  const response=await fetch(address,{cache:'no-cache',method:'HEAD'});
  if(!response.ok)throw Error('Yerel Stockfish WASM dosyası bulunamadı (HTTP '+response.status+')');
  worker=new Worker(address.href);
  worker.onerror=e=>{const reason=e.message||'Web Worker başlatılamadı';worker?.terminate();worker=null;ready=false;busy=false;current=null;loading=false;analysisEpoch++;if(attempt+1<sources.length){attempt++;error='Yedek motor deneniyor…';init()}else{error='Stockfish başlatılamadı: '+reason+' (tarayıcı güvenlik kısıtlaması olabilir)';draw()}};
  worker.onmessage=e=>{
   const line=String(e.data||'');
   if(line.includes('uciok'))worker.postMessage('isready');
   if(line.includes('readyok')){ready=true;loading=false;error='';worker.postMessage('setoption name Hash value 32');next()}
   if(!current)return;
   const pv=line.match(/\\bpv ([a-h][1-8][a-h][1-8][qrbn]?)/),depth=line.match(/\\bdepth (\\d+)/);if(pv&&depth&&Number(depth[1])>=10&&current.epoch===analysisEpoch&&current.fen===getGame()?.fen()){bestMove=pv[1];paintBestMove()}
   const cp=line.match(/\bscore cp (-?\d+)/),mate=line.match(/\bscore mate (-?\d+)/);
   if(cp)current.score=Number(cp[1])*(current.turn==='w'?1:-1);
   if(mate)current.score='M'+(Number(mate[1])*(current.turn==='w'?1:-1));
   if(line.startsWith('bestmove ')){const best=line.match(/^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);if(best&&liveEnabled&&current.epoch===analysisEpoch&&current.fen===getGame()?.fen()){bestMove=best[1];paintBestMove()}
    if(current.score!==undefined&&current.epoch===analysisEpoch)scores.set(current.fen,current.score);
    current=null;busy=false;draw();next();
   }
  };
  worker.postMessage('uci');
  setTimeout(()=>{if(worker&&!ready&&loading){worker.terminate();worker=null;loading=false;if(attempt+1<sources.length){attempt++;init()}else{error='Stockfish yanıt vermedi. Tarayıcı motoru engelliyor olabilir.';draw()}}},18000);
 }catch(e){loading=false;if(attempt+1<sources.length){attempt++;error='Alternatif motor indiriliyor…';init()}else{error='Motor dosyası alınamadı: '+e.message;draw()}}
}

function schedule(full=false){if(!liveEnabled)return;
 const pos=positions();if(!pos.length)return;
 if(full)requested=true;
 const fen=pos[pos.length-1];if(fen!==current?.fen&&!queue.includes(fen))queue=[fen];
 draw();init();next();
}
function paintBestMove(){document.querySelectorAll('.ca-best-move-arrow').forEach(x=>x.remove());if(!liveEnabled||!bestMove)return;const board=$('board');if(!board)return;const from=board.querySelector('[data-square="'+bestMove.slice(0,2)+'"]'),to=board.querySelector('[data-square="'+bestMove.slice(2,4)+'"]');if(!from||!to)return;const b=board.getBoundingClientRect(),a=from.getBoundingClientRect(),z=to.getBoundingClientRect(),x1=a.left+a.width/2-b.left,y1=a.top+a.height/2-b.top,x2=z.left+z.width/2-b.left,y2=z.top+z.height/2-b.top,dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,ex=x2-ux*22,ey=y2-uy*22;const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('ca-best-move-arrow');svg.setAttribute('viewBox','0 0 '+b.width+' '+b.height);svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:12;filter:none';svg.innerHTML='<line x1="'+x1+'" y1="'+y1+'" x2="'+ex+'" y2="'+ey+'" stroke="#38c77d" stroke-width="7" stroke-linecap="round"/><polygon points="'+x2+','+y2+' '+(ex-ux*15-uy*12)+','+(ey-uy*15+ux*12)+' '+(ex-ux*15+uy*12)+','+(ey-uy*15-ux*12)+'" fill="#38c77d"/>';board.append(svg)}
function boot(){
 if(!getGame()||!$('caLiveEval')){setTimeout(boot,250);return}
 const style=document.createElement('style');style.textContent='.ca-review-tools{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:14px 0}.ca-review-tools button{padding:10px;border:1px solid #d4aa70;border-radius:8px;background:#5b482e;color:white;cursor:pointer}.ca-eval-summary{margin:12px 0;font-weight:700}#caLiveEval{font-size:23px;color:#e9c27e}#caEvalGraph{display:block;width:100%;height:auto;background:#101d27;border-radius:9px}#caReviewStats{font-size:13px;line-height:1.6} .ca-piece-palette:not([hidden]){display:flex!important;align-items:center;gap:10px;flex-wrap:nowrap;overflow-x:auto;max-width:100%;box-sizing:border-box;scrollbar-width:thin}.ca-piece-palette>strong{white-space:nowrap;flex:0 0 auto}.ca-piece-palette .ca-piece-grid{display:flex!important;flex-wrap:nowrap!important;grid-template-columns:none!important;gap:5px;min-width:max-content}.ca-piece-palette .ca-piece-grid button{flex:0 0 auto;min-width:36px}#board{position:relative}#caReviewOverlay:not([hidden]){position:absolute;inset:0;z-index:20;display:grid;grid-template-columns:repeat(8,minmax(0,1fr));grid-template-rows:repeat(8,minmax(0,1fr));pointer-events:auto}#caReviewOverlay .ca-review-square{display:flex;align-items:center;justify-content:center;font-size:clamp(24px,4.4vw,58px);font-family:serif;line-height:1}#caReviewOverlay .ca-review-white{color:#fff5db;text-shadow:0 2px 3px #111,1px 0 2px #111}#caReviewOverlay .ca-review-black{color:#141c25;text-shadow:0 1px 2px #fff9}#caReviewNav:not([hidden]){display:flex;gap:9px;align-items:center;justify-content:center;flex-wrap:wrap;padding:12px;background:#182a35;border:1px solid #ae8e61;border-radius:10px;margin:12px auto}#caReviewNav button,.ca-review-mistakes{cursor:pointer;background:#4b3828;color:#ffe1a3;border:1px solid #ad8d60;border-radius:7px;padding:6px 10px}#caReviewNav button:disabled,.ca-review-mistakes:disabled{opacity:.5;cursor:default}.ca-mistake-numbers{display:flex;gap:7px;flex-wrap:wrap;margin:7px 0 14px}.ca-mistake-numbers button{background:#5c422e;color:#ffdf9c;border:1px solid #c49d65;border-radius:8px;min-width:35px;padding:7px;cursor:pointer}.ca-error-circle{position:absolute;z-index:19;pointer-events:none;border:5px solid #ff7d4d;border-radius:50%;box-sizing:border-box;box-shadow:0 0 14px #ff7d4d99}.ca-error-arrow{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:18}.ca-mistake-notice{padding:10px;background:#35291d;color:#ffdcab;border-radius:8px}.ca-graph-live{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:14px 0 8px;flex-wrap:wrap}.ca-graph-player{display:flex;align-items:center;gap:9px;border:1px solid #a48a66;border-radius:9px;padding:8px 12px;background:#172630;color:#f8e7cb;font:600 13px system-ui}.ca-graph-player strong{font-size:20px}.ca-graph-white strong{color:#e9c27e}.ca-graph-black strong{color:#a9c8e9}.ca-side-eval{position:absolute;left:-74px;top:12%;bottom:12%;width:65px;display:flex;flex-direction:column;justify-content:space-between;z-index:8;pointer-events:none}.ca-side-eval .ca-black-score{order:0}.ca-side-eval .ca-white-score{order:1}.ca-side-eval.flipped .ca-white-score{order:0}.ca-side-eval.flipped .ca-black-score{order:1}.ca-side-score{border:1px solid #b99862;border-radius:10px;background:#172631;color:#fff2d8;padding:8px 3px;text-align:center;box-shadow:0 5px 15px #0007;font:600 11px system-ui}.ca-side-score strong{display:block;font:700 18px system-ui;margin-top:4px}.ca-white-score strong{color:#f3db9f}.ca-black-score strong{color:#f4b9b9}body.embedded-studio .chess-board-frame{margin-left:74px!important;margin-right:0!important;width:calc(100% - 180px)!important}#caReviewStats>div{display:block;margin:5px 0}#caReviewStats small{display:block;margin-top:9px;opacity:.8}#caReviewStatus:empty{display:none}@media(max-width:550px){.ca-side-eval{left:-54px;width:48px}.ca-side-score{font-size:9px;padding:6px 1px}.ca-side-score strong{font-size:13px}body.embedded-studio .chess-board-frame{margin-left:54px!important;width:calc(100% - 155px)!important}}';document.head.append(style);

 const panel=$('caMovePanel'),controls=document.querySelector('.boardcontrols');if(panel&&controls){panel.before(controls);const palette=$('caPiecePalette');if(palette)controls.before(palette)}const graph=$('caEvalGraph');if(graph&&!$('caGraphWhite')){const legend=document.createElement('div');legend.className='ca-graph-live';legend.innerHTML='<div class="ca-graph-player ca-graph-white">♔ Beyaz <strong id="caGraphWhite">…</strong></div><div class="ca-graph-player ca-graph-black">♚ Siyah <strong id="caGraphBlack">…</strong></div>';graph.before(legend)} setupReview();const board=$('board');const toggle=document.createElement('button');toggle.type='button';toggle.id='caLiveEngineToggle';toggle.textContent='⚪ Canlı analiz: Kapalı';toggle.setAttribute('aria-pressed','false');toggle.style.cssText='display:block;margin:10px 0;padding:10px 14px;background:#263d4a;color:#fff;border:1px solid #c2a06b;border-radius:10px;cursor:pointer;font-weight:700';toggle.onclick=()=>{liveEnabled=!liveEnabled;toggle.textContent=liveEnabled?'🟢 Canlı analiz: Açık':'⚪ Canlı analiz: Kapalı';toggle.setAttribute('aria-pressed',String(liveEnabled));if(liveEnabled){analysisEpoch++;bestMove=null;scores.clear();queue=[];schedule(true)}else{bestMove=null;queue=[];worker?.terminate();worker=null;ready=false;busy=false;current=null;loading=false;document.querySelectorAll('.ca-best-move-arrow').forEach(x=>x.remove());$('caReviewStatus').textContent='Canlı analiz kapalı'}};const side=document.getElementById('caSideEval');(side||board.closest('.chess-board-frame')||board.parentElement).before(toggle);const frame=board.closest('.chess-board-frame');if(frame&&!$('caSideEval')){const rail=document.createElement('aside');rail.id='caSideEval';rail.className='ca-side-eval';rail.setAttribute('aria-label','Canlı beyaz ve siyah konum değerlendirmesi');rail.innerHTML='<div class="ca-side-score ca-white-score"><span>♔ Beyaz</span><strong id="caWhiteEval">…</strong></div><div class="ca-side-score ca-black-score"><span>♚ Siyah</span><strong id="caBlackEval">…</strong></div>';frame.append(rail)}const scoreRail=$('caSideEval'),capturedRail=document.querySelector('.ca-captured-rails');if(scoreRail&&capturedRail){const sync=()=>scoreRail.classList.toggle('flipped',capturedRail.classList.contains('flipped'));sync();new MutationObserver(sync).observe(capturedRail,{attributes:true,attributeFilter:['class']})}new MutationObserver(()=>{const g=getGame();if(!g)return;const key=g.fen()+'|'+g.history.length;if(key!==lastKey){lastKey=key;analysisEpoch++;bestMove=null;document.querySelectorAll('.ca-best-move-arrow').forEach(x=>x.remove());if(liveEnabled){if(busy&&worker){worker.postMessage('stop')}queue=[];schedule(true)}}}).observe(board,{childList:true});
 // Motor ilk açılışta kapalıdır; kullanıcı etkinleştirince indirilir.
}
boot();
})();