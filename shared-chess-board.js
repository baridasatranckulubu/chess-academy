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
window.ChessAcademySharedBoard={pieceSVG,sound,setSoundEnabled(value){soundEnabled=!!value;try{localStorage.setItem('chess-academy-sound',soundEnabled?'on':'off')}catch{}},soundEnabled(){return soundEnabled}};
})();
