import {protect} from "../_shared/protection.ts";
import {signInPassword} from "../_shared/passwords.ts";
import {staffIdentity} from "../_shared/admin-accounts.ts";
import {createClient} from "npm:@supabase/supabase-js@2.57.0";
Deno.serve(protect(async req=>{
 const headers={"content-type":"application/json","access-control-allow-origin":(["https://chess-academy.hskgsuygar32.workers.dev","https://hskgsuygar32-boop.github.io","https://baridasatranckulubu.github.io","https://baridachess.pages.dev","https://baridasatranc.pages.dev","https://localhost"].includes(req.headers.get("origin")||"")?(req.headers.get("origin")||""):"https://chess-academy.hskgsuygar32.workers.dev"),"access-control-allow-headers":"apikey,content-type","access-control-allow-methods":"POST,OPTIONS"};
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 try{
  const {username,password}=await req.json();
  if(typeof username!=="string"||typeof password!=="string"||!username.trim()||!password)return reply({error:"Kullanıcı adı veya şifre hatalı."},401);
  const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!anon||!secret)return reply({error:"Sunucu ayarı eksik"},503);
  const admin=createClient(url,secret);
  const key=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(username.toLocaleLowerCase("tr"))))).map(x=>x.toString(16).padStart(2,"0")).join("");
  const {data:allowed,error:limitError}=await admin.rpc("academy_student_rate_limit",{k:key});
  if(limitError||!allowed)return reply({error:"Çok fazla giriş denemesi. Daha sonra tekrar deneyin."},429);
  const identity=staffIdentity(username);
  const {data:rows}=await admin.rpc("academy_login_identity",{p_identity:identity,p_student:false});const profile=rows?.[0];
  if(!profile||!["admin","teacher"].includes(profile.role))return reply({error:"Kullanıcı adı veya şifre hatalı."},401);
  const client=createClient(url,anon);
  const {data,error}=await signInPassword(client,profile,password);
  if(error||!data.session)return reply({error:"Kullanıcı adı veya şifre hatalı."},401);
  return reply({session:data.session});
 }catch{return reply({error:"Giriş başarısız."},400)}
}));
