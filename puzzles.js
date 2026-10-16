/* Chess Academy v0.22: Lichess CC0 puzzle player with bounded shard sampling and demo telemetry. */
(()=>{'use strict';
const {ChessEngine}=window.ChessAcademyEngine;
const $=id=>document.getElementById(id);
const T=(key,...args)=>window.ChessAcademyPuzzleI18n.t(key,...args);
const glyph={K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
const ADAPT_KEY='chess-academy-adaptive-v21';
const REVIEW_KEY='chess-academy-review-v23';
let review=Object.create(null),reviewMode=false;
try{
 const value=JSON.parse(localStorage.getItem(REVIEW_KEY)||'{}');
 if(value&&typeof value==='object'&&!Array.isArray(value))for(const [id,v] of Object.entries(value).slice(0,300)){
  if(/^[A-Za-z0-9]{4,16}$/.test(id)&&v&&Number.isFinite(v.wrong)&&Number.isFinite(v.hints))review[id]={wrong:Math.max(0,Math.min(1000,v.wrong)),hints:Math.max(0,Math.min(1000,v.hints))};
 }
}catch{}
function reviewCount(){return Object.keys(review).length}
function saveReview(){try{localStorage.setItem(REVIEW_KEY,JSON.stringify(review))}catch{}updateReviewUI()}
function updateReviewUI(){const el=$('review');if(!el)return;el.textContent=(reviewMode?'✓ ':'')+T('review',reviewCount());el.setAttribute('aria-pressed',String(reviewMode));}
function flagReview(kind){if(!puzzle)return;const id=puzzle[0];const v=review[id]||{wrong:0,hints:0};v[kind]++;review[id]=v;
 if(reviewCount()>300)delete review[Object.keys(review)[0]];
 saveReview();}
function clearReview(){if(puzzle&&review[puzzle[0]]){delete review[puzzle[0]];saveReview()}}

let adapt={rating:1100,solved:0,failed:0,history:[]};
try{const v=JSON.parse(localStorage.getItem(ADAPT_KEY)||'null');if(v&&Number.isFinite(v.rating)&&v.rating>=400&&v.rating<=3000)adapt={...adapt,...v}}catch{}
let manifest=null,pool=[],shardsLeft=[],used=new Set(),puzzle=null,game=null,selected=null,ply=0,waiting=false,token=0,advance=null;
let puzzleStart=0,hadError=false,hintsUsed=0,graded=false,solvedReported=false,flipped=false,flipBusy=false;
const playSound=type=>window.ChessAcademyPuzzleAudio?.play(type);
const square=i=>'abcdefgh'[i%8]+(8-Math.floor(i/8));
const status=message=>{$('status').textContent=message};
function report(action){
 if(!puzzle||window.parent===window)return;
 const message={kind:'chess-academy-puzzle-v1',action,id:puzzle[0],rating:puzzle[3],themes:puzzle[4],seconds:Math.min(7200,Math.max(0,(Date.now()-puzzleStart)/1000))};
 window.parent.postMessage(message,location.origin==='null'?'*':location.origin);
}
function saveAdaptive(){try{localStorage.setItem(ADAPT_KEY,JSON.stringify(adapt))}catch{}}
function updateAdaptive(){const el=$('adaptive-info');if(el)el.textContent=T('adaptiveInfo',adapt.rating,adapt.solved,adapt.failed)}
function grade(ok){
 if(graded||!puzzle||$('level').value!=='adaptive')return;
 graded=true;
 const expected=1/(1+Math.pow(10,(puzzle[3]-adapt.rating)/400));
 adapt.rating=Math.max(400,Math.min(3000,Math.round(adapt.rating+28*((ok?1:0)-expected))));
 adapt[ok?'solved':'failed']++;
 adapt.history.push({id:puzzle[0],ok,rating:puzzle[3],at:new Date().toISOString()});
 adapt.history=adapt.history.slice(-250);saveAdaptive();updateAdaptive();
}
function matches(p){
 const r=p[3],th=p[4],lv=$('level').value,t=$('theme').value;
 const levelOk=lv==='all'||lv==='adaptive'&&Math.abs(r-adapt.rating)<=250||lv==='easy'&&r<1200||lv==='medium'&&r>=1200&&r<1800||lv==='hard'&&r>=1800;
 return levelOk&&(t==='all'||th.includes(t)||t==='mate'&&th.some(x=>x.startsWith('mate')));
}
function pickCandidates(){
 if(reviewMode){let due=pool.filter(p=>Object.prototype.hasOwnProperty.call(review,p[0]));return due.filter(p=>!used.has(p[0])).length?due.filter(p=>!used.has(p[0])):due}
 let candidates=pool.filter(matches);
 if(!candidates.length&&$('level').value==='adaptive'){
  // The small sample may have no near-rating puzzle. Pick the nearest one and disclose fallback.
  const theme=$('theme').value;
  candidates=pool.filter(p=>theme==='all'||p[4].includes(theme)||theme==='mate'&&p[4].some(x=>x.startsWith('mate')))
   .sort((a,b)=>Math.abs(a[3]-adapt.rating)-Math.abs(b[3]-adapt.rating)).slice(0,20);
 }
 if(!candidates.length)return [];
 let unseen=candidates.filter(p=>!used.has(p[0]));
 if(!unseen.length){used.clear();unseen=candidates}
 return unseen;
}
async function load(){
 try{
  const res=await fetch('puzzle-data/manifest.json');if(!res.ok)throw Error('manifest');
  manifest=await res.json();if(!Array.isArray(manifest.shards)||!manifest.shards.length)throw Error('empty manifest');
  shardsLeft=manifest.shards.slice().sort(()=>Math.random()-.5);
  $('count').textContent=T('count',Number(manifest.count||0).toLocaleString(window.ChessAcademyPuzzleI18n.getLang()));
  await next();
 }catch{waiting=false;status(T('dataError'));$('count').textContent=T('dataUnavailable')}
}
async function next(){
 if(puzzle&&!waiting&&hadError)grade(false);
 clearTimeout(advance);const current=++token;waiting=true;selected=null;
 try{
  // Avoid fetching an entire 100K+ dataset just because one theme is rare.
  for(let i=0;i<Math.min(6,manifest?.shards.length||0)&&!(reviewMode?pool.some(p=>Object.prototype.hasOwnProperty.call(review,p[0])):pool.some(matches))&&shardsLeft.length;i++){
   const shard=shardsLeft.pop();
   const response=await fetch('puzzle-data/'+shard);
   if(!response.ok)throw Error('shard');
   const rows=await response.json();if(current!==token)return;
   if(!Array.isArray(rows))throw Error('invalid shard');
   const seen=new Set(pool.map(x=>x[0]));
   for(const row of rows){if(Array.isArray(row)&&row.length>=5&&!seen.has(row[0])){pool.push(row);seen.add(row[0])}}
   if(pool.length>6000)pool=pool.slice(-4000);
  }
  if(current!==token)return;
  const candidates=pickCandidates();
  if(!candidates.length){puzzle=null;game=null;waiting=false;$('board').replaceChildren();$('info').textContent='';status(reviewMode?(reviewCount()===0?T('emptyReview'):shardsLeft.length?T('reviewNext'):T('reviewMissing')):(shardsLeft.length?T('tryNext'):T('emptyFilter')));return}
  puzzle=candidates[Math.floor(Math.random()*candidates.length)];used.add(puzzle[0]);
  game=new ChessEngine(puzzle[1]);const first=puzzle[2][0];
  if(!game.move(first.slice(0,2),first.slice(2,4),first[4]||'q'))throw Error('invalid opening move');
  ply=1;waiting=false;hadError=false;hintsUsed=0;graded=false;solvedReported=false;puzzleStart=Date.now();
  $('info').textContent=T('info',puzzle[0],puzzle[3],puzzle[4].join(', '));
  status(T('turn'));render();
 }catch(e){if(current!==token)return;waiting=false;puzzle=null;game=null;$('board').replaceChildren();status(T('invalidPuzzle'));}
}
function render(){
 if(!game)return;const board=$('board');board.replaceChildren();
 for(let i=0;i<64;i++){
  const index=flipped?63-i:i,sq=square(index),p=game.at(sq),b=document.createElement('button');
  b.type='button';b.className='sq '+((Math.floor(index/8)+index%8)%2?'dark':'light')+(selected===sq?' selected':'')+(selected&&game.moves({square:selected}).some(m=>m.to===sq)?' target':'');
  b.setAttribute('aria-label',sq+(p?' '+p:''));
  if(p){b.innerHTML=window.ChessAcademyPieces.render(p)}
  b.addEventListener('click',()=>click(sq));board.append(b);
 }
}
function click(sq){
 if(waiting||!game)return;
 const piece=game.at(sq),own=piece&&(piece===piece.toUpperCase()?'w':'b')===game.turn;
 if(selected){
  if(sq===selected){selected=null;render();return}
  if(own){selected=sq;render();return}
  const from=selected;selected=null;const expected=puzzle[2][ply];
  if(expected&&expected.slice(0,2)===from&&expected.slice(2,4)===sq){
   const wasCapture=!!game.at(sq)||game.moves({square:from}).some(m=>m.to===sq&&m.enPassant);const move=game.move(from,sq,expected[4]||'q');
   if(move){
    ply++;playSound(game.isCheckmate()?'mate':game.isCheck()?'check':wasCapture?'capture':'move');render();
    if(ply>=puzzle[2].length){waiting=true;if(!hadError&&hintsUsed===0)clearReview();grade(!hadError&&hintsUsed===0);if(!solvedReported){report('solved');solvedReported=true}status(T('correct'));advance=setTimeout(next,1400);return}
    waiting=true;status(T('reply'));
    const pending=token;
    setTimeout(()=>{if(token!==pending||!game)return;const reply=puzzle[2][ply];const capture=reply&&(!!game.at(reply.slice(2,4))||game.moves({square:reply.slice(0,2)}).some(m=>m.to===reply.slice(2,4)&&m.enPassant));if(!reply||!game.move(reply.slice(0,2),reply.slice(2,4),reply[4]||'q')){status(T('replyError'));return}ply++;playSound(game.isCheckmate()?'mate':game.isCheck()?'check':capture?'capture':'move');waiting=false;render();status(T('continue'))},500);
    return;
   }
  }
  hadError=true;flagReview('wrong');report('wrong');status(T('wrong'));render();return;
 }
 if(own){selected=sq;render()}
}
$('next').onclick=next;
$('reset').onclick=()=>{if(!puzzle)return;clearTimeout(advance);++token;game=new ChessEngine(puzzle[1]);const m=puzzle[2][0];game.move(m.slice(0,2),m.slice(2,4),m[4]||'q');ply=1;waiting=false;selected=null;/* Preserve failures and hints across retries so a retry cannot inflate adaptive rating. */status(T('retry'));render()};
$('hint').onclick=()=>{if(!puzzle||waiting||ply>=puzzle[2].length)return;hintsUsed++;flagReview('hints');report('hint');status(T('hintText',puzzle[2][ply].slice(0,2)))};
$('level').onchange=()=>{if(puzzle&&hadError)grade(false);puzzle=null;next();updateAdaptive()};$('theme').onchange=()=>{if(puzzle&&hadError)grade(false);puzzle=null;next()};
$('review').onclick=()=>{if(puzzle&&hadError)grade(false);reviewMode=!reviewMode;used.clear();puzzle=null;updateReviewUI();next()};
$('flipPuzzle').onclick=()=>{
 if(flipBusy)return;const board=$('board'),files=document.querySelector('.tactic-files'),ranks=document.querySelector('.tactic-ranks');
 const apply=()=>{flipped=!flipped;const letters=flipped?'hgfedcba':'abcdefgh',numbers=flipped?'12345678':'87654321';if(files)for(const [i,el] of [...files.children].entries())el.textContent=letters[i];if(ranks)for(const [i,el] of [...ranks.children].entries())el.textContent=numbers[i];render()};
 playSound('flip');if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){apply();return}
 flipBusy=true;$('flipPuzzle').disabled=true;board.classList.add('flip-out');
 setTimeout(()=>{apply();board.classList.remove('flip-out');board.classList.add('flip-in');requestAnimationFrame(()=>requestAnimationFrame(()=>board.classList.remove('flip-in')))},290);
 setTimeout(()=>{board.classList.remove('flip-out','flip-in');flipBusy=false;$('flipPuzzle').disabled=false},670);
};
window.ChessAcademyPuzzleReview={getState:()=>({count:reviewCount(),reviewMode,ids:Object.keys(review)})};
window.ChessAcademyPuzzleI18n.onChange=()=>{window.ChessAcademyPuzzleAudio?.refresh();updateReviewUI();updateAdaptive();if(puzzle)$('info').textContent=T('info',puzzle[0],puzzle[3],puzzle[4].join(', '))};
updateReviewUI();updateAdaptive();load();
})();
