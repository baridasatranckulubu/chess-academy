export const RECOVERY_EMAIL='baridasatranckulubu@gmail.com';
export const RECOVERY_OWNER='b863cf0f-777f-4472-aa0b-f979ffbf2961';
export function staffIdentity(value){
 const s=String(value||'').trim();
 return s.toLowerCase()==='hskgsuygar32@gmail.com'?'baridayönetim':s.includes('@')?s.toLowerCase():s.toLocaleLowerCase('tr');
}
export async function requireAdministrator(client,token){
 const {data,error}=await client.auth.getUser(token);
 if(error||!data?.user)return{status:401,error:'Oturum sona erdi. Yeniden giriş yapın.'};
 // The authenticated Data API enforces the live auth.sessions check before reading profiles.
 const profile=await client.from('profiles').select('id,role').eq('id',data.user.id).maybeSingle();
 if(profile.error)return{status:401,error:'Oturum sona erdi. Yeniden giriş yapın.'};
 if(profile.data?.role!=='admin')return{status:403,error:'Bu işlem yalnızca yöneticiye açıktır.'};
 return{user:data.user};
}
export function validAdministratorName(value){return typeof value==='string'&&/^[\p{L}\p{N}_.-]+$/u.test(value.trim());}
