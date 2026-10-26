/* Native shell and website share the same deployed pages and application code. */
(()=>{'use strict';
 const C=window.Capacitor;if(!C?.isNativePlatform?.()||location.origin!=='https://baridasatranc.pages.dev')return;
 let revision=document.querySelector('meta[name="barida-revision"]')?.content||null,busy=false,last=0,update=null;
 function offer(next){
  update=next;if(document.getElementById('baridaLiveUpdate'))return;
  const box=document.createElement('aside');box.id='baridaLiveUpdate';box.setAttribute('role','status');
  box.style.cssText='position:fixed;left:12px;right:12px;top:calc(env(safe-area-inset-top,0px) + 8px);z-index:20000;padding:14px;border:1px solid #ef80b4;border-radius:14px;background:#103c2e;color:#fff;box-shadow:0 8px 30px #0008;display:flex;align-items:center;gap:12px;flex-wrap:wrap;font:15px system-ui';
  const text=document.createElement('span');text.textContent='Yeni güncelleme hazır. Çalışmanı tamamladıktan sonra yenileyebilirsin.';text.style.flex='1';
  const button=document.createElement('button');button.type='button';button.textContent='Güncellemeyi aç';button.style.cssText='padding:10px 14px;border:0;border-radius:10px;background:#ef80b4;color:#181018;font-weight:750';button.onclick=()=>location.reload();box.append(text,button);document.body.append(box);
 }
 async function check(force=false){
  if(busy||document.hidden||window.BaridaAppActive===false||!navigator.onLine||(!force&&Date.now()-last<60000))return;
  busy=true;last=Date.now();try{
   const r=await fetch('/site-version.json',{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)return;
   const data=await r.json();if(!/^[0-9a-f]{40}$/.test(data.revision||''))return;
   if(!revision)revision=data.revision;else if(data.revision!==revision)offer(data.revision);
  }catch{/* Offline use never interrupts an open study. */}finally{busy=false}
 }
 window.BaridaLiveUpdates={check,available:()=>update};
 for(const event of ['online','barida-app-state'])window.addEventListener(event,()=>check(true));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
 setInterval(check,120000);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>check());else check();
})();
