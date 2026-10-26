/* One durable outbox per account. The server deduplicates each source/item. */
(()=>{'use strict';
 const pending=new Map(),flushing=new Map();let activeKey=null;
 const read=key=>{try{const rows=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(rows)?rows.filter(x=>x&&typeof x.source==='string'&&typeof x.item==='string'&&typeof x.success==='boolean'):[]}catch{return []}};
 function connect(key,config){if(activeKey!==key){pending.clear();activeKey=key}pending.set(key,config)}
 window.BaridaResultSync={async push(client,user,source,item,success,onSync,rating=1100,onRating){const key='barida-result-outbox:'+user;
  const stored=read(key);if(!stored.some(x=>x.source===source&&x.item===item))stored.push({source,item,success,rating});localStorage.setItem(key,JSON.stringify(stored));
  connect(key,{client,user,onSync,onRating});await flush(key);
 },async resume(client,user,onSync){const key='barida-result-outbox:'+user;connect(key,{client,user,onSync});await flush(key)},disconnect(){activeKey=null;pending.clear()}};
 function flush(key){
  if(flushing.has(key))return flushing.get(key);
  const config=pending.get(key);if(!config)return Promise.resolve();
  const current=()=>activeKey===key&&pending.get(key)===config;
  const task=(async()=>{try{
   let items=read(key),sent=0;
   while(items.length&&current()){
    const {data}=await config.client.auth.getSession();if(!current()||data?.session?.user?.id!==config.user)return;
    const item=items[0];const {data:result,error}=item.source==='puzzle'?await config.client.rpc('barida_puzzle_result',{p_item:item.item,p_success:item.success,p_rating:item.rating||1100}):await config.client.rpc('academy_record_training',{p_source:item.source,p_item:item.item,p_success:item.success});if(error)throw error;
    // Acknowledge only this result; preserve anything queued during the request.
    items=read(key).filter(x=>!(x.source===item.source&&x.item===item.item));localStorage.setItem(key,JSON.stringify(items));
    if(!current())return;if(item.source==='puzzle')config.onRating?.(result);
    if(++sent%10===0)await config.onSync?.();
   }
   if(current())await config.onSync?.();
  }catch(e){if(current())window.dispatchEvent(new CustomEvent('barida-result-sync-error',{detail:e.message}))}
  })().finally(()=>{flushing.delete(key);if(activeKey===key&&pending.has(key)&&pending.get(key)!==config&&read(key).length)flush(key)});
  flushing.set(key,task);return task;
 }
 window.addEventListener('online',()=>{if(activeKey)flush(activeKey)});
 setInterval(()=>{if(navigator.onLine&&activeKey&&read(activeKey).length)flush(activeKey)},15000);
})();
