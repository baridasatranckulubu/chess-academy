import { createClient } from "npm:@supabase/supabase-js@2.57.0";
Deno.serve(async (req) => {
 const headers={"Content-Type":"application/json","Access-Control-Allow-Origin":(["https://chess-academy.hskgsuygar32.workers.dev","https://baridasatranckulubu.github.io","https://baridachess.pages.dev","https://baridasatranc.pages.dev","https://localhost","https://hskgsuygar32-boop.github.io"].includes(req.headers.get("origin")||"")?(req.headers.get("origin")||""):"https://hskgsuygar32-boop.github.io"),"Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 const token=req.headers.get("authorization")?.replace(/^Bearer /i,"");
 if(!token)return reply({error:"Unauthorized"},401);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!secret)return reply({error:"Configuration error"},503);
 const {data:{user},error}=await createClient(url,anon).auth.getUser(token);
 if(error||!user)return reply({error:"Unauthorized"},401);
 const admin=createClient(url,secret);
 const body=await req.json().catch(()=>({}));
 const action=body.action;
 if(action==="request"){
  const {data:profile}=await admin.from("profiles").select("role").eq("id",user.id).single();
  if(profile?.role!=="student")return reply({error:"Student account required"},403);
  const {data:links}=await admin.from("teacher_students").select("teacher_id").eq("student_id",user.id);
  for(const link of links||[]){
   const {data:existing}=await admin.from("student_password_requests").select("id").eq("student_id",user.id).eq("teacher_id",link.teacher_id).eq("status","pending").maybeSingle();
   if(!existing)await admin.from("student_password_requests").insert({student_id:user.id,teacher_id:link.teacher_id});
  }
  return reply({ok:true});
 }
 if(action!=="change")return reply({error:"Invalid action"},400);
 const studentId=String(body.student_id||""),password=String(body.password||"");
 if(!/^[0-9a-f-]{36}$/i.test(studentId)||password.length<12||password.length>128)return reply({error:"Invalid input"},400);
 const {data:profile}=await admin.from("profiles").select("role").eq("id",user.id).single();
 if(!["teacher","admin"].includes(profile?.role))return reply({error:"Forbidden"},403);
 const {data:assignment}=await admin.from("teacher_students").select("student_id").eq("teacher_id",user.id).eq("student_id",studentId).maybeSingle();
 if(!assignment)return reply({error:"Student is not assigned to this teacher"},403);
 const {error:updateError}=await admin.auth.admin.updateUserById(studentId,{password});
 if(updateError)return reply({error:"Password update failed"},500);
 await admin.from("student_password_requests").update({status:"resolved",resolved_at:new Date().toISOString()}).eq("teacher_id",user.id).eq("student_id",studentId).eq("status","pending");
 return reply({ok:true});
});
