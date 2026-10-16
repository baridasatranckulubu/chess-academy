/* Chess Academy v0.23 | Optional synthesized board sounds, no audio assets or network. */
(()=>{'use strict';
const KEY='chess-academy-sound';let enabled=true,ctx;
try{enabled=localStorage.getItem(KEY)!=='off'}catch{}
function play(type){if(!enabled)return;try{
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 ctx=ctx||new AC();if(ctx.state==='suspended')ctx.resume().catch(()=>{});
 const now=ctx.currentTime;
 const tones=type==='mate'?[[470,0,.12],[590,.12,.13],[720,.26,.20]]:type==='capture'?[[230,0,.065],[125,.06,.10]]:type==='flip'?[[350,0,.07],[470,.10,.08]]:type==='check'?[[500,0,.07],[390,.07,.10]]:[[330,0,.04],[235,.04,.055]];
 for(const [freq,offset,duration] of tones){const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type==='mate'?'sine':'triangle';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,now+offset);gain.gain.exponentialRampToValueAtTime(.045,now+offset+.009);gain.gain.exponentialRampToValueAtTime(.0001,now+offset+duration);osc.connect(gain);gain.connect(ctx.destination);osc.start(now+offset);osc.stop(now+offset+duration+.01)}
}catch{}}
function refresh(){const el=document.getElementById('puzzleSound');if(!el)return;const t=window.ChessAcademyPuzzleI18n?.t;el.textContent=t?t(enabled?'soundOn':'soundOff'):(enabled?'🔊 Sound on':'🔇 Sound off');el.setAttribute('aria-pressed',String(enabled))}
const button=document.getElementById('puzzleSound');if(button)button.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem(KEY,enabled?'on':'off')}catch{}refresh();if(enabled)play('move')});
window.ChessAcademyPuzzleAudio={play,refresh,isEnabled:()=>enabled};refresh();
})();
