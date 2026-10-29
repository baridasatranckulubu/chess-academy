(()=>{'use strict';
 const $=id=>document.getElementById(id),status=$('recoveryStatus'),form=$('recoveryForm');
 const target=new URL(location.href).searchParams.get('account');
 const client=window.supabase?.createClient('https://kbqupsfylankcjgtjzld.supabase.co','sb_publishable_BCw6h-WGENfTHeyMa2qqYw_E-f-1QdG',{auth:{storageKey:'barida-admin-recovery',persistSession:false,autoRefreshToken:false,detectSessionInUrl:true}});
 let session,busy=false;
 async function action(payload){
  const response=await fetch('https://kbqupsfylankcjgtjzld.supabase.co/functions/v1/academy-admin-accounts',{method:'POST',headers:{'content-type':'application/json','apikey':'sb_publishable_BCw6h-WGENfTHeyMa2qqYw_E-f-1QdG','authorization':'Bearer '+session.access_token},body:JSON.stringify(payload)});
  const result=await response.json();if(!response.ok)throw Error(result.error||'Şifre yenilenemedi.');return result;
 }
 async function init(){try{
  if(!client||!target||!/^[0-9a-f-]{36}$/i.test(target))throw Error('Geçerli bir kurtarma bağlantısı gerekli. Giriş sayfasından yeniden Şifremi unuttum isteği gönderin.');
  const result=await client.auth.getSession();if(result.error||!result.data?.session)throw Error('Bağlantı geçersiz veya süresi dolmuş. Giriş sayfasından yeni bağlantı isteyin.');session=result.data.session;
  history.replaceState(null,'',location.pathname+'?account='+encodeURIComponent(target));
  const info=await action({action:'recovery_target',id:target});
  $('recoveryAccount').textContent='Yönetici: '+info.administrator.username;
  status.textContent='Yeni şifrenizi belirleyin. Bu hesabın açık oturumları kapatılacak.';form.hidden=false;
 }catch(e){status.textContent=e.message}}
 form.onsubmit=async e=>{e.preventDefault();if(busy||!session)return;
  if($('recoveryPassword').value!==$('recoveryConfirm').value){status.textContent='Şifreler aynı olmalı.';return}
  busy=true;$('recoverySubmit').disabled=true;status.textContent='Şifre kaydediliyor…';
  try{await action({action:'reset',id:target,password:$('recoveryPassword').value});form.reset();form.hidden=true;status.textContent='Şifre güncellendi. Yönetici girişine dönüp yeni şifrenizle giriş yapabilirsiniz.';await client.auth.signOut({scope:'local'}).catch(()=>{});session=null;}
  catch(e){status.textContent=e.message}finally{busy=false;$('recoverySubmit').disabled=false}
 };
 init();
})();
