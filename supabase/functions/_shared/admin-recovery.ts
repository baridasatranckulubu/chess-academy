import {RECOVERY_EMAIL,RECOVERY_OWNER} from './admin-accounts.ts';
export async function requestAdminRecovery(admin,target){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('barida-admin-recovery-mail'));
 const k=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
 const limit=await admin.rpc('academy_student_rate_limit',{k});
 if(limit.error)throw Error('Kurtarma servisine ulaşılamıyor.');
 if(!limit.data)return;
 const ownerProfile=await admin.from('profiles').select('role').eq('id',RECOVERY_OWNER).maybeSingle();
 if(ownerProfile.error||ownerProfile.data?.role!=='admin')throw Error('Kurtarma hesabı yapılandırılmadı.');
 const owner=await admin.auth.admin.getUserById(RECOVERY_OWNER);
 if(owner.error||!owner.data?.user)throw Error('Kurtarma hesabı bulunamadı.');
 // Fixed, explicitly configured club inbox. Never take the recipient from a request.
 if(owner.data.user.email!==RECOVERY_EMAIL){
  if(owner.data.user.email!=='hskgsuygar32@gmail.com')throw Error('Kurtarma adresi kontrol edilmeli.');
  const moved=await admin.auth.admin.updateUserById(RECOVERY_OWNER,{email:RECOVERY_EMAIL,email_confirm:true});
  if(moved.error)throw Error('Kurtarma adresi güncellenemedi.');
 }
 const {error}=await admin.auth.resetPasswordForEmail(RECOVERY_EMAIL,{redirectTo:'https://baridasatranc.com/admin-reset.html?account='+encodeURIComponent(target.id)});
 if(error)throw Error('Kurtarma e-postası gönderilemedi. Biraz sonra yeniden deneyin.');
}
