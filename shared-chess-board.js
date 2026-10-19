/* Shared Chess Academy board presentation for free play and homework */
(function(){'use strict';let soundEnabled=true,audioContext=null;try{soundEnabled=localStorage.getItem('chess-academy-sound')!=='off'}catch{};
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

function pieceSVG(symbol,piece){
 const white=piece===piece.toUpperCase();
 const fill=white?'#f8f5e9':'#252b35';
 const outline=white?'#343b46':'#e5e2d9';
 return '<svg class="piece-3d" viewBox="0 0 100 100" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet"><text x="50" y="50" dominant-baseline="central" text-anchor="middle" font-family="DejaVu Sans,Segoe UI Symbol,serif" font-size="80" font-weight="900" fill="'+fill+'" stroke="'+outline+'" stroke-width="2.4" stroke-linejoin="round" paint-order="stroke">'+symbol+'</text></svg>'
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
 root.querySelectorAll('.ca-board-annotations').forEach(el=>el.remove());const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 800 800');svg.setAttribute('class','ca-board-annotations');svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;filter:none!important;box-shadow:none!important;opacity:1';
 const xy=sq=>{const f='abcdefgh'.indexOf(sq[0]),rank=Number(sq[1]);return state.flipped?[(7-f)*100+50,(rank-1)*100+50]:[f*100+50,(8-rank)*100+50]};
 const el=(name,attrs)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));return n};
 for(const [sq,color] of state.marks){const [x,y]=xy(sq);svg.append(el('circle',{cx:x,cy:y,r:37,fill:'none',stroke:color,'stroke-width':5,opacity:.85}))}
 for(const {from,to,color} of state.arrows.values()){const [x1,y1]=xy(from),[x2,y2]=xy(to),dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,ex=x2-ux*25,ey=y2-uy*25,px=-uy,py=ux;svg.append(el('line',{x1,y1,x2:ex,y2:ey,stroke:color,'stroke-width':8,'stroke-linecap':'round',opacity:.87}));svg.append(el('polygon',{points:[x2+','+y2,(ex-ux*15+px*13)+','+(ey-uy*15+py*13),(ex-ux*15-px*13)+','+(ey-uy*15-py*13)].join(' '),fill:color,opacity:.92}))}
 root.append(svg)
}
function renderBoard(opts){const {root,game,flipped=false,selected=null,lastMove=null,onSquare}=opts;root.replaceChildren();const valid=selected?new Set(game.moves({square:selected}).map(m=>m.to)):new Set();for(let i=0;i<64;i++){const index=flipped?63-i:i;const sq='abcdefgh'[index%8]+String(8-Math.floor(index/8));const p=game.at(sq),button=document.createElement('button');button.type='button';button.dataset.square=sq;button.className='sq '+((Math.floor(i/8)+i%8)%2?'dark':'light')+(selected===sq?' selected':'')+(valid.has(sq)?' target':'')+(lastMove&&(lastMove.from===sq||lastMove.to===sq)?' last-move':'');button.setAttribute('aria-label',sq+' '+(p||'empty'));button.setAttribute('aria-pressed',String(selected===sq));if(p){const piece=document.createElement('span');piece.className='piece ca-canonical-piece '+(p===p.toUpperCase()?'w':'b');piece.style.cssText='display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-width:0;min-height:0;pointer-events:none';piece.innerHTML=pieceSVG(({K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'})[p],p);button.append(piece)}button.addEventListener('click',()=>onSquare(sq));root.append(button)}boardAnnotations(root,flipped)}
function bindDrag(root,{canDrag,onDrop}){let origin=null,ghost=null,suppress=false;const clear=()=>{origin=null;ghost?.remove();ghost=null;root.querySelectorAll('.drag-source,.drag-target').forEach(el=>el.classList.remove('drag-source','drag-target'))};root.addEventListener('pointerdown',e=>{if(e.button!==0)return;const sq=e.target.closest('.sq');if(!sq||!root.contains(sq)||!canDrag(sq.dataset.square))return;origin={sq:sq.dataset.square,x:e.clientX,y:e.clientY,moved:false,pointerId:e.pointerId}});root.addEventListener('pointermove',e=>{if(!origin||origin.pointerId!==e.pointerId)return;if(!origin.moved&&Math.hypot(e.clientX-origin.x,e.clientY-origin.y)<8)return;if(!origin.moved){origin.moved=true;const source=[...root.children].find(x=>x.dataset.square===origin.sq);source?.classList.add('drag-source');ghost=document.createElement('div');ghost.className='ca-drag-ghost';ghost.innerHTML=source?.querySelector('.piece')?.innerHTML||'';const width=source?.getBoundingClientRect().width||64;ghost.style.cssText='position:fixed;z-index:99999;pointer-events:none;width:'+width+'px;height:'+width+'px;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;opacity:.95';document.body.append(ghost)}if(ghost){ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px'}root.querySelectorAll('.drag-target').forEach(x=>x.classList.remove('drag-target'));const dest=document.elementFromPoint(e.clientX,e.clientY)?.closest('.sq');if(dest&&root.contains(dest))dest.classList.add('drag-target')});root.addEventListener('pointerup',e=>{if(!origin)return;const old=origin;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.sq');const to=target&&root.contains(target)?target.dataset.square:null;clear();if(old.moved){suppress=true;setTimeout(()=>{suppress=false},180);if(to&&to!==old.sq)onDrop(old.sq,to)}});root.addEventListener('pointercancel',clear);return{consumeClick(){if(!suppress)return false;suppress=false;return true}}}
function choosePromotion(color='w'){return new Promise(resolve=>{const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;background:#0009;z-index:999999;display:grid;place-items:center';const panel=document.createElement('div');panel.style.cssText='background:#192438;color:white;padding:22px;border-radius:18px;box-shadow:0 15px 45px #0008;text-align:center;max-width:95vw';const heading=document.createElement('h3');heading.textContent='Piyon hangi taşa dönüşsün?';panel.append(heading);const choices=document.createElement('div');choices.style.cssText='display:flex;gap:12px;justify-content:center;flex-wrap:wrap';for(const [code,glyph] of [['q','♕'],['r','♖'],['b','♗'],['n','♘']]){const b=document.createElement('button');b.type='button';b.style.cssText='width:76px;height:85px;border-radius:12px;border:2px solid #bba47a;background:#f0dfc1;cursor:pointer';b.innerHTML=pieceSVG(color==='w'?glyph:({q:'♛',r:'♜',b:'♝',n:'♞'})[code],color==='w'?code.toUpperCase():code);b.onclick=()=>{overlay.remove();resolve(code)};choices.append(b)}panel.append(choices);const cancel=document.createElement('button');cancel.type='button';cancel.textContent='İptal';cancel.style.marginTop='15px';cancel.onclick=()=>{overlay.remove();resolve(null)};panel.append(cancel);overlay.append(panel);document.body.append(overlay)})}
window.ChessAcademySharedBoard={pieceSVG,sound,renderBoard,bindDrag,choosePromotion,setSoundEnabled(value){soundEnabled=!!value;try{localStorage.setItem('chess-academy-sound',soundEnabled?'on':'off')}catch{}},soundEnabled(){return soundEnabled}};
})();
