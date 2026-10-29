import {protect} from "../_shared/protection.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
Deno.serve(protect(async(req)=>{
 const requestedOrigin=req.headers.get("origin")||"";
 const allowedOrigins=["https://chess-academy.hskgsuygar32.workers.dev","https://baridasatranckulubu.github.io","https://baridachess.pages.dev","https://baridasatranc.pages.dev","https://localhost"];
 const origin=allowedOrigins.includes(requestedOrigin)?requestedOrigin:allowedOrigins[0];
 const headers={"Content-Type":"application/json","Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 try{
 const token=req.headers.get("authorization")?.replace(/^Bearer /i,"");
 if(!token)return reply({error:"Oturum gerekli"},401);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!service)return reply({error:"Sunucu yapılandırma hatası"},503);
 const auth=createClient(url,anon),admin=createClient(url,service);
 const {data:{user},error:authError}=await auth.auth.getUser(token);
 if(authError||!user)return reply({error:"Oturum geçersiz"},401);
 const {data:profile}=await admin.from("profiles").select("role").eq("id",user.id).single();
 if(!["teacher","admin"].includes(profile?.role))return reply({error:"Yetkiniz yok"},403);
 const body=await req.json(),id=String(body.student_id||"");
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)||id===user.id)return reply({error:"Geçersiz öğrenci"},400);
 const {data:link}=await admin.from("teacher_students").select("student_id").eq("teacher_id",user.id).eq("student_id",id).maybeSingle();
 if(!link)return reply({error:"Bu öğrenci size atanmış değil"},403);
 const {data:student}=await admin.from("profiles").select("role").eq("id",id).single();
 if(student?.role!=="student")return reply({error:"Öğrenci hesabı bulunamadı"},404);
 const {error:deleteError}=await admin.auth.admin.deleteUser(id);
 if(deleteError)return reply({error:"Öğrenci silinemedi: "+deleteError.message},500);
 return reply({ok:true});
 }catch{return reply({error:"İşlem tamamlanamadı"},500)}
}));
