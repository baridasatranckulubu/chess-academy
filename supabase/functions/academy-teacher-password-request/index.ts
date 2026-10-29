import {protect} from "../_shared/protection.ts";
import {staffIdentity} from '../_shared/admin-accounts.ts';
import {requestAdminRecovery} from '../_shared/admin-recovery.ts';
import {createClient} from "npm:@supabase/supabase-js@2.57.0";
Deno.serve(protect(async req=>{
 const origin=req.headers.get("origin")||"";
 const allowed=["https://hskgsuygar32-boop.github.io","https://chess-academy.hskgsuygar32.workers.dev","https://baridasatranckulubu.github.io","https://baridachess.pages.dev","https://baridasatranc.pages.dev","https://localhost"];
 const headers={"content-type":"application/json","access-control-allow-origin":allowed.includes(origin)?origin:allowed[0],"access-control-allow-headers":"apikey,content-type","access-control-allow-methods":"POST,OPTIONS","vary":"Origin"};
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"İstek desteklenmiyor."},405);
 try{
  const {username}=await req.json(),name=staffIdentity(username);
  if(!name)return reply({error:"Lütfen öğretmen kullanıcı adınızı girin."},400);
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!key)return reply({error:"Servis şu anda kullanılamıyor."},503);
  const admin=createClient(url,key);
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("teacher-reset:"+name));
  const hash=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");
  const {data:allowedRequest,error:limitError}=await admin.rpc("academy_student_rate_limit",{k:hash});
  if(limitError||!allowedRequest)return reply({error:"Çok fazla deneme. Lütfen daha sonra tekrar deneyin."},429);
  const identities=await admin.rpc('academy_login_identity',{p_identity:name,p_student:false});
  if(identities.error)return reply({error:'Hesap kontrol edilemedi.'},503);
  const account=identities.data?.[0];
  if(account?.role==='admin'){
   try{await requestAdminRecovery(admin,account)}catch{return reply({error:'Kurtarma e-postası gönderilemedi. Biraz sonra yeniden deneyin.'},503)}
  }
  const teacher=account?.role==='teacher'?account:null;
  if(teacher){
   const {error}=await admin.from("teacher_password_requests").upsert({teacher_id:teacher.id,status:"pending"},{onConflict:"teacher_id",ignoreDuplicates:true});
   // Partial unique indexes are not valid ON CONFLICT targets; fallback to a guarded insert.
   if(error){const {data:existing}=await admin.from("teacher_password_requests").select("id").eq("teacher_id",teacher.id).eq("status","pending").maybeSingle();
    if(!existing)await admin.from("teacher_password_requests").insert({teacher_id:teacher.id});
   }
  }
  return reply({message:'Hesap varsa kurtarma işlemi başlatıldı. Yönetici kurtarma bağlantısı Barida Gmail adresine, antrenör şifre talebi kulüp yönetimine iletilir.'});
 }catch{return reply({error:"Talep gönderilemedi. Lütfen tekrar deneyin."},400)}
}));
