import {createClient} from "npm:@supabase/supabase-js@2";
Deno.serve(async(req)=>{
 const headers={"Content-Type":"application/json","Access-Control-Allow-Origin":(["https://chess-academy.hskgsuygar32.workers.dev","https://hskgsuygar32-boop.github.io","https://baridasatranckulubu.github.io","https://baridachess.pages.dev","https://baridasatranc.pages.dev"].includes(req.headers.get("origin")||"")?(req.headers.get("origin")||""):"https://hskgsuygar32-boop.github.io"),"Access-Control-Allow-Headers":"apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
 const send=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return send({error:"Method not allowed"},405);
 try{
 const {name,password}=await req.json();
 const displayName=String(name||"").trim().replace(/\s+/g," ");
 if(displayName.length<3||displayName.length>60||typeof password!=="string"||password.length<12||password.length>128)return send({error:"Giriş bilgileri hatalı."},401);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!secret)return send({error:"Sunucu yapılandırması eksik."},503);
 const admin=createClient(url,secret);
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(displayName.toLocaleLowerCase("tr")));
 const key=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");
 const {data:allowed,error:rateError}=await admin.rpc("academy_student_rate_limit",{k:key});
 if(rateError||!allowed)return send({error:"Çok fazla deneme. 15 dakika sonra tekrar deneyin."},429);
 const {data:candidates,error:lookupError}=await admin.rpc("academy_student_candidates",{student_name:displayName});
 if(lookupError)return send({error:"Giriş servisi kullanılamıyor."},503);
 for(const candidate of (candidates||[])){
 const client=createClient(url,anon);
 const {data,error}=await client.auth.signInWithPassword({email:candidate.email,password});
 if(!error&&data.session){
   const {data:status,error:statusError}=await admin.from("academy_student_status").select("active").eq("student_id",data.user.id).maybeSingle();
   if(statusError)return send({error:"Hesap durumu kontrol edilemedi. Lütfen biraz sonra tekrar deneyin."},503);
   if(status?.active===false)return send({error:"Bu öğrenci hesabı şu anda aktif değil. Giriş yapabilmek için kulüp yönetimiyle iletişime geçebilirsiniz.",code:"STUDENT_INACTIVE"},403);
   return send({session:data.session});
 }
 }
 return send({error:"İsim soyisim veya şifre hatalı."},401);
 }catch{return send({error:"Giriş başarısız."},400)}
});