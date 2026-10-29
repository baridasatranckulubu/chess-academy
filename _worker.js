const receiver='https://kbqupsfylankcjgtjzld.supabase.co/functions/v1/academy-traffic';
const allowed=new Set(['baridasatranc.com','www.baridasatranc.com','baridasatranc.pages.dev','baridachess.pages.dev']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/api/traffic-key'){
  if(request.method!=='GET')return reply({error:'Method'},405);
  return env.BARIDA_TRAFFIC_PUBLIC_KEY?reply(JSON.parse(env.BARIDA_TRAFFIC_PUBLIC_KEY)):reply({error:'Not configured'},503);
 }
 if(url.pathname!=='/api/traffic')return env.ASSETS.fetch(request);
 if(!allowed.has(url.hostname)||request.method!=='POST')return reply({error:'Method'},405);
 if(request.headers.get('origin')!==url.origin)return reply({error:'Origin'},403);
 if(!env.BARIDA_TRAFFIC_PRIVATE_KEY)return reply({error:'Not configured'},503);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'Type'},415);
 let timer,reader;
 try{
  const length=request.headers.get('content-length');if(length&&Number(length)>8192)return reply({error:'Size'},413);
  reader=request.body?.getReader();if(!reader)return reply({error:'Body'},400);
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{reader.cancel().catch(()=>{});reject(Error('timeout'))},3000)});
  let size=0;const chunks=[];while(true){const {value,done}=await Promise.race([reader.read(),timeout]);if(done)break;size+=value.length;if(size>8192){await reader.cancel();return reply({error:'Size'},413)}chunks.push(value)}
  clearTimeout(timer);const bytes=new Uint8Array(size);let pos=0;for(const c of chunks){bytes.set(c,pos);pos+=c.length}
  const input=JSON.parse(new TextDecoder().decode(bytes));
  if(!uuid.test(input.event_id)||!uuid.test(input.visitor_id)||!['visit','page','login','logout','leave'].includes(input.event)||typeof input.page!=='string')return reply({error:'Event'},400);
  const ua=request.headers.get('user-agent')||'';
  const device=/iPad|Tablet|SM-X|Nexus 7|Nexus 9/i.test(ua)||(/Android/i.test(ua)&&!/Mobile/i.test(ua))?'Tablet':/Mobile|iPhone|Android/i.test(ua)?'Telefon':'Bilgisayar';
  const browser=/Edg\//.test(ua)?'Edge':/Firefox\//.test(ua)?'Firefox':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'Diğer';
  const platform=/Android/i.test(ua)?'Android':/iPhone|iPad/i.test(ua)?'iOS':/Windows/i.test(ua)?'Windows':/Macintosh/i.test(ua)?'macOS':/Linux/i.test(ua)?'Linux':'Diğer';
  const payload=JSON.stringify({at:Date.now(),event_id:input.event_id,visitor_id:input.visitor_id,event:input.event,page:input.page.slice(0,100),host:url.hostname,device,browser,platform,ip:request.headers.get('cf-connecting-ip')||null,country:request.cf?.country||null,city:request.cf?.city||null,authorization:request.headers.get('authorization')||''});
  const key=await crypto.subtle.importKey('jwk',JSON.parse(env.BARIDA_TRAFFIC_PRIVATE_KEY),{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
  const signature=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(payload)));
  const result=await fetch(receiver,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({payload,signature:btoa(String.fromCharCode(...signature))}),signal:AbortSignal.timeout(6000)});
  return reply({ok:result.ok},result.ok?200:503);
 }catch{return reply({error:'Unavailable'},503)}finally{clearTimeout(timer);reader?.releaseLock()}
}};
