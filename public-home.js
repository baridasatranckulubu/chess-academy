(()=>{'use strict';const toggle=document.getElementById('menuToggle'),nav=document.getElementById('publicNav');function menu(open){toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Menüyü kapat':'Menüyü aç');nav.dataset.open=String(open)}toggle.onclick=()=>menu(toggle.getAttribute('aria-expanded')!=='true');nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu(false)));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){menu(false);toggle.focus()}});document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))menu(false)});
const video=document.getElementById('robotVideo'),button=document.getElementById('videoToggle'),reduced=matchMedia('(prefers-reduced-motion: reduce)');let pausedByUser=false;function sync(){const playing=!video.paused;button.setAttribute('aria-pressed',String(playing));button.setAttribute('aria-label',playing?'Tanıtım videosunu duraklat':'Tanıtım videosunu oynat');button.firstElementChild.textContent=playing?'Ⅱ':'▶'}button.onclick=()=>{if(video.paused){pausedByUser=false;video.play().catch(()=>{})}else{pausedByUser=true;video.pause()}};video.addEventListener('play',sync);video.addEventListener('pause',sync);video.addEventListener('error',()=>{video.hidden=true;video.parentElement.style.backgroundImage='url(assets/club/chess-robot.webp)';video.parentElement.style.backgroundSize='contain';video.parentElement.style.backgroundPosition='center';video.parentElement.style.backgroundRepeat='no-repeat';button.hidden=true});if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting&&!reduced.matches&&!pausedByUser)video.play().catch(()=>{});else video.pause()}},{threshold:.3});observer.observe(video)}reduced.addEventListener?.('change',e=>{if(e.matches)video.pause()});sync();
})();

(()=>{'use strict';
const toggle=document.getElementById('clubMessageToggle'),panel=document.getElementById('clubMessagePanel'),close=document.getElementById('closeClubMessage');
if(toggle&&panel){
 const setOpen=(open,restoreFocus=false)=>{panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Mesaj penceresini kapat':'Kulübe mesaj gönder');if(open)close?.focus();else if(restoreFocus)toggle.focus()};
 toggle.addEventListener('click',()=>setOpen(panel.hidden));
 close?.addEventListener('click',()=>setOpen(false,true));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();setOpen(false,true)}});
 document.addEventListener('click',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!toggle.contains(e.target))setOpen(false)});
}
const copy=document.getElementById('copyClubAddress'),feedback=document.getElementById('addressCopyStatus');
copy?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText('İstiklal Mahallesi, Doğan Kımıllı Caddesi No: 1, Merkez / Isparta (Tren Garı’nın karşı köşesi)');feedback.textContent='Adres kopyalandı.'}catch{feedback.textContent='Adres kopyalanamadı; yukarıdaki adresi seçebilirsiniz.'}});
})();
