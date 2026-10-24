import {createClient} from "npm:@supabase/supabase-js@2.57.0";
Deno.serve(async req=>{
 const headers={"content-type":"application/json","access-control-allow-origin":"*","access-control-allow-headers":"authorization,apikey,content-type,x-client-info","access-control-allow-methods":"POST,OPTIONS"};
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!secret)return reply({error:"Sunucu yapılandırması eksik"},503);
 const token=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
 if(!token)return reply({error:"Oturum gerekli"},401);
 const auth=createClient(url,anon),admin=createClient(url,secret);
 const {data:{user},error:authError}=await auth.auth.getUser(token);
 if(authError||!user)return reply({error:"Oturum geçersiz"},401);
 const {data:profile}=await admin.from("profiles").select("role").eq("id",user.id).single();
 if(profile?.role!=="admin")return reply({error:"Bu işlem yalnızca yöneticiye açıktır"},403);
 try{
 const body=await req.json(),action=String(body.action||"");
 if(action==="list"){
  const {data,error}=await admin.from("profiles").select("id,username,display_name,role,created_at").eq("role","teacher").order("created_at",{ascending:false});
  if(error)return reply({error:"Öğretmenler alınamadı"},500);
  const {data:extra}=await admin.from("teacher_details").select("*").in("user_id",(data||[]).map(t=>t.id));return reply({teachers:(data||[]).map(t=>({...t,...(extra||[]).find(d=>d.user_id===t.id)}))});
 }
 const details={phone:String(body.phone||"").replace(/[\s()-]/g,"")||null,home_address:String(body.home_address||"").trim(),email_contact:String(body.email_contact||"").trim(),specialization:String(body.specialization||"").trim(),experience_years:body.experience_years===""||body.experience_years==null?null:Number(body.experience_years),fide_id:String(body.fide_id||"").trim(),employment_type:String(body.employment_type||"").trim(),start_date:body.start_date||null,notes:String(body.notes||"").trim()};
 if(["create","update"].includes(action)){
  if((details.phone&&!/^\+[1-9][0-9]{7,14}$/.test(details.phone))||details.home_address.length>500||details.specialization.length>160||details.notes.length>1000||details.email_contact.length>254||(details.email_contact&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email_contact))||(details.experience_years!==null&&(!Number.isInteger(details.experience_years)||details.experience_years<0||details.experience_years>70)))return reply({error:"Öğretmen iletişim veya meslek bilgileri geçersiz"},400);
 }
 const username=String(body.username||"").trim().toLocaleLowerCase("tr"),display_name=String(body.display_name||"").trim()||username,password=String(body.password||"");
 if(action==="create"){
  if(!/^[\p{L}\p{N}_.-]{3,40}$/u.test(username)||display_name.length<2||display_name.length>60||password.length<12||password.length>128)return reply({error:"Kullanıcı adı, isim veya şifre geçersiz (şifre en az 12 karakter)"},400);
  const {data:existing}=await admin.from("profiles").select("id").eq("username",username).maybeSingle();
  if(existing)return reply({error:"Kullanıcı adı kullanılıyor"},409);
  const email="teacher-"+crypto.randomUUID()+"@teachers.invalid";
  const {data:created,error:err}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name}});
  if(err||!created.user){console.error("teacher account creation failed",err?.code,err?.status);return reply({error:"Antrenör hesabı oluşturulamadı. Lütfen bilgileri kontrol edip yeniden deneyin."},500);}
  const {error:profileError}=await admin.from("profiles").update({username,display_name,role:"teacher"}).eq("id",created.user.id);
  if(profileError){await admin.auth.admin.deleteUser(created.user.id);return reply({error:"Öğretmen profili kaydedilemedi"},500)}
  await admin.from("profile_contact").delete().eq("user_id",created.user.id);const {error:detailsError}=await admin.from("teacher_details").upsert({user_id:created.user.id,...details});if(detailsError){await admin.auth.admin.deleteUser(created.user.id);return reply({error:"Antrenör bilgileri kaydedilemedi; hesap oluşturulmadı. Lütfen tekrar deneyin."},500);}return reply({ok:true});
 }
 const id=String(body.id||"");
 if(!/^[0-9a-f-]{36}$/.test(id)||id===user.id)return reply({error:"Hedef hesap geçersiz"},400);
 const {data:target}=await admin.from("profiles").select("id,role").eq("id",id).maybeSingle();
 if(target?.role!=="teacher")return reply({error:"Yalnızca öğretmen hesapları yönetilebilir"},403);
 if(action==="update"){
  if(!/^[\p{L}\p{N}_.-]{3,40}$/u.test(username)||display_name.length<2||display_name.length>60||(password&&password.length<12))return reply({error:"Bilgiler geçersiz"},400);
  const {error:changeError}=await admin.from("profiles").update({username,display_name}).eq("id",id);
  if(changeError)return reply({error:"Kullanıcı adı kullanılıyor veya güncelleme başarısız"},409);
  if(password){const {error:pwError}=await admin.auth.admin.updateUserById(id,{password});if(pwError)return reply({error:"Şifre güncellenemedi"},500)}
  const {error:detailsError}=await admin.from("teacher_details").upsert({user_id:id,...details});if(detailsError)return reply({error:"Mesleki bilgiler kaydedilemedi"},500);return reply({ok:true});
 }
 if(action==="delete"){
  const {error}=await admin.auth.admin.deleteUser(id);
  if(error)return reply({error:"Öğretmen silinemedi. Önce bağlı kayıtları kontrol edin."},409);
  return reply({ok:true});
 }
 return reply({error:"Geçersiz işlem"},400);
 }catch{return reply({error:"İşlem başarısız"},400)}
});