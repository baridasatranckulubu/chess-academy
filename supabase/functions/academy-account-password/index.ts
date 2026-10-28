import {createClient} from "npm:@supabase/supabase-js@2.57.0";
import {changedPasswordAttributes} from "../_shared/passwords.ts";
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'',allowed=['https://baridasatranc.pages.dev','https://baridachess.pages.dev','https://baridasatranckulubu.github.io','https://localhost'];
 const headers={'content-type':'application/json','access-control-allow-origin':allowed.includes(origin)?origin:allowed[0],'access-control-allow-headers':'authorization,apikey,content-type','access-control-allow-methods':'POST,OPTIONS'};
 const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try{const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');if(!token)return reply({error:'Oturum gerekli'},401);
 const url=Deno.env.get('SUPABASE_URL'),anon=Deno.env.get('SUPABASE_ANON_KEY'),secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!url||!anon||!secret)return reply({error:'Sunucu ayarı eksik'},503);
 const {data:{user},error}=await createClient(url,anon).auth.getUser(token);if(error||!user)return reply({error:'Oturum geçersiz'},401);
 const {password}=await req.json();if(typeof password!=='string'||!password)return reply({error:'Şifre boş bırakılamaz.'},400);
 const admin=createClient(url,secret);const {data:profile}=await admin.from('profiles').select('role').eq('id',user.id).maybeSingle();if(!['student','teacher','admin'].includes(profile?.role))return reply({error:'Hesap bulunamadı'},403);
 const {error:changed}=await admin.auth.admin.updateUserById(user.id,await changedPasswordAttributes(admin,user.id,password));if(changed)return reply({error:'Şifre güncellenemedi'},500);return reply({ok:true});
 }catch{return reply({error:'Şifre güncellenemedi'},400)}
});
