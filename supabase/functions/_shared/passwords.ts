// Domain-separated prehash avoids provider length limits; Supabase still bcrypt-hashes it.
// The scheme is stored only in admin-controlled app_metadata. Legacy users stay unchanged.
export const PASSWORD_SCHEME='barida-sha256-v1';
export async function encodePassword(value){
 if(typeof value!=='string'||value.length===0)throw Error('Şifre boş bırakılamaz.');
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('barida-password-v1:'+value));
 return 'Bd1!'+Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
}
export async function passwordForLogin(value,scheme){return scheme===PASSWORD_SCHEME?await encodePassword(value):value}
export async function newPasswordAttributes(value){return{password:await encodePassword(value),app_metadata:{barida_password_scheme:PASSWORD_SCHEME}}}
export async function changedPasswordAttributes(admin,id,value){
 const {data,error}=await admin.auth.admin.getUserById(id);if(error||!data.user)throw Error('Hesap bulunamadı.');
 return{password:await encodePassword(value),app_metadata:{...data.user.app_metadata,barida_password_scheme:PASSWORD_SCHEME}};
}
export async function signInPassword(client,identity,value){
 const password=await passwordForLogin(value,identity.scheme);
 const result=await client.auth.signInWithPassword({email:identity.email,password});
 // A password set outside the app is a legacy/raw credential again.
 if(result.error&&identity.scheme===PASSWORD_SCHEME)return client.auth.signInWithPassword({email:identity.email,password:value});
 return result;
}
