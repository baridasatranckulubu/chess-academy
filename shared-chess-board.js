/* Shared Chess Academy board presentation for free play and homework */
(function(){'use strict';let soundEnabled=true,audioContext=null;try{soundEnabled=localStorage.getItem('chess-academy-sound')!=='off'}catch{};
const volumeLevels=[.1,.3,.5,.7,1];let volumeLevel=3,masterGain=null;
function readVolume(){try{const value=Number(localStorage.getItem('chess-academy-volume'));if(Number.isInteger(value)&&value>=1&&value<=5)volumeLevel=value}catch{}return volumeLevel}
readVolume();
function syncVolume(){if(masterGain)masterGain.gain.value=soundEnabled?volumeLevels[readVolume()-1]:0}
function soundOutput(ctx){if(!masterGain){masterGain=ctx.createGain();masterGain.connect(ctx.destination)}syncVolume();return masterGain}
function setVolume(value){const level=Number(value);if(!Number.isInteger(level)||level<1||level>5)return;volumeLevel=level;try{localStorage.setItem('chess-academy-volume',String(level))}catch{}syncVolume();window.dispatchEvent?.(new CustomEvent('barida-volume-change',{detail:{level,percent:Math.round(volumeLevels[level-1]*100)}}))}
window.addEventListener?.('storage',e=>{if(e.key==='chess-academy-volume')syncVolume();if(e.key==='chess-academy-sound'){soundEnabled=e.newValue!=='off';syncVolume()}});
const soundScript=document.currentScript?.src||'',soundAssetBase=(soundScript?soundScript.slice(0,soundScript.lastIndexOf('/')+1):'')+'assets/sounds/lichess-sfx/';
const soundSamples={move:'Move',capture:'Capture',check:'Check',mate:'Victory',start:'GenericNotify'},soundBuffers=new Map();
function soundContext(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;audioContext=audioContext||new AC();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});return audioContext}
function loadSoundSample(name){if(!soundBuffers.has(name)){const ctx=soundContext();if(!ctx)return Promise.reject(Error('Audio unavailable'));const task=fetch(soundAssetBase+name+'.mp3').then(r=>{if(!r.ok)throw Error('Sound unavailable');return r.arrayBuffer()}).then(bytes=>ctx.decodeAudioData(bytes)).catch(e=>{soundBuffers.delete(name);throw e});soundBuffers.set(name,task)}return soundBuffers.get(name)}
function preloadSound(){if(!soundEnabled)return;try{if(!soundContext())return;for(const name of Object.values(soundSamples))loadSoundSample(name).catch(()=>{})}catch{}}
function clockSound(type){try{const ctx=soundContext();if(!ctx)return;const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.setValueAtTime(type==='tick'?2400:1600,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.022,t+.002);g.gain.exponentialRampToValueAtTime(.0001,t+.035);o.connect(g);g.connect(soundOutput(ctx));o.start(t);o.stop(t+.04)}catch{}}
function sound(type){if(!soundEnabled)return;if(type==='tick'||type==='tock'||type==='time'){clockSound(type==='time'?'tick':type);return}const name=soundSamples[type];if(!name){fallbackSound(type);return}try{const ctx=soundContext();if(!ctx)return;loadSoundSample(name).then(buffer=>{if(!soundEnabled)return;const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.value=type==='start'?.42:type==='mate'?.35:.55;source.connect(gain);gain.connect(soundOutput(ctx));source.start()}).catch(()=>fallbackSound(type))}catch{fallbackSound(type)}}
document.addEventListener?.('pointerdown',preloadSound,{once:true,passive:true});document.addEventListener?.('keydown',preloadSound,{once:true,passive:true});
function fallbackSound(type){
 if(!soundEnabled)return;
 try{
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  audioContext=audioContext||new AC();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
  const ctx=audioContext,t=ctx.currentTime,rate=ctx.sampleRate;
  // Short filtered wood-on-wood transient, not a musical beep.
  const strike=(delay,body,brightness,volume)=>{
   const duration=.085,len=Math.ceil(rate*duration),buffer=ctx.createBuffer(1,len,rate),data=buffer.getChannelData(0);
   let low=0;for(let i=0;i<len;i++){const sec=i/rate,env=Math.exp(-sec*62);low=low*.72+(Math.random()*2-1)*.28;data[i]=low*env}
   const src=ctx.createBufferSource();src.buffer=buffer;
   const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=brightness;
   const gain=ctx.createGain();gain.gain.value=volume;
   src.connect(filter);filter.connect(gain);gain.connect(soundOutput(ctx));
   src.start(t+delay);src.stop(t+delay+duration);
   const osc=ctx.createOscillator(),og=ctx.createGain();osc.type='sine';osc.frequency.value=body;
   og.gain.setValueAtTime(.0001,t+delay);og.gain.exponentialRampToValueAtTime(volume*.25,t+delay+.003);
   og.gain.exponentialRampToValueAtTime(.0001,t+delay+.075);
   osc.connect(og);og.connect(soundOutput(ctx));osc.start(t+delay);osc.stop(t+delay+.08);
  };
  if(type==='time'){const osc=ctx.createOscillator(),g=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(880,t);osc.frequency.exponentialRampToValueAtTime(660,t+.08);g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.0001,t+.12);osc.connect(g);g.connect(soundOutput(ctx));osc.start(t);osc.stop(t+.13)}else if(type==='flip'){strike(0,185,1800,.17);strike(.1,130,1300,.15);strike(.22,210,2200,.12)}else if(type==='capture'){strike(0,155,3200,.38);strike(.035,95,1800,.24)}
  else if(type==='mate'){strike(0,175,1800,.28);strike(.11,140,1400,.25);strike(.25,105,1050,.28)}
  else if(type==='check'){strike(0,195,2300,.23);strike(.085,170,1700,.15)}
  else{strike(0,280,3500,.25);strike(.025,170,1900,.10)}
 }catch(e){/* Sound is optional. */}
}

const baridaPremiumShapes={"p":"<circle cx=\"50\" cy=\"23\" r=\"13\"/><path d=\"M43 37 Q35 50 35 64 L65 64 Q65 50 57 37 Z\"/><path d=\"M32 64 H68 Q75 67 76 75 H24 Q25 67 32 64 Z\"/><path d=\"M23 76 H77 Q81 80 78 84 H22 Q19 80 23 76 Z\"/>","r":"<path d=\"M25 18 H36 V28 H45 V18 H55 V28 H64 V18 H75 V38 H69 L65 66 H35 L31 38 H25 Z\"/><path d=\"M31 66 H69 L74 75 H26 Z\"/><path d=\"M23 76 H77 Q81 80 77 84 H23 Q19 80 23 76 Z\"/>","n":"<path d=\"M26 74 L33 61 L25 53 Q20 49 25 44 L34 36 L32 26 L43 17 L49 23 L56 14 L62 23 Q75 30 77 45 L72 55 L65 49 Q59 60 67 74 Z\"/><path d=\"M23 75 H76 Q80 80 76 84 H24 Q20 80 23 75 Z\"/><path class=\"piece-detail\" d=\"M31 52 Q42 54 51 45 M57 29 Q64 32 68 37\"/><circle class=\"piece-eye\" cx=\"49\" cy=\"33\" r=\"2.6\"/>","b":"<circle cx=\"50\" cy=\"14\" r=\"6.5\"/><path d=\"M48 21 C28 29 27 48 38 61 Q42 65 37 71 L63 71 Q58 65 62 61 C74 46 68 28 53 21 Z\"/><path d=\"M31 71 H69 Q77 74 77 80 Q75 85 67 85 H33 Q25 85 23 80 Q23 74 31 71 Z\"/><path class=\"bishop-slit\" d=\"M63 27 Q65 37 55 44 Q43 52 39 60\"/>","q":"<circle cx=\"18\" cy=\"27\" r=\"5\"/><circle cx=\"34\" cy=\"20\" r=\"5\"/><circle cx=\"50\" cy=\"16\" r=\"5\"/><circle cx=\"66\" cy=\"20\" r=\"5\"/><circle cx=\"82\" cy=\"27\" r=\"5\"/><path d=\"M19 34 L31 67 H69 L81 34 L66 47 L50 30 L34 47 Z\"/><path d=\"M29 67 H71 L75 76 H25 Z\"/><path d=\"M23 76 H77 Q81 80 77 84 H23 Q19 80 23 76 Z\"/>","k":"<path d=\"M47 10 H53 V19 H62 V25 H53 V35 H47 V25 H38 V19 H47 Z\"/><path d=\"M45 36 Q50 31 55 36 L58 43 Q70 38 77 50 Q79 61 69 68 H31 Q21 61 23 50 Q30 38 42 43 Z\"/><path d=\"M30 67 H70 L75 76 H25 Z\"/><path d=\"M23 76 H77 Q81 80 77 84 H23 Q19 80 23 76 Z\"/>"};
const baridaPieceMetrics={"white-queen.png":[56,14,444,483],"black-queen.png":[167,139,1087,1117],"black-knight.png":[44,32,1066,1349],"white-pawn.png":[121,86,995,1300],"black-rook.png":[42,25,177,195],"white-rook.png":[42,25,178,195],"black-king.png":[12,12,419,453],"black-bishop.png":[184,8,427,384],"white-knight.png":[62,30,1051,1353],"white-bishop.png":[461,24,1068,957],"black-pawn.png":[41,17,405,530],"white-king.png":[40,19,1155,1250]};
const baridaPieceOptics=new Map();
function baridaNormalizePiece(img){
 if(!img||!img.naturalWidth)return;
 const key=(img.currentSrc||img.src)+'|'+img.dataset.pieceType;
 let optical=baridaPieceOptics.get(key);
 if(!optical){
  try{
   const width=img.naturalWidth,height=img.naturalHeight;
   const asset=(img.currentSrc||img.src).split('/').pop().split('?')[0].replace(/\.webp$/,'.png');
   const known=baridaPieceMetrics[asset];
   let left,right,top,bottom;
   if(known){[left,top,right,bottom]=known;right--;bottom--;}
   else{
    const c=document.createElement('canvas');c.width=width;c.height=height;
    const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
    const pixels=ctx.getImageData(0,0,width,height).data;
    left=width;right=-1;top=height;bottom=-1;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>48){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
   }
   if(right<left)throw Error('Empty piece');
   const adjustment={bishop:1.02,knight:.98,rook:.98,pawn:.93*.98}[img.dataset.pieceType]||1;
   const target=.72*adjustment;
   // object-fit:contain uses the longer native dimension inside the square image box.
   const longest=Math.max(width,height),visibleH=(bottom-top+1)/longest;
   const scale=target/(.78*visibleH);
   const dx=((width-1)/2-(left+right)/2)/longest*100;
   const dy=((height-1)/2-(top+bottom)/2)/longest*100;
   // Scale the centering offset too, so the painted silhouette stays centered.
   optical='scale('+scale.toFixed(5)+') translate('+dx.toFixed(5)+'%,'+dy.toFixed(5)+'%)';
  }catch(e){optical='none'}
  baridaPieceOptics.set(key,optical);
 }
 img.style.setProperty('--barida-optical-transform',optical);
}
window.baridaNormalizePiece=baridaNormalizePiece;
let baridaPremiumPieceId=0;
function pieceSVG(symbol,piece){
 if(!/^[KQRBNPkqrbnp]$/.test(piece))return '';
 const white=piece===piece.toUpperCase();
 const names={k:'king',q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'};
 const pieceName=names[piece.toLowerCase()];
 const pieceScale='var(--barida-optical-transform,none)';
 const path='assets/barida-pieces/'+(white?'white':'black')+'-'+names[piece.toLowerCase()]+'.webp?v=20261024-optical-v8';
 return '<img onload="window.baridaNormalizePiece(this)" data-piece-type="'+pieceName+'" class="piece-3d barida-approved-piece '+(white?'white':'black')+'" src="'+path+'" alt="" draggable="false" decoding="async" loading="eager" style="display:block!important;width:78%!important;height:78%!important;max-width:78%!important;max-height:78%!important;flex:0 0 78%!important;margin:0!important;object-fit:contain!important;object-position:center!important;transform-origin:center center!important;transform:'+pieceScale+'!important;pointer-events:none;user-select:none" />';
}
const annotationState=new WeakMap();
function boardAnnotations(root,flipped){
 let state=annotationState.get(root);
 if(!state){
  state={marks:new Map(),arrows:new Map(),from:null,flipped,color:'#e8a92f'};
  annotationState.set(root,state);
  root.addEventListener('contextmenu',e=>{if(e.target.closest('.sq'))e.preventDefault()});
  root.addEventListener('pointerdown',e=>{if(e.button===0){if(state.marks.size||state.arrows.size){state.marks.clear();state.arrows.clear();drawAnnotations(root,state)}return}if(e.button!==2)return;const sq=e.target.closest('.sq');if(!sq||!root.contains(sq))return;e.preventDefault();state.from=sq.dataset.square;state.color=e.ctrlKey?'#3485e5':e.altKey?'#3fae5b':'#e8a92f'});
  root.addEventListener('pointerup',e=>{if(e.button!==2||!state.from)return;e.preventDefault();const from=state.from;state.from=null;const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('.sq');const to=hit&&root.contains(hit)?hit.dataset.square:from;const color=e.ctrlKey?'#3485e5':e.altKey?'#3fae5b':state.color;if(from===to){state.marks.get(from)===color?state.marks.delete(from):state.marks.set(from,color)}else{const key=from+'-'+to;state.arrows.get(key)?.color===color?state.arrows.delete(key):state.arrows.set(key,{from,to,color})}drawAnnotations(root,state)});
 }
 state.flipped=flipped;drawAnnotations(root,state)
}
function drawAnnotations(root,state){
 root.querySelectorAll('.ca-board-annotations').forEach(el=>el.remove());const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 800 800');svg.setAttribute('class','ca-board-annotations');svg.setAttribute('aria-hidden','true');svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;filter:none!important;box-shadow:none!important;opacity:1;transform:none!important';
 const xy=sq=>{const f='abcdefgh'.indexOf(sq[0]),rank=Number(sq[1]);return state.flipped?[(7-f)*100+50,(rank-1)*100+50]:[f*100+50,(8-rank)*100+50]};
 const el=(name,attrs)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));return n};
 for(const [sq,color] of state.marks){const [x,y]=xy(sq);svg.append(el('circle',{cx:x,cy:y,r:46.5,fill:'none',stroke:color,'stroke-width':4,opacity:1}))}
 for(const {from,to,color} of state.arrows.values()){const [x1,y1]=xy(from),[x2,y2]=xy(to),dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,ex=x2-ux*25,ey=y2-uy*25,px=-uy,py=ux;svg.append(el('line',{x1,y1,x2:ex,y2:ey,stroke:color,'stroke-width':7,'stroke-linecap':'round',opacity:1}));svg.append(el('polygon',{points:[x2+','+y2,(ex-ux*15+px*13)+','+(ey-uy*15+py*13),(ex-ux*15-px*13)+','+(ey-uy*15-py*13)].join(' '),fill:color,opacity:1}))}
 root.append(svg)
}
function renderBoard(opts){
 const {root,game,flipped=false,selected=null,lastMove=null,onSquare}=opts;
 const recorded=Array.isArray(game?.history)&&game.history.length?game.history[game.history.length-1]?.move:null;
 const moveSquares=recorded?.from&&recorded?.to?recorded:lastMove;
 const valid=selected?new Set(game.moves({square:selected}).map(m=>m.to)):new Set();
 const existing=new Map(Array.from(root.children).filter(el=>el.classList.contains('sq')).map(el=>[el.dataset.square,el]));
 for(let i=0;i<64;i++){
  const index=flipped?63-i:i,sq='abcdefgh'[index%8]+String(8-Math.floor(index/8)),p=game.at(sq)||'';
  let button=existing.get(sq);if(!button){button=document.createElement('button');button.type='button';button.dataset.square=sq}
  button.className='sq '+((Math.floor(i/8)+i%8)%2?'dark':'light')+(selected===sq?' selected':'')+(valid.has(sq)?' target':'')+(moveSquares&&(moveSquares.from===sq||moveSquares.to===sq)?' last-move':'');
  button.setAttribute('aria-label',sq+' '+(p||'empty'));button.setAttribute('aria-pressed',String(selected===sq));
  if(button.dataset.piece!==p){
   button.replaceChildren();button.dataset.piece=p;
   if(p){const piece=document.createElement('span');piece.className='piece ca-canonical-piece '+(p===p.toUpperCase()?'w':'b');piece.style.cssText='display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-width:0;min-height:0;pointer-events:none';piece.innerHTML=pieceSVG('',p);button.append(piece)}
  }
  button.onclick=()=>onSquare(sq);
  if(root.children[i]!==button)root.insertBefore(button,root.children[i]||null);
 }
 boardAnnotations(root,flipped)
}
function bindDrag(root,{canDrag,onDrop}){let origin=null,ghost=null,suppress=false;const clear=()=>{origin=null;ghost?.remove();ghost=null;root.querySelectorAll('.drag-source,.drag-target').forEach(el=>el.classList.remove('drag-source','drag-target'))};root.addEventListener('pointerdown',e=>{if(e.button!==0)return;const sq=e.target.closest('.sq');if(!sq||!root.contains(sq)||!canDrag(sq.dataset.square))return;origin={sq:sq.dataset.square,x:e.clientX,y:e.clientY,moved:false,pointerId:e.pointerId}});root.addEventListener('pointermove',e=>{if(!origin||origin.pointerId!==e.pointerId)return;if(!origin.moved&&Math.hypot(e.clientX-origin.x,e.clientY-origin.y)<8)return;if(!origin.moved){origin.moved=true;const source=[...root.children].find(x=>x.dataset.square===origin.sq);source?.classList.add('drag-source');ghost=document.createElement('div');ghost.className='ca-drag-ghost';ghost.innerHTML=source?.querySelector('.piece')?.innerHTML||'';ghost.classList.add('ca-piece-drag-preview');const width=source?.getBoundingClientRect().width||64;ghost.style.cssText='position:fixed;z-index:99999;pointer-events:none;width:'+width+'px;height:'+width+'px;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;opacity:.95';document.body.append(ghost)}if(ghost){ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px'}root.querySelectorAll('.drag-target').forEach(x=>x.classList.remove('drag-target'));const dest=document.elementFromPoint(e.clientX,e.clientY)?.closest('.sq');if(dest&&root.contains(dest))dest.classList.add('drag-target')});root.addEventListener('pointerup',e=>{if(!origin)return;const old=origin;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.sq');const to=target&&root.contains(target)?target.dataset.square:null;clear();if(old.moved){suppress=true;setTimeout(()=>{suppress=false},180);if(to&&to!==old.sq)onDrop(old.sq,to)}});root.addEventListener('pointercancel',clear);return{consumeClick(){if(!suppress)return false;suppress=false;return true}}}
function choosePromotion(color='w'){return new Promise(resolve=>{
 const board=document.getElementById('board');
 const overlay=document.createElement('div');overlay.className='barida-promotion-overlay';
 const panel=document.createElement('div');panel.className='barida-promotion-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Piyon terfisi');
 const heading=document.createElement('h3');heading.textContent='Piyonunu terfi ettir';panel.append(heading);
 const subtitle=document.createElement('p');subtitle.textContent='Dönüşeceği taşı seçerek oyuna devam et.';panel.append(subtitle);
 const choices=document.createElement('div');choices.className='barida-promotion-choices';
 const labels={q:'Vezir',r:'Kale',b:'Fil',n:'At'};
 let done=false;
 const finish=value=>{if(done)return;done=true;window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);document.removeEventListener('keydown',keyHandler,true);overlay.remove();resolve(value)};
 for(const [code,glyph] of [['q','♕'],['r','♖'],['b','♗'],['n','♘']]){
  const btn=document.createElement('button');btn.type='button';btn.className='barida-promotion-choice';btn.setAttribute('aria-label',labels[code]);btn.innerHTML=pieceSVG(color==='w'?glyph:({q:'♛',r:'♜',b:'♝',n:'♞'})[code],color==='w'?code.toUpperCase():code);
  const caption=document.createElement('span');caption.textContent=labels[code];btn.append(caption);btn.addEventListener('click',()=>finish(code));choices.append(btn);
 }
 panel.append(choices);
 const cancel=document.createElement('button');cancel.type='button';cancel.className='barida-promotion-cancel';cancel.textContent='İptal';cancel.addEventListener('click',()=>finish(null));panel.append(cancel);overlay.append(panel);
 const place=()=>{const r=board?.getBoundingClientRect();if(!r)return;overlay.style.left=r.left+'px';overlay.style.top=r.top+'px';overlay.style.width=r.width+'px';overlay.style.height=r.height+'px'};
 const keyHandler=e=>{if(e.key==='Escape'){e.preventDefault();finish(null)}else if(e.key==='Tab'){const focusable=[...panel.querySelectorAll('button')];const i=focusable.indexOf(document.activeElement);if(e.shiftKey&&i===0){e.preventDefault();focusable.at(-1).focus()}else if(!e.shiftKey&&i===focusable.length-1){e.preventDefault();focusable[0].focus()}}};
 if(!document.getElementById('barida-promotion-style-v3')){const style=document.createElement('style');style.id='barida-promotion-style-v3';style.textContent=`
 .barida-promotion-overlay{position:fixed;z-index:2147483640;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:clamp(8px,2vw,18px);background:rgba(6,15,22,.43);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);border-radius:8px;overflow:hidden}
 .barida-promotion-panel{width:min(100%,460px);max-height:100%;overflow:auto;box-sizing:border-box;background:linear-gradient(150deg,#1c3344,#10212f);border:1px solid #a9c8b9;border-radius:18px;padding:clamp(12px,2.5vw,23px);box-shadow:0 16px 55px #000a;text-align:center;color:#f5faff;font-family:inherit}
 .barida-promotion-panel h3{margin:0 0 5px;font-size:clamp(17px,2.5vw,23px);color:#fff}.barida-promotion-panel p{margin:0 0 15px;font-size:13px;color:#c1d5df}
 .barida-promotion-choices{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(5px,1vw,10px)}
 .barida-promotion-choice{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:0;padding:7px 3px;border:2px solid #b99a63;border-radius:11px;background:#ead4af;color:#2a241c;cursor:pointer;transition:transform .12s,border-color .12s}
 .barida-promotion-choice:hover,.barida-promotion-choice:focus-visible{transform:translateY(-3px);border-color:#49d69a;outline:2px solid #49d69a;outline-offset:1px}
 .barida-promotion-choice svg{display:block;max-width:100%;width:clamp(36px,5.5vw,66px);height:clamp(38px,6vw,70px)}
 .barida-promotion-choice span{font-size:12px;font-weight:800}
 .barida-promotion-cancel{margin-top:13px;background:transparent;color:#dbe6ee;border:1px solid #587081;border-radius:8px;padding:7px 20px;cursor:pointer}
 `;document.head.append(style)}
 document.body.append(overlay);place();window.addEventListener('resize',place);window.addEventListener('scroll',place,true);document.addEventListener('keydown',keyHandler,true);choices.querySelector('button')?.focus();
})}
/* Stable outlines on board and while dragging: SVG text must not inherit page-level fill/stroke overrides. */
(function installPieceContrast(){if(document.getElementById('barida-piece-contrast-v8'))return;const st=document.createElement('style');st.id='barida-piece-contrast-v8';st.textContent=`
.ca-grid .board .sq .piece svg.piece-3d,.ca-drag-ghost svg.piece-3d{display:block!important;width:90%!important;height:90%!important;overflow:visible!important;filter:drop-shadow(0 2px 1px #0008)!important}
.ca-grid .board .sq .piece svg.piece-3d text,.ca-drag-ghost svg.piece-3d text{paint-order:stroke fill!important;stroke-linejoin:round!important;stroke-opacity:1!important;fill-opacity:1!important;font-family:"DejaVu Sans","Segoe UI Symbol","Noto Sans Symbols 2",serif!important}
.ca-drag-ghost{isolation:isolate!important;filter:none!important;opacity:1!important}
.ca-drag-ghost svg.piece-3d{width:100%!important;height:100%!important;transform:none!important}
.ca-drag-ghost svg.piece-3d text{font-size:82px!important;font-weight:900!important}
`;document.head.append(st)})();
window.ChessAcademySharedBoard={pieceSVG,sound,preloadSound,renderBoard,bindDrag,choosePromotion,setVolume,volumeLevel:readVolume,volumePercent(){return Math.round(volumeLevels[readVolume()-1]*100)},setSoundEnabled(value){soundEnabled=!!value;syncVolume();try{localStorage.setItem('chess-academy-sound',soundEnabled?'on':'off')}catch{}},soundEnabled(){return soundEnabled}};
})();

/* Soft mint move-trace on source and destination, placed behind all pieces. */
(function installMoveTraceStyle(){if(document.getElementById('barida-last-move-global-v2'))return;const style=document.createElement('style');style.id='barida-last-move-global-v2';style.textContent=`.board .sq.last-move,.ca-grid .board>.sq.last-move,.chess-board-frame .board .sq.last-move{position:relative!important;isolation:isolate!important;box-shadow:inset 0 0 0 999px rgba(33,153,83,.45),inset 0 0 0 1px rgba(80,207,125,.48)!important}.board .sq.last-move::after{pointer-events:none}.board .sq.last-move .piece,.board .sq.last-move .piece-3d{position:relative!important;z-index:2!important}.board .sq.last-move.selected{box-shadow:inset 0 0 0 999px rgba(33,153,83,.42),inset 0 0 0 3px #e9ca75!important}`;document.head.append(style)})();

