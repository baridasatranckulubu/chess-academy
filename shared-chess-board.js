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
const annotationState=new WeakMap();
function boardAnnotations(root,flipped){
 let state=annotationState.get(root);
 if(!state){
  state={marks:new Set(),arrows:new Map(),from:null,flipped};
  annotationState.set(root,state);
  root.addEventListener('contextmenu',e=>{if(e.target.closest('.sq'))e.preventDefault()});
  root.addEventListener('pointerdown',e=>{if(e.button!==2)return;const square=e.target.closest('.sq');if(!square||!root.contains(square))return;e.preventDefault();state.from=square.dataset.square});
  root.addEventListener('pointerup',e=>{
   if(e.button!==2||!state.from)return;e.preventDefault();
   const from=state.from;state.from=null;
   const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('.sq');
   const to=hit&&root.contains(hit)?hit.dataset.square:from;
   if(from===to){state.marks.has(from)?state.marks.delete(from):state.marks.add(from)}
   else{const key=from+'-'+to;state.arrows.has(key)?state.arrows.delete(key):state.arrows.set(key,[from,to])}
   drawAnnotations(root,state)
  });
 }
 state.flipped=flipped;drawAnnotations(root,state)
}
function drawAnnotations(root,state){
 root.querySelector('.ca-board-annotations')?.remove();
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 800 800');svg.setAttribute('class','ca-board-annotations');
 svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;overflow:visible';
 const xy=sq=>{const f='abcdefgh'.indexOf(sq[0]),rank=Number(sq[1]);return state.flipped?[(7-f)*100+50,(rank-1)*100+50]:[f*100+50,(8-rank)*100+50]};
 const element=(name,attrs)=>{const el=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));return el};
 for(const sq of state.marks){const [x,y]=xy(sq);svg.append(element('circle',{cx:x,cy:y,r:42,fill:'none',stroke:'#e8a92f','stroke-width':9,opacity:.85}))}
 for(const [from,to] of state.arrows.values()){
  const [x1,y1]=xy(from),[x2,y2]=xy(to),dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1;
  const ex=x2-dx/len*28,ey=y2-dy/len*28;
  svg.append(element('line',{x1,y1,x2:ex,y2:ey,stroke:'#e8a92f','stroke-width':15,'stroke-linecap':'round',opacity:.85}));
  const ux=dx/len,uy=dy/len,px=-uy,py=ux;
  svg.append(element('polygon',{points:[x2+','+y2,(ex-ux*20+px*20)+','+(ey-uy*20+py*20),(ex-ux*20-px*20)+','+(ey-uy*20-py*20)].join(' '),fill:'#e8a92f',opacity:.9}))
 }
 root.append(svg)
}
function renderBoard(opts){const {root,game,flipped=false,selected=null,lastMove=null,onSquare}=opts;root.replaceChildren();const valid=selected?new Set(game.moves({square:selected}).map(m=>m.to)):new Set();for(let i=0;i<64;i++){const index=flipped?63-i:i;const sq='abcdefgh'[index%8]+String(8-Math.floor(index/8));const p=game.at(sq),button=document.createElement('button');button.type='button';button.dataset.square=sq;button.className='sq '+((Math.floor(i/8)+i%8)%2?'dark':'light')+(selected===sq?' selected':'')+(valid.has(sq)?' target':'')+(lastMove&&(lastMove.from===sq||lastMove.to===sq)?' last-move':'');button.setAttribute('aria-label',sq+' '+(p||'empty'));button.setAttribute('aria-pressed',String(selected===sq));if(p){const piece=document.createElement('span');piece.className='piece ca-canonical-piece '+(p===p.toUpperCase()?'w':'b');piece.style.cssText='display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-width:0;min-height:0;pointer-events:none';piece.innerHTML=pieceSVG(({K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'})[p],p);button.append(piece)}button.addEventListener('click',()=>onSquare(sq));root.append(button)}boardAnnotations(root,flipped)}
function bindDrag(root,{canDrag,onDrop}){let origin=null,ghost=null,suppress=false;const clear=()=>{origin=null;ghost?.remove();ghost=null;root.querySelectorAll('.drag-source,.drag-target').forEach(el=>el.classList.remove('drag-source','drag-target'))};root.addEventListener('pointerdown',e=>{if(e.button!==0)return;const sq=e.target.closest('.sq');if(!sq||!root.contains(sq)||!canDrag(sq.dataset.square))return;origin={sq:sq.dataset.square,x:e.clientX,y:e.clientY,moved:false,pointerId:e.pointerId}});root.addEventListener('pointermove',e=>{if(!origin||origin.pointerId!==e.pointerId)return;if(!origin.moved&&Math.hypot(e.clientX-origin.x,e.clientY-origin.y)<8)return;if(!origin.moved){origin.moved=true;const source=[...root.children].find(x=>x.dataset.square===origin.sq);source?.classList.add('drag-source');ghost=document.createElement('div');ghost.className='ca-drag-ghost';ghost.innerHTML=source?.querySelector('.piece')?.innerHTML||'';document.body.append(ghost)}if(ghost){ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px'}root.querySelectorAll('.drag-target').forEach(x=>x.classList.remove('drag-target'));const dest=document.elementFromPoint(e.clientX,e.clientY)?.closest('.sq');if(dest&&root.contains(dest))dest.classList.add('drag-target')});root.addEventListener('pointerup',e=>{if(!origin)return;const old=origin;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.sq');const to=target&&root.contains(target)?target.dataset.square:null;clear();if(old.moved){suppress=true;setTimeout(()=>{suppress=false},180);if(to&&to!==old.sq)onDrop(old.sq,to)}});root.addEventListener('pointercancel',clear);return{consumeClick(){if(!suppress)return false;suppress=false;return true}}}
window.ChessAcademySharedBoard={pieceSVG,sound,renderBoard,bindDrag,setSoundEnabled(value){soundEnabled=!!value;try{localStorage.setItem('chess-academy-sound',soundEnabled?'on':'off')}catch{}},soundEnabled(){return soundEnabled}};
})();
