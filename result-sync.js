/* One durable outbox per account. The server deduplicates each source/item. */
(()=>{'use strict';
 const pending=new Map();let flushing=false;
 window.BaridaResultSync={async push(client,user,source,item,success,onSync){const key='barida-result-outbox:'+user;
  let stored=[];try{stored=JSON.parse(localStorage.getItem(key)||'[]')}catch{}
  const id=source+':'+item;if(!stored.some(x=>x.source+':'+x.item===id))stored.push({source,item,success});stored=stored.slice(-500);localStorage.setItem(key,JSON.stringify(stored));
  pending.set(key,{client,user,onSync});await flush(key);
 },async resume(client,user,onSync){const key='barida-result-outbox:'+user;pending.set(key,{client,user,onSync});await flush(key)}};
 async function flush(key){if(flushing)return;const config=pending.get(key);if(!config)return;flushing=true;try{
  let items;try{items=JSON.parse(localStorage.getItem(key)||'[]')}catch{items=[]}
  let sent=0;while(items.length){const {data}=await config.client.auth.getSession();if(data?.session?.user?.id!==config.user)break;const item=items[0];const {error}=await config.client.rpc('academy_record_training',{p_source:item.source,p_item:item.item,p_success:item.success});if(error)throw error;
   // Re-read after the request so a newly queued result cannot be overwritten.
   items=JSON.parse(localStorage.getItem(key)||'[]').filter(x=>!(x.source===item.source&&x.item===item.item));localStorage.setItem(key,JSON.stringify(items));if(++sent%10===0)await config.onSync?.();
  }await config.onSync?.();
 }catch(e){window.dispatchEvent(new CustomEvent('barida-result-sync-error',{detail:e.message}))}finally{flushing=false}}
 window.addEventListener('online',()=>{for(const key of pending.keys())flush(key)});
 setInterval(()=>{if(navigator.onLine)for(const key of pending.keys()){try{if(JSON.parse(localStorage.getItem(key)||'[]').length)flush(key)}catch{}}},15000);
})();
