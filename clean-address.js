/* Keep the custom-domain panel URL at the root; retain the public landing page. */
(()=>{'use strict';
 const key='barida-panel-route';
 const panel=!!document.querySelector('script[data-barida-panel]');
 const custom=['baridasatranc.com','www.baridasatranc.com'].includes(location.hostname);
 if(panel)document.addEventListener('DOMContentLoaded',()=>{
  const button=document.getElementById('logout');if(!button)return;
  const original=button.onclick;
  button.onclick=async function(event){
   if(original)await original.call(this,event);
   try{sessionStorage.removeItem(key)}catch{}
   location.replace(custom?'/':'index.html');
  };
 });
 if(!custom)return;
 const url=new URL(location.href);
 if(panel){
  try{sessionStorage.setItem(key,'panel')}catch{}
  url.pathname='/';history.replaceState(history.state,'',url.pathname+url.search+url.hash);
 }else{
  let active=false;try{active=sessionStorage.getItem(key)==='panel'}catch{}
  const reload=typeof performance!=='undefined'&&performance.getEntriesByType?.('navigation')?.[0]?.type==='reload';
  if(active&&reload&&url.pathname==='/'&&!url.hash){
   document.documentElement.style.visibility='hidden';
   url.pathname='/academy';location.replace(url.href);
  }else{
   try{sessionStorage.removeItem(key)}catch{}
   url.pathname='/';history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  }
 }
})();
