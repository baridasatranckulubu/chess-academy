/* Keep the custom-domain panel URL at the root; retain the public landing page. */
(()=>{'use strict';
 if(!['baridasatranc.com','www.baridasatranc.com'].includes(location.hostname))return;
 const key='barida-panel-route';
 const panel=!!document.querySelector('script[data-barida-panel]');
 const url=new URL(location.href);
 if(panel){
  try{sessionStorage.setItem(key,'panel')}catch{}
  url.pathname='/';history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  document.addEventListener('DOMContentLoaded',()=>{
   const button=document.getElementById('logout');if(!button)return;
   const original=button.onclick;
   button.onclick=async function(event){
    if(original)await original.call(this,event);
    try{sessionStorage.removeItem(key)}catch{}
    location.replace('/');
   };
  });
 }else{
  let active=false;try{active=sessionStorage.getItem(key)==='panel'}catch{}
  if(active&&url.pathname==='/'){
   document.documentElement.style.visibility='hidden';
   url.pathname='/academy';location.replace(url.href);
  }else if(url.pathname!=='/'){
   // An explicit visit to the public page also leaves the panel route.
   try{sessionStorage.removeItem(key)}catch{}
   url.pathname='/';history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  }
 }
})();
