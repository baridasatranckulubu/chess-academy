import { createClient } from "npm:@supabase/supabase-js@2.57.0";
Deno.serve(async (req) => {
 const origin = "*";
 const headers = {"Content-Type":"application/json","Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS"};
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==="OPTIONS") return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 const token=req.headers.get("Authorization")?.replace(/^Bearer /,"");
 if(!token)return reply({error:"Unauthorized"},401);
 const url=Deno.env.get("SUPABASE_URL");
 const key=Deno.env.get("SUPABASE_ANON_KEY");
 const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!key||!service)return reply({error:"Configuration error"},503);
 const client=createClient(url,key);
 const {data:{user},error}=await client.auth.getUser(token);
 if(error||!user)return reply({error:"Unauthorized"},401);
 const privileged=createClient(url,service);
 const {data:profile}=await privileged.from("profiles").select("role").eq("id",user.id).single();
 if(!["admin","teacher"].includes(profile?.role))return reply({error:"Forbidden"},403);
 const body=await req.json();
 const display_name=String(body.display_name||"").trim().replace(/\s+/g," ");
 const phone=String(body.phone||"").replace(/[\s()-]/g,"");
 const home_address="";
 const birth_date=body.birth_date?String(body.birth_date):null;
 const gender=["male","female"].includes(body.gender)?body.gender:null;
 const has_license=typeof body.has_license==="boolean"?body.has_license:null;
 const tc_identity_no=body.tc_identity_no?String(body.tc_identity_no):null;
 if(birth_date&&(!/^\d{4}-\d{2}-\d{2}$/.test(birth_date)||Number.isNaN(Date.parse(birth_date))))return reply({error:"Geçersiz doğum tarihi"},400);
 if(tc_identity_no&&!/^[0-9]{11}$/.test(tc_identity_no))return reply({error:"T.C. kimlik numarası 11 rakam olmalıdır"},400);
 const password=String(body.password||"");
 if(display_name.length<3||display_name.length>60||(phone&&!/^\+[1-9][0-9]{7,14}$/.test(phone))||password.length<12||password.length>128)return reply({error:"Ad soyad en az 3, şifre en az 12 karakter olmalı. Telefon girildiğinde +90 ile başlayan geçerli bir numara kullanın."},400);
 const email="student-"+crypto.randomUUID()+"@students.invalid";
 const {data:created,error:creationError}=await privileged.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name,phone}});
 if(creationError||!created.user){console.error("student account creation failed",creationError?.code,creationError?.status);return reply({error:"Sporcu hesabı oluşturulamadı. Bilgileri kontrol edip yeniden deneyin."},500);}
 const {error:linkError}=await privileged.from("teacher_students").insert({teacher_id:user.id,student_id:created.user.id});
 if(linkError){await privileged.auth.admin.deleteUser(created.user.id);return reply({error:"Sporcu antrenöre bağlanamadı; hesap oluşturulmadı. Tekrar deneyin."},500)}
 const {error:detailsError}=await privileged.rpc("academy_save_student_details",{p_student_id:created.user.id,p_birth_date:birth_date,p_gender:gender,p_has_license:has_license,p_tc_identity_no:tc_identity_no});
 if(detailsError){await privileged.from("teacher_students").delete().eq("student_id",created.user.id);await privileged.auth.admin.deleteUser(created.user.id);return reply({error:"Öğrenci bilgileri güvenli şekilde kaydedilemedi"},500)}
 return reply({ok:true,student_id:created.user.id,display_name});
});
