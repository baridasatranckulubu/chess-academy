import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
const hosts=new Set(['baridasatranc.com','www.baridasatranc.com','baridasatranc.pages.dev','baridachess.pages.dev']);
const cache=new Map<string,{at:number,key:CryptoKey}>();
async function verify(host:string,payload:string,signature:Uint8Array,refresh=false){
 let entry=cache.get(host);
 if(refresh||!entry||Date.now()-entry.at>300000){
  const source=host==='baridachess.pages.dev'?'baridachess.pages.dev':'baridasatranc.pages.dev';
  const response=await fetch('https://'+source+'/api/traffic-key',{headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(5000)});if(!response.ok)return false;
  const jwk=await response.json();if(jwk.d)return false;
  entry={at:Date.now(),key:await crypto.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['verify'])};cache.set(host,entry);
 }
 return crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},entry.key,signature,new TextEncoder().encode(payload));
}
Deno.serve(async req=>{
 const reply=(status:number)=>new Response(null,{status,headers:{'cache-control':'no-store'}});
 if(req.method!=='POST')return reply(405);
 try{
  const raw=await req.text();if(raw.length>16000)return reply(413);
  const {payload,signature}=JSON.parse(raw);if(typeof payload!=='string'||typeof signature!=='string'||payload.length>10000||signature.length>200)return reply(400);
  const event=JSON.parse(payload);if(!hosts.has(event.host)||Math.abs(Date.now()-event.at)>120000)return reply(403);
  const sig=Uint8Array.from(atob(signature),c=>c.charCodeAt(0));
  if(!await verify(event.host,payload,sig)&&!await verify(event.host,payload,sig,true))return reply(403);
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
  let user=null,session=null;
  const token=event.authorization?.replace(/^Bearer\s+/i,'');
  if(token){const {data,error}=await admin.auth.getUser(token);if(!error&&data.user){user=data.user.id;try{session=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).session_id}catch{user=null}}}
  delete event.authorization;
  const {data,error}=await admin.rpc('barida_traffic_record',{p_event:event,p_user:user,p_session:session});
  return reply(error?500:data?204:429);
 }catch{return reply(400)}
});
