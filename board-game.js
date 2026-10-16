/* Chess Academy v0.4 board, training and local-only learning progress */
(function(){
'use strict';
const {ChessEngine}=window.ChessAcademyEngine;
const game=new ChessEngine();let selected=null,flipped=false,mode='free',challenge=0,solved=new Set(),advanceTimer=null;

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
function renderBoard(){const root=$('board');root.replaceChildren();const valid=selected?new Set(game.moves({square:selected}).map(x=>x.to)):new Set();const squares=Array.from({length:64},(_,i)=>i);if(flipped)squares.reverse();for(const i of squares){const name=window.ChessAcademyEngine.squareName(i),piece=game.at(i),btn=document.createElement('button');btn.type='button';btn.className='sq '+((Math.floor(i/8)+i%8)%2?'dark':'light')+(selected===name?' selected':'')+(valid.has(name)?' target':'');if(piece)btn.innerHTML=pieceSVG(unicode[piece],piece);if(i%8===7||Math.floor(i/8)===7){const coord=document.createElement('span');coord.className='coordinate';coord.textContent=i%8===7?String(8-Math.floor(i/8)):String.fromCharCode(97+i%8);btn.append(coord);}btn.setAttribute('aria-label',name+' '+(piece||'empty')+(valid.has(name)?' legal target':''));btn.setAttribute('aria-pressed',String(selected===name));btn.dataset.square=name;btn.onclick=()=>{if(performedDrag){performedDrag=false;return;}handleSquare(name);};root.append(btn);}const moves=game.history.map((x,i)=>`${i%2===0?`${Math.floor(i/2)+1}. `:''}${x.move.from}${x.move.to}${x.move.promotion||''}`);$('moveHistory').textContent=moves.join('  ')||'·';$('boardStatus').textContent=boardStatus();$('undoMove').disabled=mode!=='free'||game.history.length===0;$('nextMate').hidden=mode!=='mate';$('mateProgress').textContent=`${w().progress}: ${solved.size}/${puzzles.length}`;}
// Pointer interactions: the entire 64-cell square is a touch target, not the visible piece.
// Tap a piece then its highlighted destination, or press and drag to the destination.
let performedDrag=false;
let dragOrigin=null,dragPointer=null,dragStartX=0,dragStartY=0;
const boardEl=$('board');
boardEl.style.touchAction='none';
boardEl.addEventListener('pointerdown',event=>{
 const sq=event.target.closest('.sq');
 if(!sq||!boardEl.contains(sq))return;
 if(event.pointerType==='mouse'&&event.button!==0)return;
 dragOrigin=sq.dataset.square;dragPointer=event.pointerId;
 dragStartX=event.clientX;dragStartY=event.clientY;
});
boardEl.addEventListener('pointerup',event=>{
 if(dragPointer!==event.pointerId||!dragOrigin)return;
 const from=dragOrigin;dragOrigin=null;dragPointer=null;
 const moved=Math.hypot(event.clientX-dragStartX,event.clientY-dragStartY);
 if(moved<12)return; // ordinary click / tap handled by click event
 const hit=document.elementFromPoint(event.clientX,event.clientY);
 const to=hit&&hit.closest('.sq');
 if(!to||!boardEl.contains(to)||to.dataset.square===from)return;
 // Suppress click synthesized after a drag, but not the next genuine tap.
 performedDrag=true;
 setTimeout(()=>{performedDrag=false},120);
 const p=game.at(from);
 if(!p||((p===p.toUpperCase()?'w':'b')!==game.turn))return;
 selected=from;
 handleSquare(to.dataset.square);
});
boardEl.addEventListener('pointercancel',()=>{dragOrigin=null;dragPointer=null;});
function handleSquare(square){if(game.isGameOver()){announce(w().end);return;}const piece=game.at(square),current=piece&&(piece===piece.toUpperCase()?'w':'b');if(!selected){if(current===game.turn){selected=square;announce(w().choose);}else announce(w().select);renderBoard();return;}if(square===selected){selected=null;renderBoard();return;}if(current===game.turn){selected=square;announce(w().choose);renderBoard();return;}const from=selected;selected=null;const legal=game.moves({square:from}).filter(m=>m.to===square);if(!legal.length){announce(w().illegal);renderBoard();return;}const promotion=legal.some(m=>m.promotion)?$('promotionChoice').value:'q';const move=game.move(from,square,promotion);if(!move){announce(w().illegal);renderBoard();return;}if(mode==='mate'){const expected=puzzles[challenge].answer;if(move.uci===expected&&game.isCheckmate()){if(!solved.has(challenge)){solved.add(challenge);try{AcademyStorage.setItem('academy-v04-mates',JSON.stringify([...solved]));}catch{}announce(w().success);}else announce(w().again);scheduleNextPuzzle();}else{game.undo();announce(w().wrong);}}else announce(boardStatus());renderBoard();updateLearning();}
function cancelAdvance(){if(advanceTimer!==null){clearTimeout(advanceTimer);advanceTimer=null;}}
function scheduleNextPuzzle(){cancelAdvance();advanceTimer=setTimeout(()=>{advanceTimer=null;if(mode==='mate')nextMate();},1700);}
function startMate(){cancelAdvance();mode='mate';challenge=0;game.load(puzzles[challenge].fen);selected=null;announce(w().puzzle);renderBoard();}
function nextMate(){cancelAdvance();challenge=(challenge+1)%puzzles.length;game.load(puzzles[challenge].fen);selected=null;announce(w().puzzle+' '+(challenge+1)+'/'+puzzles.length);renderBoard();}
$('resetBoard').onclick=()=>{cancelAdvance();mode='free';game.load(window.ChessAcademyEngine.START);selected=null;announce(boardStatus());renderBoard();};
$('undoMove').onclick=()=>{if(mode!=='free')return;game.undo();selected=null;announce(boardStatus());renderBoard();};
$('flipBoard').onclick=()=>{
 const root=$('board');
 if(root.classList.contains('flip-animating'))return;
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){flipped=!flipped;renderBoard();return;}
 root.classList.add('flip-animating');
 root.classList.add('flip-out');
 setTimeout(()=>{flipped=!flipped;renderBoard();root.classList.remove('flip-out');root.classList.add('flip-in');requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.remove('flip-in')));},230);
 setTimeout(()=>root.classList.remove('flip-animating'),560);
};$('mateMode').onclick=startMate;$('nextMate').onclick=nextMate;
const lessonsKey='academy-v04-lessons';let lessons=[];try{const v=JSON.parse(AcademyStorage.getItem(lessonsKey)||'[]');if(Array.isArray(v))lessons=v.filter(x=>Number.isInteger(x)&&x>=0&&x<6);}catch{}
function updateLearning(){const target=$('lessonProgress'),parent=$('parentLive');if(target)target.textContent=`${w().course}: ${lessons.length}/6 · ${w().progress}: ${solved.size}/${puzzles.length}`;if(parent)parent.textContent=w().live+` · ${lessons.length}/6 · ${solved.size}/${puzzles.length}`;}
function decorateLessons(){document.querySelectorAll('#courseCards .lessonitem').forEach((card,i)=>{const button=document.createElement('button');button.type='button';button.className='btn lessonButton';button.textContent=lessons.includes(i)?'✓ '+w().done:w().lesson;button.setAttribute('aria-pressed',String(lessons.includes(i)));button.onclick=()=>{if(!lessons.includes(i))lessons.push(i);else lessons=lessons.filter(n=>n!==i);try{AcademyStorage.setItem(lessonsKey,JSON.stringify(lessons));}catch{}decorateLessons();updateLearning();};const old=card.querySelector('.lessonButton');if(old)old.remove();card.append(button);});}
const prevRender=renderExtras;renderExtras=function(){prevRender();decorateLessons();updateLearning();};
const oldTranslate=translate;translate=function(){oldTranslate();$('resetBoard').textContent=w().reset;$('undoMove').textContent=w().undo;$('flipBoard').textContent=w().flip;$('mateMode').textContent=w().challenge;$('nextMate').textContent=w().next;$('promotionLabel').textContent=w().promo;$('moveHistoryTitle').textContent=w().history;$('boardStatus').textContent=boardStatus();announce(mode==='mate'?w().puzzle:w().select);renderBoard();updateLearning();};
renderExtras();translate();
window.ChessAcademyDemo={game,startMate,nextMate,getProgress:()=>({lessons:[...lessons],mateSolved:[...solved]}),setProgress:p=>{if(!p||!Array.isArray(p.lessons)||!Array.isArray(p.mateSolved))throw Error('Invalid progress');lessons=[...new Set(p.lessons)];solved=new Set(p.mateSolved);AcademyStorage.setItem(lessonsKey,JSON.stringify(lessons));AcademyStorage.setItem('academy-v04-mates',JSON.stringify([...solved]));renderExtras();renderBoard();updateLearning();}};
})();
