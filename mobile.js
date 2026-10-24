/* Native features are optional: the same site continues to work in a browser. */
(()=>{'use strict';
 const C=window.Capacitor,native=!!C?.isNativePlatform?.();
 const vault=native?(C.Plugins?.SecureLogin||C.registerPlugin?.('SecureLogin')):null;
 let savedRole='student';
 function message(text){let el=document.getElementById('mobileStatus');if(!el){el=document.createElement('p');el.id='mobileStatus';el.setAttribute('role','status');document.body.append(el)}el.textContent=text;el.hidden=!text;}
 function network(){message(navigator.onLine?'':'Çevrimdışısın. Giriş ve kayıt işlemleri için bağlantı gerekiyor. Açık çalışmalarını sürdürebilirsin.');}
 window.addEventListener('online',network);window.addEventListener('offline',network);network();
 if(native){document.documentElement.classList.add('barida-native');const App=C.Plugins?.App||C.registerPlugin?.('App');
  App.addListener('backButton',()=>{if(window.baridaHandleBack?.())return;App.minimizeApp();});
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
 document.addEventListener('DOMContentLoaded',()=>{
  const form=document.getElementById('authForm');if(!form)return;
  const saved=localStorage.getItem('barida-login-role');if(saved==='teacher')document.getElementById('authTeacherTab')?.click();
  if(native){
   restore();const nav=document.createElement('nav');nav.id='nativeBottomNav';nav.setAttribute('aria-label','Uygulama gezinmesi');
   for(const [icon,title,route] of [['⌂','Ana Sayfa','club-home'],['♞','Analiz','home'],['✓','Ödevler','assignments'],['↗','Rating','progress']]){
    const b=document.createElement('button');b.type='button';b.dataset.route=route;const span=document.createElement('span');span.textContent=icon;const label=document.createElement('small');label.textContent=title;b.append(span,label);b.onclick=()=>window.baridaNavigate?.(route);nav.append(b);
   }
   document.body.append(nav);const sync=()=>{nav.hidden=document.getElementById('app').hidden;document.documentElement.classList.toggle('native-signed-in',!nav.hidden)};
   new MutationObserver(sync).observe(document.getElementById('app'),{attributes:true,attributeFilter:['hidden']});sync();
   window.addEventListener('barida-section',e=>nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',b.dataset.route===e.detail?'page':'false')));
  }
 });
})();
