/* Chess Academy v0.4 board, training and local-only learning progress */
(function(){
'use strict';
const {ChessEngine}=window.ChessAcademyEngine;
const game=new ChessEngine();let selected=null,flipped=false,mode='free',challenge=0,solved=new Set(),advanceTimer=null;
const boardRoot=document.getElementById('board');
let soundEnabled=true,audioContext=null,lastMove=null,flipBusy=false;
try{soundEnabled=AcademyStorage.getItem('chess-academy-sound')!=='off'}catch{}
function sound(type){
 if(!soundEnabled)return;
 try{
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  audioContext=audioContext||new AC();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
  const ctx=audioContext,t=ctx.currentTime,rate=ctx.sampleRate;
  // Short filtered wood-on-wood transient, not a musical beep.
  const strike=(delay,body,brightness,volume)=>{
   const duration=.115,len=Math.ceil(rate*duration),buffer=ctx.createBuffer(1,len,rate),data=buffer.getChannelData(0);
   let low=0;for(let i=0;i<len;i++){const sec=i/rate,env=Math.exp(-sec*48);low=low*.72+(Math.random()*2-1)*.28;data[i]=low*env}
   const src=ctx.createBufferSource();src.buffer=buffer;
   const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=brightness;
   const gain=ctx.createGain();gain.gain.value=volume;
   src.connect(filter);filter.connect(gain);gain.connect(ctx.destination);
   src.start(t+delay);src.stop(t+delay+duration);
   const osc=ctx.createOscillator(),og=ctx.createGain();osc.type='sine';osc.frequency.value=body;
   og.gain.setValueAtTime(.0001,t+delay);og.gain.exponentialRampToValueAtTime(volume*.25,t+delay+.003);
   og.gain.exponentialRampToValueAtTime(.0001,t+delay+.075);
   osc.connect(og);og.connect(ctx.destination);osc.start(t+delay);osc.stop(t+delay+.08);
  };
  if(type==='flip'){strike(0,185,1800,.17);strike(.1,130,1300,.15);strike(.22,210,2200,.12)}else if(type==='capture'){strike(0,165,2100,.29);strike(.055,115,1100,.21)}
  else if(type==='mate'){strike(0,175,1800,.28);strike(.11,140,1400,.25);strike(.25,105,1050,.28)}
  else if(type==='check'){strike(0,195,2300,.23);strike(.085,170,1700,.15)}
  else{strike(0,240,2600,.20);strike(.052,175,1600,.13)}
 }catch(e){/* Sound is optional. */}
}
function setupBoardFrame(){
 const board=boardRoot;if(!board||board.closest('.chess-board-frame'))return;
 const frame=document.createElement('div');frame.className='chess-board-frame';
 const wrap=document.createElement('div');wrap.className='chess-board-wrap';
 const files=document.createElement('div');files.className='chess-board-files';
 const ranks=document.createElement('div');ranks.className='chess-board-ranks';
 frame.append(wrap);board.parentNode.insertBefore(frame,board);wrap.append(board,files,ranks);
 const toggle=document.createElement('button');toggle.type='button';toggle.className='btn chess-sound-toggle';
 toggle.setAttribute('aria-label','Toggle chess sound effects');
 toggle.onclick=()=>{soundEnabled=!soundEnabled;try{AcademyStorage.setItem('chess-academy-sound',soundEnabled?'on':'off')}catch{}updateSoundToggle();if(soundEnabled)sound('move')};
 frame.append(toggle);const controls=document.getElementById('flipBoard')?.parentElement;if(controls)controls.append(toggle);
 function updateSoundToggle(){toggle.textContent=soundEnabled?'🔊 Ses açık':'🔇 Ses kapalı';toggle.setAttribute('aria-pressed',String(soundEnabled))}
 updateSoundToggle();
 window.ChessAcademyBoardFrame={updateCoordinates:()=>{
  files.replaceChildren();ranks.replaceChildren();
  const letters='abcdefgh'.split('');if(flipped)letters.reverse();
  for(const l of letters){const n=document.createElement('span');n.textContent=l;files.append(n)}
  const nums=flipped?[1,2,3,4,5,6,7,8]:[8,7,6,5,4,3,2,1];
  for(const n of nums){const el=document.createElement('span');el.textContent=n;ranks.append(el)}
 }};
 window.ChessAcademyBoardFrame.updateCoordinates();
}
setupBoardFrame();
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=='chess-academy-select-side')return;const side=event.data.side;if(side!=='w'&&side!=='b')return;flipped=side==='b';selected=null;renderBoard()});

// Real Stockfish UCI opponent. The engine runs off the UI thread.
let computerSide=null,stockfishWorker=null,stockfishReady=false,stockfishThinking=false,stockfishGeneration=0,stockfishLevel=10,stockfishMoveMs=650,stockfishAnalysis=false,stockfishScore=null,stockfishDepth=0,stockfishBestLine='';
const stockfishUrl='https://cdn.jsdelivr.net/npm/stockfish@19.0.0/bin/stockfish-19-asm.js';
function computerNotice(message){
 if(window.parent!==window&&new URLSearchParams(location.search).get('embed')==='arena')
  window.parent.postMessage({type:'chess-academy-computer-status',message},location.origin);
}
function stopComputer(){
 computerSide=null;stockfishThinking=false;stockfishGeneration++;
 if(stockfishWorker){stockfishWorker.terminate();stockfishWorker=null;}
 stockfishReady=false;
}
function startComputer(side,level=10,moveMs=650,analysis=false){
 stopComputer();cancelAdvance();mode='free';
 computerSide=side==='b'?'b':'w';stockfishLevel=Math.max(1,Math.min(20,Number(level)||10));stockfishMoveMs=Math.max(100,Math.min(10000,Number(moveMs)||650));stockfishAnalysis=!!analysis;stockfishScore=null;stockfishDepth=0;stockfishBestLine='';flipped=computerSide==='b';
 game.load(window.ChessAcademyEngine.START);selected=null;lastMove=null;renderBoard();
 try{
  const source='importScripts('+JSON.stringify(stockfishUrl)+');';
  const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
  stockfishWorker=new Worker(url);URL.revokeObjectURL(url);
  const generation=stockfishGeneration;
  stockfishWorker.onmessage=event=>{
   if(generation!==stockfishGeneration||!computerSide)return;
   const line=String(event.data||'');
   if(line.startsWith('info ')&&stockfishThinking&&stockfishAnalysis){
    const d=line.match(/\\bdepth (\\d+)/),cp=line.match(/\\bscore cp (-?\\d+)/),mate=line.match(/\\bscore mate (-?\\d+)/),pv=line.match(/\\bpv (.+)$/);
    if(d)stockfishDepth=Number(d[1]);
    if(cp)stockfishScore=(Number(cp[1])/100)*(game.turn==='w'?1:-1);
    if(mate)stockfishScore='M'+(Number(mate[1])*(game.turn==='w'?1:-1));
    if(pv)stockfishBestLine=pv[1].split(' ').slice(0,8).join(' ');
    computerAnalysisNotice();
   }
   if(line.includes('uciok')){stockfishWorker.postMessage('setoption name UCI_LimitStrength value false');stockfishWorker.postMessage('setoption name Skill Level value '+stockfishLevel);stockfishWorker.postMessage('isready');}
   if(line.includes('readyok')){stockfishReady=true;computerNotice('Stockfish hazır. '+(computerSide==='w'?'Beyaz':'Siyah')+' taşlarla oynuyorsun.');queueComputerMove();}
   const match=line.match(/(?:^|\\n)bestmove\\s+([a-h][1-8])([a-h][1-8])([qrbn])?/);
   if(match&&stockfishThinking){
    stockfishThinking=false;
    if(game.turn===computerSide||game.isGameOver())return;
    const from=match[1],to=match[2],promotion=match[3]||'q';
    const wasCapture=!!game.at(to);
    const move=game.move(from,to,promotion);
    if(!move){computerNotice('Motor geçersiz hamle döndürdü.');return;}
    lastMove={from,to};selected=null;
    sound(game.isCheckmate()?'mate':game.isCheck()?'check':wasCapture?'capture':'move');
    postBoardMove();announce(boardStatus());renderBoard();
   }
  };
  stockfishWorker.onerror=()=>{computerNotice('Stockfish yüklenemedi. İnternet bağlantısını kontrol et.');stopComputer();};
  stockfishWorker.postMessage('uci');
  computerNotice('Stockfish yükleniyor...');
 }catch(error){computerNotice('Stockfish başlatılamadı: '+error.message);stopComputer();}
}
function queueComputerMove(){
 if(!computerSide||!stockfishReady||stockfishThinking||game.turn===computerSide||game.isGameOver())return;
 stockfishThinking=true;
 stockfishWorker.postMessage('position fen '+game.fen());
 stockfishWorker.postMessage('go movetime '+stockfishMoveMs);
 computerNotice('Stockfish düşünüyor...');
}
function computerAnalysisNotice(){
 if(!stockfishAnalysis||window.parent===window)return;
 window.parent.postMessage({type:'chess-academy-computer-analysis',depth:stockfishDepth,score:stockfishScore,pv:stockfishBestLine},location.origin);
}
function postBoardMove(){
 if(window.parent!==window&&new URLSearchParams(location.search).get('embed')==='arena')
  window.parent.postMessage({type:'chess-academy-board-move',turn:game.turn,gameOver:game.isGameOver(),result:boardStatus()},location.origin);
}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==window.parent)return;
 if(event.data?.type==='chess-academy-computer-start')startComputer(event.data.side,event.data.level,event.data.moveMs,event.data.analysis);
 if(event.data?.type==='chess-academy-computer-stop'){stopComputer();computerNotice('Bilgisayar oyunu kapatıldı.');}
});
const unicode={K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
// Self-contained vector pieces with metallic / porcelain highlights. No external assets.
function pieceSVG(symbol,piece){
 const white=piece===piece.toUpperCase();
 const fill=white?'url(#ivory)':'url(#obsidian)';
 const stroke=white?'#705844':'#d1ae79';
 const shadow=white?'#bda88d':'#0c1118';
 const id=white?'i':'o';
 return `<svg class="piece-3d" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
 <defs>
  <linearGradient id="${id}v05" x1="0" y1="0" x2="1" y2="1">
   ${white?'<stop offset="0" stop-color="#fffdf3"/><stop offset=".28" stop-color="#e9e1d2"/><stop offset=".57" stop-color="#c8b6a0"/><stop offset=".77" stop-color="#fff6e4"/><stop offset="1" stop-color="#9c8772"/>':'<stop offset="0" stop-color="#7d8187"/><stop offset=".25" stop-color="#323b44"/><stop offset=".52" stop-color="#0f1822"/><stop offset=".73" stop-color="#56606a"/><stop offset="1" stop-color="#090f16"/>'}
  </linearGradient>
 </defs>
 <ellipse cx="51" cy="84" rx="30" ry="7" fill="#130c09" opacity=".27"/>
 <text x="50" y="48" fill="${shadow}" stroke="${shadow}" stroke-width="3" paint-order="stroke" opacity=".7">${symbol}</text>
 <text x="49" y="45" fill="url(#${id}v05)" stroke="${stroke}" stroke-width="1.25" paint-order="stroke">${symbol}</text>
 <path d="M29 79 Q50 87 71 79" fill="none" stroke="${white?'#fff9e9':'#adb5bb'}" stroke-width="1.3" opacity=".48"/>
 </svg>`;
}
const puzzles=[{"fen":"7k/8/5KQ1/8/8/8/8/8 w - - 0 1","answer":"g6g7","theme":"Mate in one"},{"fen":"k7/8/1QK5/8/8/8/8/8 w - - 0 1","answer":"b6b7","theme":"Queen support"},{"fen":"r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4","answer":"h5f7","theme":"Scholar’s mate"},{"fen":"8/8/8/8/8/5kq1/8/7K b - - 0 1","answer":"g3g2","theme":"Black to move"},{"fen":"8/8/8/8/Q7/K7/8/k7 w - - 0 1","answer":"a4d1","theme":"Queen mate"},{"fen":"8/8/8/Q7/8/K7/8/k7 w - - 0 1","answer":"a5e1","theme":"Queen mate"},{"fen":"8/8/Q7/8/8/K7/8/k7 w - - 0 1","answer":"a6f1","theme":"Queen mate"},{"fen":"8/Q7/8/8/8/K7/8/k7 w - - 0 1","answer":"a7g1","theme":"Queen mate"},{"fen":"Q7/8/8/8/8/K7/8/k7 w - - 0 1","answer":"a8h1","theme":"Queen mate"},{"fen":"1Q6/8/8/8/8/K7/8/k7 w - - 0 1","answer":"b8b2","theme":"Queen mate"},{"fen":"8/2Q5/8/8/8/K7/8/k7 w - - 0 1","answer":"c7c1","theme":"Queen mate"},{"fen":"2Q5/8/8/8/8/K7/8/k7 w - - 0 1","answer":"c8c1","theme":"Queen mate"},{"fen":"8/8/3Q4/8/8/K7/8/k7 w - - 0 1","answer":"d6d1","theme":"Queen mate"},{"fen":"8/3Q4/8/8/8/K7/8/k7 w - - 0 1","answer":"d7d1","theme":"Queen mate"},{"fen":"3Q4/8/8/8/8/K7/8/k7 w - - 0 1","answer":"d8d1","theme":"Queen mate"},{"fen":"8/4Q3/8/8/8/K7/8/k7 w - - 0 1","answer":"e7e1","theme":"Queen mate"},{"fen":"4Q3/8/8/8/8/K7/8/k7 w - - 0 1","answer":"e8e1","theme":"Queen mate"},{"fen":"8/8/8/5Q2/8/K7/8/k7 w - - 0 1","answer":"f5f1","theme":"Queen mate"},{"fen":"5Q2/8/8/8/8/K7/8/k7 w - - 0 1","answer":"f8f1","theme":"Queen mate"},{"fen":"8/8/6Q1/8/8/K7/8/k7 w - - 0 1","answer":"g6g1","theme":"Queen mate"},{"fen":"8/7Q/8/8/8/K7/8/k7 w - - 0 1","answer":"h7h1","theme":"Queen mate"},{"fen":"8/8/8/8/Q7/K7/8/1k6 w - - 0 1","answer":"a4d1","theme":"Queen mate"},{"fen":"8/8/8/8/8/K1Q5/8/1k6 w - - 0 1","answer":"c3b2","theme":"Queen mate"},{"fen":"8/8/8/3Q4/8/K7/8/1k6 w - - 0 1","answer":"d5d1","theme":"Queen mate"},{"fen":"8/8/3Q4/8/8/K7/8/1k6 w - - 0 1","answer":"d6d1","theme":"Queen mate"},{"fen":"8/3Q4/8/8/8/K7/8/1k6 w - - 0 1","answer":"d7d1","theme":"Queen mate"},{"fen":"3Q4/8/8/8/8/K7/8/1k6 w - - 0 1","answer":"d8d1","theme":"Queen mate"},{"fen":"8/8/8/4Q3/8/K7/8/1k6 w - - 0 1","answer":"e5b2","theme":"Queen mate"}];
// Puzzle catalogue must exist before persisted progress is filtered.
try{const raw=JSON.parse(AcademyStorage.getItem('academy-v04-mates')||'[]');if(Array.isArray(raw))solved=new Set(raw.filter(x=>Number.isInteger(x)&&x>=0&&x<puzzles.length));}catch{}
const words={
 tr:{reset:'Yeni oyun',undo:'Geri al',flip:'Tahtayı çevir',challenge:'Mat çalışması',free:'Serbest oyun',next:'Sonraki problem',move:'Hamle sırası',white:'Beyaz',black:'Siyah',check:'Şah!',mate:'Şah mat!',stalemate:'Pat!',draw:'Berabere!',illegal:'Geçersiz hamle.',select:'Bir taş seç.',choose:'Yasal hedefler işaretlendi.',history:'Hamle geçmişi',progress:'Mat problemleri',solved:'Çözüldü',puzzle:'Tek hamlede matı bul.',success:'Tebrikler, matı buldun! +30 XP (ilk çözüm)',again:'Bu problemi daha önce çözdün.',wrong:'Bu hamle mat etmiyor. Yeniden dene.',end:'Oyun bitti. Yeni oyun başlat.',promo:'Terfi taşı',lesson:'Dersi tamamla',done:'Tamamlandı',course:'Ders ilerlemesi',live:'Bu cihazdaki gerçek demo ilerlemesi'},
 en:{reset:'New game',undo:'Undo',flip:'Flip board',challenge:'Mate practice',free:'Free play',next:'Next puzzle',move:'To move',white:'White',black:'Black',check:'Check!',mate:'Checkmate!',stalemate:'Stalemate!',draw:'Draw!',illegal:'Illegal move.',select:'Select a piece.',choose:'Legal targets highlighted.',history:'Move history',progress:'Mate puzzles',solved:'Solved',puzzle:'Find mate in one.',success:'Great! Mate found! +30 XP (first solve)',again:'You have already solved this puzzle.',wrong:'This move does not mate. Try again.',end:'Game over. Start a new game.',promo:'Promotion',lesson:'Complete lesson',done:'Completed',course:'Course progress',live:'Real demo progress on this device'},
 de:{reset:'Neues Spiel',undo:'Zurück',flip:'Brett drehen',challenge:'Mattaufgaben',free:'Freies Spiel',next:'Nächste Aufgabe',move:'Am Zug',white:'Weiß',black:'Schwarz',check:'Schach!',mate:'Schachmatt!',stalemate:'Patt!',draw:'Remis!',illegal:'Ungültiger Zug.',select:'Figur wählen.',choose:'Legale Felder markiert.',history:'Zugliste',progress:'Mattaufgaben',solved:'Gelöst',puzzle:'Matt in einem Zug.',success:'Matt gefunden! +30 XP (erstes Mal)',again:'Bereits gelöst.',wrong:'Kein Matt. Versuche es erneut.',end:'Spiel beendet.',promo:'Umwandlung',lesson:'Lektion abschließen',done:'Abgeschlossen',course:'Lernfortschritt',live:'Demo-Fortschritt auf diesem Gerät'},
 it:{reset:'Nuova partita',undo:'Annulla',flip:'Ruota scacchiera',challenge:'Esercizi di matto',free:'Partita libera',next:'Prossimo esercizio',move:'Turno',white:'Bianco',black:'Nero',check:'Scacco!',mate:'Scacco matto!',stalemate:'Stallo!',draw:'Patta!',illegal:'Mossa non valida.',select:'Seleziona un pezzo.',choose:'Mosse legali evidenziate.',history:'Mosse',progress:'Problemi di matto',solved:'Risolti',puzzle:'Trova il matto in una mossa.',success:'Matto trovato! +30 XP (prima volta)',again:'Già risolto.',wrong:'Non è matto. Riprova.',end:'Partita finita.',promo:'Promozione',lesson:'Completa lezione',done:'Completato',course:'Progressi',live:'Progressi demo su questo dispositivo'},
 ru:{reset:'Новая партия',undo:'Отменить',flip:'Перевернуть доску',challenge:'Мат в один ход',free:'Свободная игра',next:'Следующая задача',move:'Ход',white:'Белые',black:'Чёрные',check:'Шах!',mate:'Мат!',stalemate:'Пат!',draw:'Ничья!',illegal:'Недопустимый ход.',select:'Выберите фигуру.',choose:'Показаны возможные ходы.',history:'История ходов',progress:'Задачи на мат',solved:'Решено',puzzle:'Найдите мат в один ход.',success:'Мат найден! +30 XP (впервые)',again:'Уже решено.',wrong:'Это не мат. Попробуйте ещё.',end:'Партия завершена.',promo:'Превращение',lesson:'Завершить урок',done:'Завершено',course:'Прогресс',live:'Демо-прогресс на этом устройстве'},
 az:{reset:'Yeni oyun',undo:'Geri al',flip:'Lövhəni çevir',challenge:'Mat tapşırıqları',free:'Sərbəst oyun',next:'Növbəti tapşırıq',move:'Növbə',white:'Ağ',black:'Qara',check:'Şah!',mate:'Mat!',stalemate:'Pat!',draw:'Heç-heçə!',illegal:'Yanlış gediş.',select:'Fiqur seç.',choose:'Mümkün xanalar göstərildi.',history:'Gediş tarixçəsi',progress:'Mat tapşırıqları',solved:'Həll edildi',puzzle:'Bir gedişdə mat tap.',success:'Mat tapıldı! +30 XP (ilk dəfə)',again:'Artıq həll etmisən.',wrong:'Bu mat deyil. Yenidən yoxla.',end:'Oyun bitdi.',promo:'Çevrilmə',lesson:'Dərsi tamamla',done:'Tamamlandı',course:'Dərs irəliləyişi',live:'Bu cihazdakı demo irəliləyiş'}
};
const $=id=>document.getElementById(id);const w=()=>words[language]||words.en;
function announce(message){$('boardNote').textContent=message;}
function boardStatus(){if(game.isCheckmate())return w().mate+' '+(game.turn==='w'?w().black:w().white);if(game.isStalemate())return w().stalemate;if(game.isDraw())return w().draw;return w().move+': '+(game.turn==='w'?w().white:w().black)+(game.isCheck()?' · '+w().check:'');}
function historyNotation(){const replay=new ChessEngine();const san=[];for(const entry of game.history){const m=entry.move,from=m.from,to=m.to,p=replay.at(from);if(!p)break;const capture=!!replay.at(to)||!!m.enPassant;let label='';if(p.toLowerCase()==='k'&&Math.abs(from.charCodeAt(0)-to.charCodeAt(0))===2){label=to[0]==='g'?'O-O':'O-O-O'}else{const kind=p.toUpperCase()==='P'?'':p.toUpperCase();let disamb='';if(kind){const rivals=replay.moves().filter(x=>x.to===to&&x.from!==from&&replay.at(x.from)?.toUpperCase()===p.toUpperCase());if(rivals.length){const sameFile=rivals.some(x=>x.from[0]===from[0]),sameRank=rivals.some(x=>x.from[1]===from[1]);disamb=!sameFile?from[0]:!sameRank?from[1]:from}}else if(capture)disamb=from[0];label=kind+disamb+(capture?'x':'')+to+(m.promotion?'='+m.promotion.toUpperCase():'')}const applied=replay.move(from,to,m.promotion||'q');if(!applied)break;if(replay.isCheckmate())label+='#';else if(replay.isCheck())label+='+';san.push(label)}return san}
function updateHistoryPanel(){const notation=historyNotation(),text=notation.map((m,i)=>(i%2===0?Math.floor(i/2)+1+'. ':'')+m).join(' ');const field=document.getElementById('moveHistoryText');if(field)field.value=text;const copy=document.getElementById('copyMoves'),analyse=document.getElementById('analyseMoves');if(copy)copy.disabled=!notation.length;if(analyse){analyse.setAttribute('aria-disabled',String(!notation.length));analyse.href=notation.length?'https://lichess.org/analysis/pgn/'+notation.map(encodeURIComponent).join('_')+'#'+notation.length:'#'}if(window.parent!==window&&new URLSearchParams(location.search).get('embed')==='arena')window.parent.postMessage({type:'chess-academy-history',notation,text,url:notation.length?'https://lichess.org/analysis/pgn/'+notation.map(encodeURIComponent).join('_')+'#'+notation.length:null},location.origin)}
function renderBoard(){const root=$('board');root.replaceChildren();window.ChessAcademyBoardFrame?.updateCoordinates();const valid=selected?new Set(game.moves({square:selected}).map(x=>x.to)):new Set();const squares=Array.from({length:64},(_,i)=>i);if(flipped)squares.reverse();for(const i of squares){const name=window.ChessAcademyEngine.squareName(i),piece=game.at(i),btn=document.createElement('button');btn.type='button';btn.className='sq '+((Math.floor(i/8)+i%8)%2?'dark':'light')+(selected===name?' selected':'')+(valid.has(name)?' target':'');if(piece)btn.innerHTML=pieceSVG(unicode[piece],piece);if(lastMove&&(lastMove.from===name||lastMove.to===name))btn.classList.add('last-move');btn.setAttribute('aria-label',name+' '+(piece||'empty')+(valid.has(name)?' legal target':''));btn.setAttribute('aria-pressed',String(selected===name));btn.dataset.square=name;btn.onclick=()=>{if(performedDrag){performedDrag=false;return;}handleSquare(name);};root.append(btn);}refreshCarryGhost();const moves=game.history.map((x,i)=>`${i%2===0?`${Math.floor(i/2)+1}. `:''}${x.move.from}${x.move.to}${x.move.promotion||''}`);$('moveHistory').textContent=moves.join('  ')||'·';updateHistoryPanel();$('boardStatus').textContent=boardStatus();$('undoMove').disabled=mode!=='free'||game.history.length===0;$('nextMate').hidden=mode!=='mate';$('mateProgress').textContent=`${w().progress}: ${solved.size}/${puzzles.length}`;}
// Pointer interactions: the entire 64-cell square is a touch target, not the visible piece.
// Tap a piece then its highlighted destination, or press and drag to the destination.
let performedDrag=false;
let dragOrigin=null,dragPointer=null,dragStartX=0,dragStartY=0;
const boardEl=$('board');
boardEl.style.touchAction='none';
let carryGhost=null,draggingPiece=false,lastPointerX=0,lastPointerY=0;
function clearCarryGhost(){
 carryGhost?.remove();carryGhost=null;
 boardEl.querySelectorAll('.ca-source-lifted').forEach(el=>el.classList.remove('ca-source-lifted'));
}
function positionCarry(x,y){
 lastPointerX=x;lastPointerY=y;
 if(carryGhost){carryGhost.style.left=x+'px';carryGhost.style.top=y+'px';}
}
function refreshCarryGhost(){
 clearCarryGhost();
 // A simple click selects/highlights legal squares, never picks up the piece.
 if(!draggingPiece||!dragOrigin)return;
 const piece=game.at(dragOrigin),source=boardEl.querySelector('[data-square="'+dragOrigin+'"]');
 if(!piece||!source)return;
 const rect=source.getBoundingClientRect();
 carryGhost=document.createElement('div');carryGhost.className='ca-piece-carry';
 const original=source.querySelector('svg.piece-3d');
 carryGhost.append(original?original.cloneNode(true):document.createRange().createContextualFragment(pieceSVG(unicode[piece],piece)));
 carryGhost.setAttribute('aria-hidden','true');
 carryGhost.style.width=rect.width+'px';carryGhost.style.height=rect.height+'px';
 document.body.append(carryGhost);source.classList.add('ca-source-lifted');
 positionCarry(lastPointerX,lastPointerY);
}
function finishDrag(){
 draggingPiece=false;dragOrigin=null;dragPointer=null;clearCarryGhost();
}
boardEl.addEventListener('pointerdown',event=>{
 if(event.pointerType==='mouse'&&event.button!==0)return;
 const sq=event.target.closest('.sq');if(!sq||!boardEl.contains(sq))return;
 const from=sq.dataset.square,piece=game.at(from);
 // A tap on any square remains a normal click, including legal destinations.
 if(!piece||(piece===piece.toUpperCase()?'w':'b')!==game.turn)return;
 dragOrigin=from;dragPointer=event.pointerId;
 dragStartX=event.clientX;dragStartY=event.clientY;
 lastPointerX=event.clientX;lastPointerY=event.clientY;
 draggingPiece=false;
 // Capture only once a real drag starts; taps must keep normal hit testing.
});
boardEl.addEventListener('pointermove',event=>{
 if(dragPointer!==event.pointerId||!dragOrigin)return;
 const distance=Math.hypot(event.clientX-dragStartX,event.clientY-dragStartY);
 positionCarry(event.clientX,event.clientY);
 if(!draggingPiece&&distance>=9){
  draggingPiece=true;selected=dragOrigin;renderBoard();
  try{boardEl.setPointerCapture(event.pointerId)}catch{}
 }
});
boardEl.addEventListener('pointerup',event=>{
 if(dragPointer!==event.pointerId)return;
 const from=dragOrigin,wasDragging=draggingPiece;
 try{boardEl.releasePointerCapture(event.pointerId)}catch{}
 if(!wasDragging){
  // Explicit tap handling: pointer capture or touch browsers may suppress click.
  finishDrag();
  performedDrag=true;setTimeout(()=>{performedDrag=false},220);
  handleSquare(from);return;
 }
 positionCarry(event.clientX,event.clientY);
 const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('.sq');
 const to=target&&boardEl.contains(target)?target.dataset.square:null;
 performedDrag=true;
 setTimeout(()=>{performedDrag=false},250);
 finishDrag();
 if(to&&to!==from&&game.moves({square:from}).some(m=>m.to===to)){
  selected=from;handleSquare(to);
 }else{
  // Same square, invalid square, or outside board: snap back.
  selected=null;renderBoard();
 }
});
boardEl.addEventListener('pointercancel',event=>{
 if(event.pointerId!==dragPointer)return;
 const wasDragging=draggingPiece;
 finishDrag();
 if(wasDragging){selected=null;renderBoard();}
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&draggingPiece){finishDrag();selected=null;renderBoard();}
});
function handleSquare(square){if(game.isGameOver()){announce(w().end);return;}if(computerSide&&(game.turn!==computerSide||stockfishThinking)){announce('Stockfish hamlesi bekleniyor.');return;}const piece=game.at(square),current=piece&&(piece===piece.toUpperCase()?'w':'b');if(!selected){if(current===game.turn){selected=square;announce(w().choose);}else announce(w().select);renderBoard();return;}if(square===selected){selected=null;renderBoard();return;}if(current===game.turn){selected=square;announce(w().choose);renderBoard();return;}const from=selected;selected=null;const legal=game.moves({square:from}).filter(m=>m.to===square);if(!legal.length){announce(w().illegal);selected=null;renderBoard();return;}const promotion=legal.some(m=>m.promotion)?$('promotionChoice').value:'q';const wasCapture=!!game.at(square)||legal.some(m=>m.enPassant);const move=game.move(from,square,promotion);if(!move){announce(w().illegal);renderBoard();return;}lastMove={from,to:square};postBoardMove();sound(game.isCheckmate()?'mate':game.isCheck()?'check':wasCapture?'capture':'move');if(mode==='mate'){const expected=puzzles[challenge].answer;if(move.uci===expected&&game.isCheckmate()){if(!solved.has(challenge)){solved.add(challenge);try{AcademyStorage.setItem('academy-v04-mates',JSON.stringify([...solved]));}catch{}announce(w().success);}else announce(w().again);scheduleNextPuzzle();}else{game.undo();lastMove=null;announce(w().wrong);}}else announce(boardStatus());renderBoard();updateLearning();if(computerSide&&mode==='free')queueComputerMove();}
function cancelAdvance(){if(advanceTimer!==null){clearTimeout(advanceTimer);advanceTimer=null;}}
function scheduleNextPuzzle(){cancelAdvance();advanceTimer=setTimeout(()=>{advanceTimer=null;if(mode==='mate')nextMate();},1700);}
function startMate(){stopComputer();cancelAdvance();mode='mate';challenge=0;game.load(puzzles[challenge].fen);selected=null;lastMove=null;announce(w().puzzle);renderBoard();}
function nextMate(){cancelAdvance();challenge=(challenge+1)%puzzles.length;game.load(puzzles[challenge].fen);selected=null;lastMove=null;announce(w().puzzle+' '+(challenge+1)+'/'+puzzles.length);renderBoard();}
$('resetBoard').onclick=()=>{stopComputer();if(window.parent!==window&&new URLSearchParams(location.search).get('embed')==='arena')window.parent.postMessage({type:'chess-academy-board-reset'},location.origin);cancelAdvance();mode='free';game.load(window.ChessAcademyEngine.START);selected=null;lastMove=null;announce(boardStatus());renderBoard();};
$('undoMove').onclick=()=>{if(mode!=='free'||computerSide)return;game.undo();selected=null;lastMove=null;announce(boardStatus());renderBoard();};
$('flipBoard').onclick=()=>{const root=$('board');if(flipBusy)return;const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const finish=()=>{flipped=!flipped;renderBoard()};sound('flip');if(reduce){finish();return}flipBusy=true;$('flipBoard').disabled=true;root.classList.remove('ca-standalone-spin');void root.offsetWidth;root.classList.add('ca-standalone-spin');setTimeout(finish,390);setTimeout(()=>{root.classList.remove('ca-standalone-spin');flipBusy=false;$('flipBoard').disabled=false},820)};$('mateMode').onclick=startMate;$('nextMate').onclick=nextMate;
const lessonsKey='academy-v04-lessons';let lessons=[];try{const v=JSON.parse(AcademyStorage.getItem(lessonsKey)||'[]');if(Array.isArray(v))lessons=v.filter(x=>Number.isInteger(x)&&x>=0&&x<6);}catch{}
function updateLearning(){const target=$('lessonProgress'),parent=$('parentLive');if(target)target.textContent=`${w().course}: ${lessons.length}/6 · ${w().progress}: ${solved.size}/${puzzles.length}`;if(parent)parent.textContent=w().live+` · ${lessons.length}/6 · ${solved.size}/${puzzles.length}`;}
function decorateLessons(){document.querySelectorAll('#courseCards .lessonitem').forEach((card,i)=>{const button=document.createElement('button');button.type='button';button.className='btn lessonButton';button.textContent=lessons.includes(i)?'✓ '+w().done:w().lesson;button.setAttribute('aria-pressed',String(lessons.includes(i)));button.onclick=()=>{if(!lessons.includes(i))lessons.push(i);else lessons=lessons.filter(n=>n!==i);try{AcademyStorage.setItem(lessonsKey,JSON.stringify(lessons));}catch{}decorateLessons();updateLearning();};const old=card.querySelector('.lessonButton');if(old)old.remove();card.append(button);});}
const prevRender=renderExtras;renderExtras=function(){prevRender();decorateLessons();updateLearning();};
const oldTranslate=translate;translate=function(){oldTranslate();$('resetBoard').textContent=w().reset;$('undoMove').textContent=w().undo;$('flipBoard').textContent=w().flip;$('mateMode').textContent=w().challenge;$('nextMate').textContent=w().next;$('promotionLabel').textContent=w().promo;$('moveHistoryTitle').textContent=w().history;$('boardStatus').textContent=boardStatus();announce(mode==='mate'?w().puzzle:w().select);renderBoard();updateLearning();};
const copyMovesButton=document.getElementById('copyMoves');if(copyMovesButton)copyMovesButton.addEventListener('click',async()=>{const field=document.getElementById('moveHistoryText');if(!field)return;try{await navigator.clipboard.writeText(field.value);copyMovesButton.textContent='✓ Kopyalandı';setTimeout(()=>copyMovesButton.textContent='📋 Kopyala',1500)}catch{field.focus();field.select();document.execCommand('copy')}});
renderExtras();translate();
window.ChessAcademyDemo={game,startMate,nextMate,getProgress:()=>({lessons:[...lessons],mateSolved:[...solved]}),setProgress:p=>{if(!p||!Array.isArray(p.lessons)||!Array.isArray(p.mateSolved))throw Error('Invalid progress');lessons=[...new Set(p.lessons)];solved=new Set(p.mateSolved);AcademyStorage.setItem(lessonsKey,JSON.stringify(lessons));AcademyStorage.setItem('academy-v04-mates',JSON.stringify([...solved]));renderExtras();renderBoard();updateLearning();}};
})();
