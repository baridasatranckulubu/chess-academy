import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
let cached={token:'',expires:0};
const enc=new TextEncoder();
const b64=(a:Uint8Array)=>btoa(String.fromCharCode(...a)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
async function accessToken(){
 const raw=Deno.env.get('FIREBASE_SERVICE_ACCOUNT');if(!raw)throw Error('FIREBASE_SECRET_MISSING');
 let account;try{account=JSON.parse(raw)}catch{throw Error('FIREBASE_SECRET_INVALID_JSON')}
 if(account.project_id!=='barida-satranc'||!account.client_email||!account.private_key)throw Error('FIREBASE_SECRET_WRONG_PROJECT');
 if(cached.expires>Date.now()+60000)return cached.token;
 const now=Math.floor(Date.now()/1000),head=b64(enc.encode(JSON.stringify({alg:'RS256',typ:'JWT'}))),body=b64(enc.encode(JSON.stringify({iss:account.client_email,scope:'https://www.googleapis.com/auth/firebase.messaging',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600})));
 const pem=account.private_key.replace(/-----[^-]+-----/g,'').replace(/\s/g,'');
 const key=await crypto.subtle.importKey('pkcs8',Uint8Array.from(atob(pem),(c:string)=>c.charCodeAt(0)),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const assertion=head+'.'+body+'.'+b64(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,enc.encode(head+'.'+body))));
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(15000)});
 const data=await r.json();if(!r.ok||!data.access_token)throw Error('FIREBASE_AUTH_FAILED');
 cached={token:data.access_token,expires:Date.now()+Number(data.expires_in||3600)*1000};return cached.token;
}
Deno.serve(async req=>{
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
 if(req.method!=='POST')return reply({error:'METHOD_NOT_ALLOWED'},405);
 const secret=req.headers.get('x-barida-push-key')||'';if(secret.length!==64)return reply({error:'UNAUTHORIZED'},401);
 const authorized=await db.rpc('academy_push_authorized',{p_secret:secret});
 if(authorized.error||authorized.data!==true)return reply({error:'UNAUTHORIZED'},401);
 let bearer;try{bearer=await accessToken()}catch(e){return reply({error:e instanceof Error&&/^FIREBASE_/.test(e.message)?e.message:'FIREBASE_AUTH_FAILED'},503)}
 let sent=0,failed=0;
 for(let batch=0;batch<4;batch++){
  const claim=await db.rpc('academy_claim_push_jobs');if(claim.error)return reply({error:'QUEUE_UNAVAILABLE'},503);
  const jobs=claim.data||[];if(!jobs.length)break;
  await Promise.all(jobs.map(async(job:any)=>{
   let status='retry',code='NETWORK_ERROR';
   try{
    // Re-read recipient and device association immediately before each send.
    const check=await db.rpc('academy_push_job_payload',{p_job:job.id,p_lease:job.lease});
    const payload=check.data?.[0];if(check.error)throw Error('PAYLOAD_FAILED');
    if(!payload){status='skipped';code='RECIPIENT_UNAVAILABLE'}else{
     const r=await fetch('https://fcm.googleapis.com/v1/projects/barida-satranc/messages:send',{method:'POST',headers:{Authorization:'Bearer '+bearer,'Content-Type':'application/json'},body:JSON.stringify({message:{token:payload.token,notification:{title:payload.title,body:payload.body},data:{notification_id:payload.notification_id},android:{priority:'high',ttl:'86400s',notification:{channel_id:'barida_general',tag:payload.notification_id,default_sound:true,visibility:'PRIVATE'}}}}),signal:AbortSignal.timeout(15000)});
     const result=await r.json();const fcmCode=result.error?.details?.find((d:any)=>d.errorCode)?.errorCode;
     if(r.ok){status='sent';code='OK'}else if(fcmCode==='UNREGISTERED'){status='invalid';code='UNREGISTERED'}else{code=fcmCode||'HTTP_'+r.status;if(r.status===400||r.status===404)status='failed';if(r.status===401)cached.expires=0;}
    }
   }catch{/* No payloads, tokens or credential details in logs. */}
   const completed=await db.rpc('academy_finish_push_job',{p_job:job.id,p_lease:job.lease,p_status:status,p_code:code});
   if(completed.error||status!=='sent')failed++;else sent++;
  }));
 }
 return reply({firebase:'authenticated',sent,failed});
});
