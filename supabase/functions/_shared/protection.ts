/* Request validation is defense in depth, not a replacement for upstream DDoS filtering. */
const ORIGINS=new Set(['https://baridasatranc.com','https://www.baridasatranc.com','https://baridasatranc.pages.dev','https://baridachess.pages.dev','https://baridasatranckulubu.github.io','https://hskgsuygar32-boop.github.io','https://chess-academy.hskgsuygar32.workers.dev','https://localhost']);
const MAX_BODY=256*1024;
export function protect(handler){
 let active=0;
 return async req=>{
  const origin=req.headers.get('origin')||'';
  const headers={'content-type':'application/json','cache-control':'no-store','pragma':'no-cache','x-content-type-options':'nosniff','vary':'Origin','access-control-allow-headers':'authorization,apikey,content-type,x-client-info','access-control-allow-methods':'POST,OPTIONS'};
  if(ORIGINS.has(origin))headers['access-control-allow-origin']=origin;
  const reply=(error,status)=>new Response(JSON.stringify({error}),{status,headers:{...headers,...([429,503].includes(status)?{'retry-after':'60'}:{})}});
  if(origin&&!ORIGINS.has(origin))return reply('Bu kaynaktan istek kabul edilmiyor.',403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return reply('İstek desteklenmiyor.',405);
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return reply('JSON içerik gerekli.',415);
  const length=req.headers.get('content-length');if(length&&(!/^\d+$/.test(length)||Number(length)>MAX_BODY))return reply('İstek boyutu çok büyük.',413);
  if(active>=32)return reply('Servis yoğun. Biraz sonra yeniden deneyin.',503);
  active++;let reader,timer;
  try{
   reader=req.body?.getReader();if(!reader)return reply('İstek boş olamaz.',400);
   const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{reader.cancel().catch(()=>{});reject(Error('timeout'))},8000)});
   let bytes=0,text='';const decoder=new TextDecoder('utf-8',{fatal:true});
   const read=(async()=>{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>MAX_BODY){await reader.cancel();throw Error('size')}text+=decoder.decode(value,{stream:true})}text+=decoder.decode();return text})();
   const parsed=JSON.parse(await Promise.race([read,timeout]));clearTimeout(timer);
   if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return reply('Geçersiz JSON nesnesi.',400);
   const response=await handler({method:req.method,headers:req.headers,url:req.url,json:async()=>parsed});
   const combined=new Headers(response.headers);for(const [key,value] of Object.entries(headers))combined.set(key,value);
   if(!ORIGINS.has(origin))combined.delete('access-control-allow-origin');if(response.status===429)combined.set('retry-after','60');
   return new Response(response.body,{status:response.status,headers:combined});
  }catch(e){return reply(e.message==='size'?'İstek boyutu çok büyük.':e.message==='timeout'?'İstek zaman aşımına uğradı.':'İstek işlenemedi.',e.message==='size'?413:e.message==='timeout'?408:400)}
  finally{clearTimeout(timer);reader?.releaseLock();active--}
 };
}
