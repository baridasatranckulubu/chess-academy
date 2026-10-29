import {protect} from '../_shared/protection.ts';
import {newPasswordAttributes,changedPasswordAttributes} from '../_shared/passwords.ts';
import {requireAdministrator,validAdministratorName} from '../_shared/admin-accounts.ts';
import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
Deno.serve(protect(async req=>{
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
 const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');if(!token)return reply({error:'Oturum gerekli.'},401);
 const url=Deno.env.get('SUPABASE_URL'),anon=Deno.env.get('SUPABASE_ANON_KEY'),secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!anon||!secret)return reply({error:'Sunucu ayarı eksik.'},503);
 const actorClient=createClient(url,anon,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const actor=await requireAdministrator(actorClient,token);if(actor.error)return reply({error:actor.error},actor.status);
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 try{
  const body=await req.json(),action=String(body.action||'');
  if(action==='list'){
   const {data,error}=await admin.from('profiles').select('id,username,display_name,created_at').eq('role','admin').order('created_at');
   return error?reply({error:'Yönetici hesapları yüklenemedi.'},500):reply({administrators:data||[]});
  }
  if(action==='create'){
   const name=typeof body.username==='string'?body.username.trim():'',username=name.toLocaleLowerCase('tr'),password=body.password;
   if(!validAdministratorName(name)||typeof password!=='string'||!password)return reply({error:'Yönetici adı ve şifre gerekli. Adda harf, rakam, nokta, alt çizgi veya tire kullanın.'},400);
   const existing=await admin.from('profiles').select('id').eq('username',username).maybeSingle();
   if(existing.error)return reply({error:'Hesap adı kontrol edilemedi.'},503);if(existing.data)return reply({error:'Bu yönetici adı kullanılıyor.'},409);
   const {data,error}=await admin.auth.admin.createUser({email:'admin-'+crypto.randomUUID()+'@admins.invalid',email_confirm:true,...await newPasswordAttributes(password),user_metadata:{display_name:name}});
   if(error||!data.user)return reply({error:'Yönetici hesabı oluşturulamadı.'},500);
   const id=data.user.id;
   const saved=await admin.from('profiles').update({username,display_name:name,role:'admin'}).eq('id',id).select('id').single();
   if(saved.error||!saved.data){await admin.auth.admin.deleteUser(id);return reply({error:'Yönetici kaydedilemedi; aynı ad kullanılıyor olabilir.'},409)}
   await admin.from('profile_contact').delete().eq('user_id',id);
   const audit=await admin.rpc('barida_admin_account_finalize',{p_actor:actor.user.id,p_target:id,p_action:'create'});
   if(audit.error){await admin.auth.admin.deleteUser(id);return reply({error:'Yönetici kaydı tamamlanamadı.'},500)}
   return reply({ok:true,id,username});
  }
  const id=String(body.id||'');if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return reply({error:'Yönetici seçin.'},400);
  const {data:target,error:targetError}=await admin.from('profiles').select('id,username,display_name,role').eq('id',id).maybeSingle();
  if(targetError)return reply({error:'Hesap kontrol edilemedi.'},503);if(target?.role!=='admin')return reply({error:'Yalnızca yönetici hesapları yönetilebilir.'},403);
  if(action==='recovery_target')return reply({administrator:{id:target.id,username:target.username,display_name:target.display_name}});
  if(action==='reset'){
   if(typeof body.password!=='string'||!body.password)return reply({error:'Yeni şifre gerekli.'},400);
   const changed=await admin.auth.admin.updateUserById(id,await changedPasswordAttributes(admin,id,body.password));
   if(changed.error)return reply({error:'Şifre güncellenemedi.'},500);
   const finalized=await admin.rpc('barida_admin_account_finalize',{p_actor:actor.user.id,p_target:id,p_action:'reset'});
   if(finalized.error)return reply({error:'Şifre değişti ancak eski oturumlar kapatılamadı. Yeniden şifre belirlemeyi deneyin.'},500);
   return reply({ok:true,sign_out:id===actor.user.id});
  }
  return reply({error:'Geçersiz işlem.'},400);
 }catch{return reply({error:'İşlem tamamlanamadı.'},400)}
}));
