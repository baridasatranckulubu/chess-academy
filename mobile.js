/* Native features are optional: the same site continues to work in a browser. */
(()=>{'use strict';
 const C=window.Capacitor,native=!!C?.isNativePlatform?.();
 const vault=native?(C.Plugins?.SecureLogin||C.registerPlugin?.('SecureLogin')):null;
 let savedRole='student';
 function message(text){let el=document.getElementById('mobileStatus');if(!el){el=document.createElement('p');el.id='mobileStatus';el.setAttribute('role','status');document.body.append(el)}el.textContent=text;el.hidden=!text;}
 function network(){message(navigator.onLine?'':'Çevrimdışısın. Giriş ve kayıt işlemleri için bağlantı gerekiyor. Açık çalışmalarını sürdürebilirsin.');}
 window.addEventListener('online',network);window.addEventListener('offline',network);network();
 if(native){document.documentElement.classList.add('barida-native');const App=C.Plugins?.App||C.registerPlugin?.('App');
  App.addListener('appStateChange',({isActive})=>window.BaridaSiteTime?.setAppActive(isActive));
  App.addListener('backButton',()=>{if(window.baridaHandleBack?.())return;if(location.pathname.endsWith('academy.html')){location.href='index.html';return}App.minimizeApp();});
 }
 async function restore(explicit=false){
  try{
   let item;
   if(vault)item=await vault.load();
   else if(explicit&&navigator.credentials&&window.PasswordCredential)item=await navigator.credentials.get({password:true,mediation:'optional'});
   if(!item)return false;
   const identity=item.identity||item.id,password=item.password;
   if(!identity||!password)return false;
   savedRole=item.role||localStorage.getItem('barida-login-role')||'student';
   document.getElementById(savedRole==='teacher'?'authTeacherTab':'authLoginTab')?.click();
   document.getElementById('authEmail').value=identity;document.getElementById('authPassword').value=password;document.getElementById('authRemember').checked=true;
   return true;
  }catch{return false;}
 }
 window.BaridaLoginMemory={
  async save(identity,password,role){
   savedRole=role||'student';localStorage.setItem('chess-academy-identity',identity);localStorage.setItem('barida-login-role',savedRole);
   if(vault){await vault.save({identity,password,role:savedRole});return true;}
   if(navigator.credentials&&window.PasswordCredential){await navigator.credentials.store(new PasswordCredential({id:identity,password,name:identity}));return true;}
   return false;
  },
  async clear(){localStorage.removeItem('chess-academy-identity');localStorage.removeItem('barida-login-role');if(vault)await vault.clear();},
  restore
 };
 let nativeUiScheduled=false;
 function refreshNativeUi(){
  if(!native)return;const app=document.getElementById('app');if(!app||app.hidden)return;
  const sidebar=document.getElementById('sidebar');if(sidebar){
   let top=document.getElementById('nativeTopNav');if(!top){top=document.createElement('nav');top.id='nativeTopNav';top.setAttribute('aria-label','Uygulama bölümleri');sidebar.before(top)}
   const groups=Array.from(sidebar.querySelectorAll('.nav-category')),signature=groups.map(g=>g.textContent).join('|');
   if(top.dataset.signature!==signature){top.dataset.signature=signature;top.replaceChildren();for(const group of groups){const title=group.querySelector('summary')?.textContent||'Menü',open=document.createElement('button');open.type='button';open.textContent=title;open.onclick=()=>{
    document.getElementById('nativeMenuDialog')?.remove();const dialog=document.createElement('dialog');dialog.id='nativeMenuDialog';const header=document.createElement('header'),heading=document.createElement('span'),close=document.createElement('button');heading.textContent=title;close.type='button';close.textContent='×';close.setAttribute('aria-label','Menüyü kapat');close.onclick=()=>dialog.close();header.append(heading,close);const items=document.createElement('div');items.className='native-menu-items';for(const target of group.querySelectorAll('button.navitem')){const b=document.createElement('button');b.type='button';b.textContent=target.textContent;b.onclick=()=>{dialog.close();target.click()};items.append(b)}dialog.append(header,items);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});document.body.append(dialog);dialog.showModal();
   };top.append(open)}}
  }
  if(document.getElementById('club-title')&&!document.getElementById('nativeQuickActions')){
   const section=document.createElement('section');section.id='nativeQuickActions';section.setAttribute('aria-label','Hızlı erişim');for(const [icon,label,route] of [['♟','Analiz','home'],['◇','Bulmacalar','tactics'],['✓','Ödevler','assignments'],['↗','Rating','progress'],['⊞','Koordinat Avı','coordinates'],['◷','Gelişimim','pet-home']]){const b=document.createElement('button');b.type='button';const i=document.createElement('span');i.textContent=icon;b.append(i,document.createTextNode(label));b.onclick=()=>window.baridaNavigate?.(route);section.append(b)}document.getElementById('club-title').after(section);
  }
 }
 function queueNativeUi(){if(nativeUiScheduled)return;nativeUiScheduled=true;requestAnimationFrame(()=>{nativeUiScheduled=false;refreshNativeUi()})}
 document.addEventListener('DOMContentLoaded',()=>{
  if(native&&document.getElementById('hero-title')){const links=document.createElement('nav');links.id='nativePublicShortcuts';links.setAttribute('aria-label','Kulüp kısayolları');for(const [title,url] of [['Sporcu / Antrenör Girişi','academy.html'],['Kulübümüz','#biz-kimiz'],['İletişim','#iletisim']]){const a=document.createElement('a');a.textContent=title;a.href=url;links.append(a)}document.getElementById('hero-title').after(links);document.querySelectorAll('video').forEach(v=>{v.autoplay=false;v.preload='none'})}
  const form=document.getElementById('authForm');if(!form)return;
  const saved=localStorage.getItem('barida-login-role');if(saved==='teacher')document.getElementById('authTeacherTab')?.click();
  if(native){
   restore();const nav=document.createElement('nav');nav.id='nativeBottomNav';nav.setAttribute('aria-label','Uygulama gezinmesi');
   for(const [icon,title,route] of [['⌂','Ana Sayfa','club-home'],['♞','Analiz','home'],['✓','Ödevler','assignments'],['↗','Rating','progress']]){
    const b=document.createElement('button');b.type='button';b.dataset.route=route;const span=document.createElement('span');span.textContent=icon;const label=document.createElement('small');label.textContent=title;b.append(span,label);b.onclick=()=>window.baridaNavigate?.(route);nav.append(b);
   }
   document.body.append(nav);const sync=()=>{nav.hidden=document.getElementById('app').hidden;document.documentElement.classList.toggle('native-signed-in',!nav.hidden)};
   new MutationObserver(sync).observe(document.getElementById('app'),{attributes:true,attributeFilter:['hidden']});sync();
   window.addEventListener('barida-section',e=>{nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',b.dataset.route===e.detail?'page':'false'));queueNativeUi()});new MutationObserver(queueNativeUi).observe(document.getElementById('view'),{childList:true});new MutationObserver(queueNativeUi).observe(document.getElementById('app'),{attributes:true,attributeFilter:['hidden']});queueNativeUi();
  }
 });
})();

