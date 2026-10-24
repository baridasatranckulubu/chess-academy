import {createClient} from "npm:@supabase/supabase-js@2";
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 const allowed=["https://hskgsuygar32-boop.github.io","https://chess-academy.hskgsuygar32.workers.dev","https://baridasatranckulubu.github.io","https://baridachess.pages.dev","https://baridasatranc.pages.dev"];
 const headers={"content-type":"application/json","access-control-allow-origin":allowed.includes(origin)?origin:allowed[0],"access-control-allow-headers":"apikey,content-type","access-control-allow-methods":"POST,OPTIONS","vary":"Origin"};
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"İstek desteklenmiyor."},405);
 try{
  const {username}=await req.json(),name=String(username||"").trim().toLocaleLowerCase("tr");
  if(name.length<2||name.length>40)return reply({error:"Lütfen öğretmen kullanıcı adınızı girin."},400);
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!key)return reply({error:"Servis şu anda kullanılamıyor."},503);
  const admin=createClient(url,key);
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("teacher-reset:"+name));
  const hash=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");
  const {data:allowedRequest,error:limitError}=await admin.rpc("academy_student_rate_limit",{k:hash});
  if(limitError||!allowedRequest)return reply({error:"Çok fazla deneme. Lütfen daha sonra tekrar deneyin."},429);
  const {data:teacher}=await admin.from("profiles").select("id").eq("username",name).eq("role","teacher").maybeSingle();
  if(teacher){
   const {error}=await admin.from("teacher_password_requests").upsert({teacher_id:teacher.id,status:"pending"},{onConflict:"teacher_id",ignoreDuplicates:true});
   // Partial unique indexes are not valid ON CONFLICT targets; fallback to a guarded insert.
   if(error){const {data:existing}=await admin.from("teacher_password_requests").select("id").eq("teacher_id",teacher.id).eq("status","pending").maybeSingle();
    if(!existing)await admin.from("teacher_password_requests").insert({teacher_id:teacher.id});
   }
  }
  return reply({message:"Bu kullanıcı adına bağlı bir öğretmen hesabı varsa şifre sıfırlama talebi kulüp yönetimine iletildi."});
 }catch{return reply({error:"Talep gönderilemedi. Lütfen tekrar deneyin."},400)}
});