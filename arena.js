(()=>{'use strict';
 const $=id=>document.getElementById(id),Engine=window.ChessAcademyEngine.ChessEngine,Shared=window.ChessAcademySharedBoard,archive=new URLSearchParams(location.search).get('archive')==='1';
 let uid=null,current=null,engine=new Engine(),ply=0,selected=null,flipped=false,busy=false,pollBusy=false,waiting=false,history=[],request=0,receivedAt=performance.now(),clockOffset=0;
 const pending=new Map(),status=t=>$('arenaStatus').textContent=t;
 if(archive){$('arenaTitle').textContent='📚 Müsabaka Arşivi';$('matchmaking').hidden=true;$('arenaHistoryTitle').textContent='Tüm kulüp müsabakaları';}
 function rpc(action,extra={}){return new Promise((resolve,reject)=>{if(parent===window)return reject(Error('Kulüp hesabına giriş yapıp Arena bölümünü aç.'));const id='arena-'+(++request),timer=setTimeout(()=>{pending.delete(id);reject(Error('Bağlantı gecikti. Tahta yenilenince tekrar dene.'))},18000);pending.set(id,{resolve,reject,timer});parent.postMessage({type:'barida-arena-request',request:id,action,...extra},location.origin)})}
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='barida-arena-response')return;const p=pending.get(e.data.request);if(!p)return;clearTimeout(p.timer);pending.delete(e.data.request);e.data.error?p.reject(Error(e.data.error)):p.resolve(e.data.data)});
 const active=()=>current?.status==='active',ownSide=()=>current?.white_id===uid?'w':current?.black_id===uid?'b':null;
 const canPlay=()=>!archive&&active()&&ownSide()===current.turn&&ply===current.moves.length&&!busy;
 const premium=window.ChessPremiumBoard.init({boardId:'arenaBoard'});
 const drag=Shared.bindDrag($('arenaBoard'),{canDrag:sq=>canPlay()&&!!engine.at(sq)&&((engine.at(sq)===engine.at(sq).toUpperCase()?'w':'b')===engine.turn),onDrop:(from,to)=>{selected=from;click(to)}});
 function draw(){engine=new Engine(current?.start_fen);const moves=current?.moves||[];for(const move of moves.slice(0,ply))if(!engine.move(move.slice(0,2),move.slice(2,4),move[4]||'q')){status('Hamle kaydı açılamadı.');return}
  premium.coordinates(flipped);const last=moves[ply-1];Shared.renderBoard({root:$('arenaBoard'),game:engine,flipped,selected,lastMove:last?{from:last.slice(0,2),to:last.slice(2,4)}:null,onSquare:sq=>{if(!drag.consumeClick())click(sq)}});
  $('arenaPly').textContent=ply+' / '+moves.length;$('arenaFirst').disabled=$('arenaBack').disabled=ply===0;$('arenaNext').disabled=$('arenaLast').disabled=ply===moves.length;
  $('liveActions').hidden=archive||!active()||!ownSide();$('arenaAccept').hidden=!current?.draw_offer||current.draw_offer===uid;
  $('arenaJoin').disabled=busy||active()||waiting;$('arenaLeave').hidden=!waiting;$('arenaPreset').disabled=waiting||active();
  $('arenaPlayers').textContent=current?current.white_name+' ⚪ — ⚫ '+current.black_name:'Müsabaka';
  $('arenaResult').textContent=current?(active()?'Oyun sürüyor · '+(current.turn==='w'?'Beyaz':'Siyah')+' oynar':current.result+' · '+current.reason+' · Rating kaydedildi'):'';
  $('arenaMoves').replaceChildren();moves.forEach((move,i)=>{const li=document.createElement('li'),b=document.createElement('button');b.textContent=(i%2===0?(Math.floor(i/2)+1)+'. ':'')+move;b.classList.toggle('active',i===ply-1);b.onclick=()=>{ply=i+1;selected=null;draw()};li.append(b);$('arenaMoves').append(li)});clock();fit();
 }
 function load(data,force=false){uid=data.user||uid;const g=data.game;if(!g){waiting=!!data.waiting;status(waiting?'Rakip bekleniyor… Aynı süreyle aramaya katılan bir kulüp üyesiyle eşleşeceksin.':'Müsabakaya hazırsın. Süreni seçip rakip ara.');draw();return}
  waiting=false;if(current?.id===g.id&&current.version===g.version&&current.draw_offer===g.draw_offer&&current.status===g.status){current=g;receivedAt=performance.now();clockOffset=Math.max(0,Date.parse(data.server_now||new Date().toISOString())-Date.parse(g.last_move_at));clock();return}const changed=current?.id!==g.id,atEnd=!current||ply===current.moves.length;current=g;receivedAt=performance.now();clockOffset=Math.max(0,Date.parse(data.server_now||new Date().toISOString())-Date.parse(g.last_move_at));if(changed){flipped=!archive&&g.black_id===uid;ply=g.moves.length}else if(force||atEnd)ply=g.moves.length;
  selected=null;draw();status(g.status==='finished'?'Müsabaka tamamlandı. Tüm hamleleri baştan sona inceleyebilirsin.':ownSide()===g.turn&&ply===g.moves.length?'Sıra sende. Hamleni yap.':ply<g.moves.length?'Geçmişi inceliyorsun. Oynamak için “Son hamle”ye dön.':'Rakibinin hamlesi bekleniyor.');
 }
 async function act(action,extra={}){if(busy)return;busy=true;try{const data=await rpc(action,extra);load(data,action==='move');if(current?.status==='finished')await refreshHistory();}catch(e){status(e.message);if(current)try{load(await rpc('get',{id:current.id}))}catch{} }finally{busy=false;draw()}}
 async function click(sq){if(!canPlay())return;if(selected){const from=selected;selected=null;const legal=engine.moves({square:from}).filter(m=>m.to===sq);if(legal.length){let promotion='';if(legal.some(m=>m.promotion)){promotion=await Shared.choosePromotion(engine.turn);if(!promotion){draw();return}}await act('move',{id:current.id,version:current.version,move:from+sq+promotion});return}}
  const piece=engine.at(sq);if(piece&&(piece===piece.toUpperCase()?'w':'b')===current.turn)selected=sq;draw();
 }
 const format=ms=>{const seconds=Math.ceil(Math.max(0,ms)/1000);return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')};
 function clock(){for(const side of ['w','b']){const el=$(side==='w'?'whiteClock':'blackClock');let ms=current?(side==='w'?current.white_ms:current.black_ms):0;if(active()&&current.turn===side)ms-=clockOffset+(performance.now()-receivedAt);el.textContent=(side==='w'?'⚪ ':'⚫ ')+format(ms);el.classList.toggle('running',active()&&current.turn===side)}}
 async function refreshHistory(older=false){const items=await rpc(archive?'archive':'history',older&&history.length?{before:history.at(-1).created_at}:{});history=older?[...history,...items]:items;$('arenaOlder').hidden=items.length<30;$('arenaHistory').replaceChildren();for(const g of history){const b=document.createElement('button');b.textContent=g.white_name+' — '+g.black_name+' · '+(g.result||'Devam ediyor')+' · '+new Date(g.created_at).toLocaleString('tr-TR');b.onclick=()=>act('get',{id:g.id});$('arenaHistory').append(b)}fit()}
 $('arenaJoin').onclick=()=>act('join',{preset:$('arenaPreset').value});$('arenaLeave').onclick=()=>act('leave');
 $('arenaResign').onclick=()=>{if(confirm('Bu müsabakayı terk etmek istiyor musun?'))act('resign',{id:current.id})};$('arenaOffer').onclick=()=>act('offer_draw',{id:current.id});$('arenaAccept').onclick=()=>act('accept_draw',{id:current.id});
 for(const [id,to] of [['arenaFirst',()=>0],['arenaBack',()=>Math.max(0,ply-1)],['arenaNext',()=>Math.min(current?.moves.length||0,ply+1)],['arenaLast',()=>current?.moves.length||0]])$(id).onclick=()=>{ply=to();selected=null;draw()};
 $('arenaFlip').onclick=()=>premium.flip(()=>{flipped=!flipped;draw()});premium.flipButton.onclick=$('arenaFlip').onclick;
 $('arenaCopy').onclick=async()=>{try{await navigator.clipboard.writeText((current?.moves||[]).join(' '));status('Tam hamle dizisi UCI biçiminde kopyalandı.')}catch{status('Panoya erişilemedi.')}};
 $('arenaRefresh').onclick=()=>refreshHistory().catch(e=>status(e.message));$('arenaOlder').onclick=()=>refreshHistory(true).catch(e=>status(e.message));
 function fit(){if(parent!==window)parent.postMessage({type:'barida-inline-height',height:Math.ceil(document.querySelector('main').getBoundingClientRect().height)+30},location.origin)}
 const poll=setInterval(async()=>{if(pollBusy||busy||document.hidden||(archive&&!active()))return;pollBusy=true;try{load(await rpc(current?.status==='active'?'get':'status',current?.status==='active'?{id:current.id}:{}))}catch(e){status(e.message)}finally{pollBusy=false}},2000),tick=setInterval(clock,200);
 window.addEventListener('pagehide',()=>{clearInterval(poll);clearInterval(tick);for(const p of pending.values())clearTimeout(p.timer)});window.addEventListener('resize',fit);
 draw();(async()=>{if(!archive)load(await rpc('status'));await refreshHistory();if(archive)status('Arşivden bir müsabaka seç. İlk konumdan son hamleye kadar inceleyebilirsin.')})().catch(e=>status(e.message));
})();
