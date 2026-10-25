(()=>{
'use strict';
const getGame=()=>window.ChessAcademyDemo?.game;
const $=id=>document.getElementById(id);
const sources=['engines/stockfish19/stockfish-19-lite-single.js','https://cdn.jsdelivr.net/npm/stockfish@19.0.1/bin/stockfish-19-asm.js'];
let worker=null,ready=false,busy=false,current=null,queue=[],scores=new Map(),depths=new Map(),requested=false,lastKey='',error='',loading=false,attempt=0,liveEnabled=false,bestMove=null,analysisEpoch=0;
const fmt=v=>v===undefined?'…':v==='M0'?'Mat':typeof v==='string'?v:(v>=0?'+':'')+(v/100).toFixed(2);
let cachedPositionsKey='',cachedPositions=[];
function positions(){
 const g=getGame();if(!g)return [];
 const key=g.fen()+'|'+g.history.length+'|'+(g.history.length?JSON.stringify(g.history[g.history.length-1].move):'');
 if(key===cachedPositionsKey)return cachedPositions;
 const E=window.ChessAcademyEngine.ChessEngine;
 const replay=new E();if(g.history.length)replay.restore({...g.history[0].snapshot,board:g.history[0].snapshot.board.slice()});else replay.load(g.fen());const out=[replay.fen()];
 for(const h of g.history){const m=h.move;if(!replay.move(m.from,m.to,m.promotion||'q'))break;out.push(replay.fen())}
 if(out[out.length-1]!==g.fen())out.push(g.fen());
 cachedPositionsKey=key;cachedPositions=out;
 return out;
}
function chance(cp){return 1/(1+Math.exp(-Math.max(-1000,Math.min(1000,cp))/170))}
function ensureEvalBar(){
 const frame=document.querySelector('.chess-board-frame');if(!frame)return;
 if($('caEngineEvalBar'))return;
 const container=document.createElement('div');container.id='caEngineEvalBar';container.hidden=!liveEnabled;container.setAttribute('role','meter');container.setAttribute('aria-label','Stockfish konum değerlendirmesi');container.setAttribute('aria-valuemin','0');container.setAttribute('aria-valuemax','100');container.setAttribute('aria-valuenow','50');
 container.innerHTML='<div class="ca-engine-numbers"><strong id="caEngineBlackPercent">50%</strong><span class="ca-engine-depth" id="caEngineDepth">D: …</span><span class="ca-engine-score" id="caEngineScore">…</span><strong id="caEngineWhitePercent">50%</strong></div><div class="ca-engine-meter"><div class="ca-engine-white-fill" id="caEngineWhiteFill"></div><div class="ca-engine-equal"></div></div>';
 frame.append(container);
}
function updateEvalBar(score,depth){
 ensureEvalBar();const bar=$('caEngineEvalBar');if(!bar)return;
 const white=typeof score==='number'?Math.round(100*chance(score)):typeof score==='string'&&score.startsWith('M')?(Number(score.slice(1))===0?(getGame()?.turn==='b'?100:0):Number(score.slice(1))>0?100:0):50;
 $('caEngineWhiteFill').style.height=white+'%';
 $('caEngineWhitePercent').textContent=fmt(score);
 $('caEngineBlackPercent').textContent='';
 $('caEngineDepth').textContent='D: '+(depth||'…');
 $('caEngineScore').textContent=fmt(score);
 bar.setAttribute('aria-valuenow',String(white));
 bar.setAttribute('aria-valuetext','Beyaz açısından '+fmt(score)+', analiz derinliği '+(depth||'bilinmiyor'));
}
function draw(){
 renderSidePanel();
 const livePositions=positions(),pos=reviewSnapshot?.positions||livePositions,score=scores.get(livePositions[livePositions.length-1]);if(!$('caLiveEval'))return;updateEvalBar(score,depths.get(livePositions[livePositions.length-1]));
 $('caLiveEval').textContent=fmt(score);renderSidePanel();
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
function next(){if(!liveEnabled||!ready||busy||!queue.length)return;const fen=queue.pop();queue=[];busy=true;current={fen,score:undefined,turn:fen.split(' ')[1],epoch:analysisEpoch,depth:0,pv:null};worker.postMessage('position fen '+fen);worker.postMessage('go depth 24 movetime 10000');draw()}
async function init(){
 if(worker||loading)return;
 loading=true;error='Motor dosyası indiriliyor…';draw();
 try{
  const address=new URL(sources[Math.min(attempt,sources.length-1)],location.href);
  if(attempt===0){const response=await fetch(address,{cache:'no-cache',method:'HEAD'});if(!response.ok)throw Error('Yerel WASM henüz yayınlanmadı')} 
  if(attempt===0)worker=new Worker(address.href);
  else {const response=await fetch(address,{mode:'cors',cache:'force-cache'});if(!response.ok)throw Error('Yedek motor indirilemedi');const script=await response.text();const blob=URL.createObjectURL(new Blob([script],{type:'text/javascript'}));worker=new Worker(blob);setTimeout(()=>URL.revokeObjectURL(blob),5000)}
  worker.onerror=e=>{const reason=e.message||'Web Worker başlatılamadı';worker?.terminate();worker=null;ready=false;busy=false;current=null;loading=false;analysisEpoch++;if(attempt+1<sources.length){attempt++;error='Yedek motor deneniyor…';init()}else{error='Stockfish başlatılamadı: '+reason+' (tarayıcı güvenlik kısıtlaması olabilir)';draw()}};
  worker.onmessage=e=>{
   for(const line of String(e.data||'').split('\n'))handleLine(line);
  };
  function handleLine(line){
   if(line.includes('uciok'))worker.postMessage('isready');
   if(line.includes('readyok')){ready=true;loading=false;error='';worker.postMessage('setoption name Hash value 32');next()}
   if(!current)return;
   const pv=line.match(/\bpv ([a-h][1-8][a-h][1-8][qrbn]?)/),depth=line.match(/\bdepth (\d+)/);if(depth&&/\bscore (?:cp|mate) /.test(line)&&current.epoch===analysisEpoch){current.depth=Math.max(current.depth,Number(depth[1]));}if(pv&&depth&&Number(depth[1])>=10&&current.epoch===analysisEpoch&&current.fen===getGame()?.fen()&&!(evaluationMeta.get(current.fen)?.depth>current.depth)){bestMove=pv[1];paintBestMove()}
   const variation=line.match(/\bpv (.+)$/);if(variation)current.pv=variation[1];
   const cp=line.match(/\bscore cp (-?\d+)/),mate=line.match(/\bscore mate (-?\d+)/);
   if(cp)current.score=Number(cp[1])*(current.turn==='w'?1:-1);
   if(mate)current.score='M'+(Number(mate[1])*(current.turn==='w'?1:-1));
   if((cp||mate)&&current.epoch===analysisEpoch){if(current.score!==undefined){storeEvaluation(current.fen,current.score,current.depth,'Stockfish 19',current.pv)}if(current.fen===getGame()?.fen())draw()}
   if(line.startsWith('bestmove ')){const best=line.match(/^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);if(best&&liveEnabled&&current.epoch===analysisEpoch&&current.fen===getGame()?.fen()&&!(evaluationMeta.get(current.fen)?.depth>current.depth)){bestMove=best[1];paintBestMove()}
    if(current.score!==undefined&&current.epoch===analysisEpoch)storeEvaluation(current.fen,current.score,current.depth,'Stockfish 19',current.pv);
    current=null;busy=false;draw();next();
   }
  }
  worker.postMessage('uci');
  setTimeout(()=>{if(worker&&!ready&&loading){worker.terminate();worker=null;loading=false;if(attempt+1<sources.length){attempt++;init()}else{error='Stockfish yanıt vermedi. Tarayıcı motoru engelliyor olabilir.';draw()}}},18000);
 }catch(e){loading=false;if(attempt+1<sources.length){attempt++;error='Alternatif motor indiriliyor…';init()}else{error='Motor dosyası alınamadı: '+e.message;draw()}}
}

function schedule(full=false){if(!liveEnabled)return;
 const pos=positions();if(!pos.length)return;
 if(full)requested=true;
 const fen=pos[pos.length-1];if(fen!==current?.fen&&!queue.includes(fen))queue=[fen];
 draw();requestCloud(fen);init();next();
}
let paintedBestMove='',paintedBestBoard=null;
function paintBestMove(){if(!liveEnabled||!bestMove){document.querySelectorAll('.ca-best-move-arrow').forEach(x=>x.remove());paintedBestMove='';paintedBestBoard=null;return}const board=$('board');if(!board)return;if(paintedBestMove===bestMove&&paintedBestBoard===board&&board.querySelector('.ca-best-move-arrow'))return;document.querySelectorAll('.ca-best-move-arrow').forEach(x=>x.remove());paintedBestMove=bestMove;paintedBestBoard=board;const from=board.querySelector('[data-square="'+bestMove.slice(0,2)+'"]'),to=board.querySelector('[data-square="'+bestMove.slice(2,4)+'"]');if(!from||!to)return;const b=board.getBoundingClientRect(),a=from.getBoundingClientRect(),z=to.getBoundingClientRect(),x1=a.left+a.width/2-b.left,y1=a.top+a.height/2-b.top,x2=z.left+z.width/2-b.left,y2=z.top+z.height/2-b.top,dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,ex=x2-ux*22,ey=y2-uy*22;const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('ca-best-move-arrow');svg.setAttribute('viewBox','0 0 '+b.width+' '+b.height);svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:12;filter:none';svg.innerHTML='<line x1="'+x1+'" y1="'+y1+'" x2="'+ex+'" y2="'+ey+'" stroke="#38c77d" stroke-width="7" stroke-linecap="round"/><polygon points="'+x2+','+y2+' '+(ex-ux*15-uy*12)+','+(ey-uy*15+ux*12)+' '+(ex-ux*15+uy*12)+','+(ey-uy*15-ux*12)+'" fill="#38c77d"/>';board.append(svg)}
// Evaluations are always stored from White's perspective. Cloud depths are
// never relabelled as local depths, and a shallow search cannot replace them.
const evaluationMeta=new Map(),cloudCache=new Map();
let cloudTimer=null,cloudAbort=null,cloudBusy=false,cloudPending=null,cloudCooldown=0,lastCloudAt=0;
function storeEvaluation(fen,score,depth,source,pv){
 const old=evaluationMeta.get(fen);if(old&&old.depth>depth)return;
 scores.set(fen,score);depths.set(fen,depth);evaluationMeta.set(fen,{depth,source,pv:pv||''});
 if(fen===getGame()?.fen()&&liveEnabled){bestMove=(pv||'').split(' ')[0]||null;if(bestMove){const g=getGame(),from=bestMove.slice(0,2),to=bestMove.slice(2,4);if(g.at(from)?.toLowerCase()==='k'&&g.at(to)===(g.turn==='w'?'R':'r'))bestMove=from+(to[0]==='h'?'g':'c')+from[1]}paintBestMove()}
}
function requestCloud(fen){
 cloudPending=fen;clearTimeout(cloudTimer);
 if(cloudCache.has(fen)){const v=cloudCache.get(fen);if(v)storeEvaluation(fen,v.score,v.depth,'Lichess Cloud',v.pv);draw();return}
 cloudTimer=setTimeout(fetchCloud,Math.max(900,5000-(Date.now()-lastCloudAt),cloudCooldown-Date.now()));
}
async function fetchCloud(){
 if(cloudBusy||!liveEnabled||!cloudPending)return;
 const fen=cloudPending;cloudPending=null;if(fen!==getGame()?.fen())return;
 cloudBusy=true;lastCloudAt=Date.now();const controller=new AbortController();cloudAbort=controller;
 const timeout=setTimeout(()=>controller.abort(),6000);
 try{
  const response=await fetch('https://lichess.org/api/cloud-eval?fen='+encodeURIComponent(fen)+'&multiPv=1',{signal:controller.signal,credentials:'omit'});
  if(response.status===429){cloudCooldown=Date.now()+60000;return}
  if(response.status===404){cloudCache.set(fen,null);return}
  if(!response.ok)return;const data=await response.json(),pv=data.pvs?.[0];
  if(!pv||!Number.isFinite(data.depth)||data.fen?.split(' ').slice(0,4).join(' ')!==fen.split(' ').slice(0,4).join(' '))return;
  const score=Number.isFinite(pv.cp)?pv.cp:Number.isFinite(pv.mate)?'M'+pv.mate:undefined;if(score===undefined)return;
  const value={score,depth:data.depth,pv:pv.moves};cloudCache.set(fen,value);
  if(cloudCache.size>150)cloudCache.delete(cloudCache.keys().next().value);
  if(liveEnabled&&fen===getGame()?.fen()){storeEvaluation(fen,score,data.depth,'Lichess Cloud',pv.moves);draw()}
 }catch(e){/* Local Stockfish continues when offline, uncached or unavailable. */}
 finally{clearTimeout(timeout);cloudBusy=false;if(cloudAbort===controller)cloudAbort=null;if(cloudPending&&liveEnabled)requestCloud(cloudPending)}
}
function sanMove(g,move){
 let from=move.slice(0,2),to=move.slice(2,4),promotion=move[4]||'q';const p=g.at(from);if(!p)return null;
 // Lichess cloud uses king-to-rook notation for castling.
 if(p.toLowerCase()==='k'&&g.at(to)===(g.turn==='w'?'R':'r'))to=(to[0]==='h'?'g':'c')+from[1];
 const legal=g.moves({square:from}).find(m=>m.to===to&&(!m.promotion||m.promotion===promotion));if(!legal)return null;
 const capture=!!g.at(to)||legal.enPassant,kind=p.toUpperCase();let san='';
 if(legal.castle)san=legal.castle==='k'?'O-O':'O-O-O';else{
  const rivals=kind==='P'?[]:g.moves().filter(m=>m.to===to&&m.from!==from&&g.at(m.from)?.toUpperCase()===kind);
  let dis='';if(rivals.length)dis=!rivals.some(m=>m.from[0]===from[0])?from[0]:!rivals.some(m=>m.from[1]===from[1])?from[1]:from;
  san=(kind==='P'?(capture?from[0]:''):kind+dis)+(capture?'x':'')+to+(legal.promotion?'='+promotion.toUpperCase():'');
 }
 if(!g.move(from,to,promotion))return null;return san+(g.isCheckmate()?'#':g.isCheck()?'+':'');
}
function variationText(fen,pv){
 const g=new window.ChessAcademyEngine.ChessEngine(fen),out=[];
 for(const uci of (pv||'').trim().split(/\s+/).slice(0,14)){const turn=g.turn,n=g.fullmove,label=sanMove(g,uci);if(!label)break;out.push((turn==='w'?n+'. ':out.length===0?n+'… ':'')+label)}return out.join(' ');
}
function setupSidePanel(){
 const board=$('board'),frame=board.closest('.chess-board-frame');if(!frame)return;
 const layout=document.createElement('div');layout.className='ca-analysis-layout';frame.before(layout);layout.append(frame);
 const panel=document.createElement('aside');panel.id='caAnalysisSide';panel.setAttribute('aria-label','Canlı analiz ve hamleler');
 panel.innerHTML='<div class="ca-analysis-top"><strong id="caAnalysisScore" aria-live="polite">…</strong><div><b id="caAnalysisSource">Stockfish 19</b><span id="caAnalysisDepth">Derinlik —</span></div></div><p class="ca-analysis-caption">Değerlendirme beyaz açısından · + beyaz, − siyah avantajı</p><div id="caAnalysisPV" aria-label="Motorun önerdiği devam yolu">Analizi açarak önerilen hamleleri görebilirsiniz.</div><div class="ca-notation-heading"><span>Hamle</span><span>Beyaz</span><span>Siyah</span></div><div id="caNotationRows"></div><div class="ca-analysis-nav"><button type="button" data-jump="first" aria-label="İlk konum">⏮</button><button type="button" data-jump="back" aria-label="Önceki hamle">◀</button><span id="caAnalysisPly">0 / 0</span><button type="button" data-jump="next" aria-label="Sonraki hamle">▶</button><button type="button" data-jump="last" aria-label="Son konum">⏭</button></div>';
 layout.append(panel);panel.prepend($('caLiveEngineToggle'));const status=$('caReviewStatus');if(status){status.textContent='';panel.append(status)}
 panel.addEventListener('click',e=>{const b=e.target.closest('button[data-ply],button[data-jump]');if(!b)return;const h=window.ChessAcademyDemo.analysisHistory(),target=b.dataset.ply!==undefined?Number(b.dataset.ply):b.dataset.jump==='first'?0:b.dataset.jump==='last'?h.moves.length:h.ply+(b.dataset.jump==='back'?-1:1);window.ChessAcademyDemo.navigateHistory(target-h.ply);renderSidePanel()});
 const style=document.createElement('style');style.textContent=`
 body .wrap{max-width:1200px!important}#home .hero>div:last-child{max-width:none!important}
 .ca-analysis-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(285px,1fr);gap:22px;align-items:start;width:100%;margin:14px 0}
 body.embedded-studio .ca-analysis-layout .chess-board-frame,.ca-analysis-layout .chess-board-frame{width:calc(100% - 34px)!important;max-width:660px!important;margin:0 0 0 34px!important;min-width:0}
 body.embedded-studio #caEngineEvalBar,#caEngineEvalBar{left:-25px!important;width:18px!important}.ca-engine-numbers{display:none!important}body.embedded-studio #caEngineEvalBar .ca-engine-numbers{display:none!important}.ca-engine-numbers{font-size:10px!important}.ca-engine-depth{display:none!important}
 #caAnalysisSide{background:#122a2c!important;border:1px solid #395d50;border-radius:14px;overflow:hidden;min-width:0;color:#ecf6ef;box-shadow:0 10px 25px #0003}
 #caAnalysisSide #caLiveEngineToggle{display:block!important;width:100%;margin:0!important;border:0!important;border-radius:0!important;border-bottom:1px solid #375348!important;background:#1b3b30!important;text-align:left}
 .ca-analysis-top{display:flex;align-items:center;gap:15px;padding:16px}.ca-analysis-top>strong{font:700 29px system-ui;color:#b9f6c9}.ca-analysis-top div{display:grid;gap:4px}.ca-analysis-top b{font-size:12px;color:#b7ccbe}.ca-analysis-top span{font-size:12px;color:#b5c7bd}
 #caAnalysisSide #caReviewStatus{padding:0 14px 10px;font-size:12px;color:#ddc693}#caAnalysisSide #caReviewStatus:empty{display:none}.ca-analysis-caption{font-size:11px;line-height:1.5;margin:0;padding:0 16px 12px;color:#b3c8bb}
 #caAnalysisPV{padding:12px 16px;background:#0b211e;border-block:1px solid #325044;font-size:13px;line-height:1.8;min-height:68px;overflow-wrap:anywhere}
 .ca-notation-heading,.ca-notation-row{display:grid;grid-template-columns:38px minmax(0,1fr) minmax(0,1fr);align-items:stretch}.ca-notation-heading{font-size:11px;color:#a9c4b4;background:#1c352e;padding:8px 6px;text-align:center}
 #caNotationRows{min-height:220px;max-height:360px;overflow:auto;scrollbar-width:thin}.ca-notation-row:nth-child(even){background:#ffffff05}.ca-notation-row>span{padding:11px 5px;text-align:center;color:#92ad9e;font-size:12px}.ca-notation-row button{border:0;border-radius:0;padding:10px 8px;background:transparent;color:#f1f7f2;text-align:left;display:flex;justify-content:space-between;gap:6px;min-width:0;font:600 14px system-ui}.ca-notation-row button small{color:#a9c5b2;font:11px system-ui;letter-spacing:0;align-self:center}.ca-notation-row button[aria-current="step"]{background:#26734a;color:white}.ca-notation-row button:hover{background:#315440}.ca-analysis-nav{display:flex;align-items:center;justify-content:space-around;padding:10px;border-top:1px solid #375348;gap:4px}.ca-analysis-nav button{background:#1d3c30;border:1px solid #41614f;border-radius:7px;color:#ddf1e3;min-width:37px;min-height:38px}.ca-analysis-nav button:disabled{opacity:.35;cursor:default}#caAnalysisPly{font-size:12px;color:#abc4b4}
 #moveHistoryText,.ca-move-hint,#caReviewStats,.ca-graph-live,#caEvalGraph,.ca-move-heading{display:none!important}body.embedded-studio #caMovePanel{margin:0!important;padding:0!important;min-height:0!important;border:0!important;background:transparent!important}.ca-review-tools{margin:0!important}.ca-eval-summary{display:none!important}
 @media(max-width:760px){.ca-analysis-layout{grid-template-columns:minmax(0,1fr);gap:16px}#caNotationRows{min-height:100px;max-height:240px}.ca-analysis-layout .chess-board-frame{justify-self:center}#caAnalysisSide{width:100%}.wrap{padding:12px!important}}
 `;document.head.append(style);
}

// One responsive row: captures and evaluation on the left, board, analysis.
function syncAnalysisLayout(){
 const layout=document.querySelector('.ca-analysis-layout'),frame=document.querySelector('.ca-analysis-layout .chess-board-frame');if(!layout||!frame)return;
 layout.style.setProperty('--ca-board-height',Math.round(frame.getBoundingClientRect().height)+'px');
}
const layoutStyle=document.createElement('style');layoutStyle.textContent=`
body.embedded-studio #caEngineEvalBar[hidden],#caEngineEvalBar[hidden]{display:none!important}
.ca-analysis-layout{grid-template-columns:minmax(0,1.6fr) minmax(230px,1fr);gap:18px;align-items:start;container-type:inline-size}
body.embedded-studio .ca-analysis-layout .chess-board-frame,.ca-analysis-layout .chess-board-frame{width:calc(100% - 90px)!important;margin:0 0 0 90px!important;max-width:none!important}
body.embedded-studio .ca-analysis-layout .ca-captured-rails,.ca-analysis-layout .ca-captured-rails{position:absolute!important;left:-88px!important;right:auto!important;top:0!important;bottom:0!important;width:54px!important;pointer-events:none!important}
body.embedded-studio .ca-analysis-layout .ca-captured-rail,.ca-analysis-layout .ca-captured-rail{left:0!important;right:auto!important;width:54px!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-auto-rows:27px!important;height:40%!important;max-height:40%!important;gap:2px!important;overflow:auto!important;scrollbar-width:none;align-content:start!important}
body.embedded-studio .ca-analysis-layout .ca-captured-rail .ca-captured-piece,.ca-analysis-layout .ca-captured-rail .ca-captured-piece{width:25px!important;height:25px!important;min-width:0!important;min-height:0!important;overflow:hidden!important}
.ca-analysis-layout #caAnalysisSide{height:var(--ca-board-height,500px);min-height:0;display:flex;flex-direction:column;overflow:hidden}
#caAnalysisSide #caLiveEngineToggle,.ca-analysis-top,.ca-analysis-caption,#caAnalysisPV,.ca-notation-heading,.ca-analysis-nav,#caReviewStatus{flex-shrink:0}
#caAnalysisSide #caNotationRows{flex:1 1 0;min-height:0;max-height:none;overflow-y:auto;overscroll-behavior:contain}
#caAnalysisSide #caAnalysisPV{max-height:76px;min-height:46px;overflow:auto;padding:8px 12px}
#caAnalysisSide .ca-analysis-top{padding:10px 12px}#caAnalysisSide .ca-analysis-caption{padding:0 12px 8px;font-size:10px}#caAnalysisSide .ca-analysis-nav{padding:7px}
@media(max-width:639px){.ca-analysis-layout{grid-template-columns:minmax(0,1fr);gap:14px}.ca-analysis-layout #caAnalysisSide{height:clamp(320px,var(--ca-board-height,420px),520px);width:100%}}
@media(min-width:640px) and (max-width:760px){.ca-analysis-layout{grid-template-columns:minmax(0,1.6fr) minmax(230px,1fr);gap:12px}}
`;
function observeAnalysisLayout(){document.head.append(layoutStyle);const frame=document.querySelector('.ca-analysis-layout .chess-board-frame');if(frame){new ResizeObserver(syncAnalysisLayout).observe(frame);syncAnalysisLayout()}}

let lastRowsKey='';
function renderSidePanel(){
 if(!$('caAnalysisSide'))return;if($('caEngineEvalBar'))$('caEngineEvalBar').hidden=!liveEnabled;const g=getGame(),fen=g.fen(),meta=evaluationMeta.get(fen),score=scores.get(fen);
 $('caAnalysisScore').textContent=liveEnabled?fmt(score):'—';$('caAnalysisDepth').textContent='Derinlik '+(liveEnabled&&meta?meta.depth:'—');$('caAnalysisSource').textContent=liveEnabled?(meta?.source||'Stockfish 19 · hesaplanıyor'):'Analiz kapalı';
 $('caAnalysisPV').textContent=liveEnabled?(meta?.pv?variationText(fen,meta.pv):'Konum hesaplanıyor…'):'Analizi açarak önerilen hamleleri görebilirsiniz.';
 const h=window.ChessAcademyDemo.analysisHistory(),key=h.start+'|'+h.moves.map(m=>m.from+m.to+(m.promotion||'')).join(',')+'|'+h.ply+'|'+Array.from(scores.entries()).map(([f,s])=>f+':'+s).join(';');
 $('caAnalysisPly').textContent=h.ply+' / '+h.moves.length;
 document.querySelectorAll('[data-jump]').forEach(b=>b.disabled=(['first','back'].includes(b.dataset.jump)?h.ply===0:h.ply===h.moves.length));
 if(key===lastRowsKey)return;lastRowsKey=key;const rows=$('caNotationRows');rows.replaceChildren();const replay=new window.ChessAcademyEngine.ChessEngine(h.start);let row=null;
 h.moves.forEach((m,i)=>{const turn=replay.turn,n=replay.fullmove,san=sanMove(replay,m.from+m.to+(m.promotion||''));if(!san)return;
 if(!row||turn==='w'){row=document.createElement('div');row.className='ca-notation-row';const label=document.createElement('span');label.textContent=n;row.append(label);if(turn==='b')row.append(document.createElement('span'));rows.append(row)}
 const b=document.createElement('button');b.type='button';b.dataset.ply=i+1;b.setAttribute('aria-current',h.ply===i+1?'step':'false');const label=document.createElement('span');label.textContent=san;b.append(label);const value=document.createElement('small');value.textContent=scores.has(replay.fen())?fmt(scores.get(replay.fen())):'';b.append(value);row.append(b);
 });
 if(!h.moves.length){const p=document.createElement('p');p.className='ca-analysis-caption';p.textContent='Hamleleriniz burada sıralanacak.';rows.append(p)}
}

function boot(){
 if(!getGame()||!$('caLiveEval')){setTimeout(boot,250);return}
 const style=document.createElement('style');style.textContent='.ca-review-tools{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:14px 0}.ca-review-tools button{padding:10px;border:1px solid #d4aa70;border-radius:8px;background:#5b482e;color:white;cursor:pointer}.ca-eval-summary{margin:12px 0;font-weight:700}#caLiveEval{font-size:23px;color:#e9c27e}#caEvalGraph{display:block;width:100%;height:auto;background:#101d27;border-radius:9px}#caReviewStats{font-size:13px;line-height:1.6} .ca-piece-palette:not([hidden]){display:flex!important;align-items:center;gap:10px;flex-wrap:nowrap;overflow-x:auto;max-width:100%;box-sizing:border-box;scrollbar-width:thin}.ca-piece-palette>strong{white-space:nowrap;flex:0 0 auto}.ca-piece-palette .ca-piece-grid{display:flex!important;flex-wrap:nowrap!important;grid-template-columns:none!important;gap:5px;min-width:max-content}.ca-piece-palette .ca-piece-grid button{flex:0 0 auto;min-width:36px}#board{position:relative}#caReviewOverlay:not([hidden]){position:absolute;inset:0;z-index:20;display:grid;grid-template-columns:repeat(8,minmax(0,1fr));grid-template-rows:repeat(8,minmax(0,1fr));pointer-events:auto}#caReviewOverlay .ca-review-square{display:flex;align-items:center;justify-content:center;font-size:clamp(24px,4.4vw,58px);font-family:serif;line-height:1}#caReviewOverlay .ca-review-white{color:#fff5db;text-shadow:0 2px 3px #111,1px 0 2px #111}#caReviewOverlay .ca-review-black{color:#141c25;text-shadow:0 1px 2px #fff9}#caReviewNav:not([hidden]){display:flex;gap:9px;align-items:center;justify-content:center;flex-wrap:wrap;padding:12px;background:#182a35;border:1px solid #ae8e61;border-radius:10px;margin:12px auto}#caReviewNav button,.ca-review-mistakes{cursor:pointer;background:#4b3828;color:#ffe1a3;border:1px solid #ad8d60;border-radius:7px;padding:6px 10px}#caReviewNav button:disabled,.ca-review-mistakes:disabled{opacity:.5;cursor:default}.ca-mistake-numbers{display:flex;gap:7px;flex-wrap:wrap;margin:7px 0 14px}.ca-mistake-numbers button{background:#5c422e;color:#ffdf9c;border:1px solid #c49d65;border-radius:8px;min-width:35px;padding:7px;cursor:pointer}.ca-error-circle{position:absolute;z-index:19;pointer-events:none;border:5px solid #ff7d4d;border-radius:50%;box-sizing:border-box;box-shadow:0 0 14px #ff7d4d99}.ca-error-arrow{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:18}.ca-mistake-notice{padding:10px;background:#35291d;color:#ffdcab;border-radius:8px}.ca-graph-live{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:14px 0 8px;flex-wrap:wrap}.ca-graph-player{display:flex;align-items:center;gap:9px;border:1px solid #a48a66;border-radius:9px;padding:8px 12px;background:#172630;color:#f8e7cb;font:600 13px system-ui}.ca-graph-player strong{font-size:20px}.ca-graph-white strong{color:#e9c27e}.ca-graph-black strong{color:#a9c8e9}.ca-side-eval{position:absolute;left:-74px;top:12%;bottom:12%;width:65px;display:flex;flex-direction:column;justify-content:space-between;z-index:8;pointer-events:none}.ca-side-eval .ca-black-score{order:0}.ca-side-eval .ca-white-score{order:1}.ca-side-eval.flipped .ca-white-score{order:0}.ca-side-eval.flipped .ca-black-score{order:1}.ca-side-score{border:1px solid #b99862;border-radius:10px;background:#172631;color:#fff2d8;padding:8px 3px;text-align:center;box-shadow:0 5px 15px #0007;font:600 11px system-ui}.ca-side-score strong{display:block;font:700 18px system-ui;margin-top:4px}.ca-white-score strong{color:#f3db9f}.ca-black-score strong{color:#f4b9b9}body.embedded-studio .chess-board-frame{margin-left:74px!important;margin-right:0!important;width:calc(100% - 180px)!important}#caReviewStats>div{display:block;margin:5px 0}#caReviewStats small{display:block;margin-top:9px;opacity:.8}#caReviewStatus:empty{display:none}@media(max-width:550px){.ca-side-eval{left:-54px;width:48px}.ca-side-score{font-size:9px;padding:6px 1px}.ca-side-score strong{font-size:13px}body.embedded-studio .chess-board-frame{margin-left:54px!important;width:calc(100% - 155px)!important}}';document.head.append(style);

 const panel=$('caMovePanel'),controls=document.querySelector('.boardcontrols');if(panel&&controls){panel.before(controls);const palette=$('caPiecePalette');if(palette)controls.before(palette)}const graph=$('caEvalGraph');if(graph&&!$('caGraphWhite')){const legend=document.createElement('div');legend.className='ca-graph-live';legend.innerHTML='<div class="ca-graph-player ca-graph-white">♔ Beyaz <strong id="caGraphWhite">…</strong></div><div class="ca-graph-player ca-graph-black">♚ Siyah <strong id="caGraphBlack">…</strong></div>';graph.before(legend)} setupReview();const board=$('board');const toggle=document.createElement('button');toggle.type='button';toggle.id='caLiveEngineToggle';toggle.textContent='⚪ Canlı analiz: Kapalı';toggle.setAttribute('aria-pressed','false');toggle.style.cssText='display:block;margin:10px 0;padding:10px 14px;background:#263d4a;color:#fff;border:1px solid #c2a06b;border-radius:10px;cursor:pointer;font-weight:700';toggle.onclick=()=>{liveEnabled=!liveEnabled;toggle.textContent=liveEnabled?'🟢 Canlı analiz: Açık':'⚪ Canlı analiz: Kapalı';toggle.setAttribute('aria-pressed',String(liveEnabled));if(liveEnabled){analysisEpoch++;bestMove=null;queue=[];schedule(true)}else{bestMove=null;paintedBestMove='';paintedBestBoard=null;queue=[];worker?.terminate();worker=null;ready=false;busy=false;current=null;loading=false;document.querySelectorAll('.ca-best-move-arrow').forEach(x=>x.remove());$('caReviewStatus').textContent='Canlı analiz kapalı';cloudAbort?.abort();clearTimeout(cloudTimer);renderSidePanel()}};(board.closest('.chess-board-frame')||board.parentElement).before(toggle);const frame=board.closest('.chess-board-frame');frame?.querySelector('#caSideEval')?.remove();ensureEvalBar();new MutationObserver(()=>{const g=getGame();if(!g)return;const key=g.fen()+'|'+g.history.length;if(key!==lastKey){lastKey=key;analysisEpoch++;bestMove=null;paintedBestMove='';paintedBestBoard=null;document.querySelectorAll('.ca-best-move-arrow').forEach(x=>x.remove());renderSidePanel();if(liveEnabled){if(busy&&worker){worker.postMessage('stop')}queue=[];schedule(true)}}}).observe(board,{childList:true});
 setupSidePanel();observeAnalysisLayout();renderSidePanel();
 // Motor ilk açılışta kapalıdır; kullanıcı etkinleştirince indirilir.
}
boot();
})();

